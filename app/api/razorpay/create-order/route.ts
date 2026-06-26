import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export async function POST(request: NextRequest) {
  try {
    const { studentId, requestedAmount } = await request.json();

    if (!studentId || !requestedAmount || requestedAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid request. Missing studentId or valid amount." },
        { status: 400 }
      );
    }

    // 1. Read finances from Firestore using Admin SDK
    const financesRef = adminDb.collection("finances").doc(studentId);
    const financesSnap = await financesRef.get();

    if (!financesSnap.exists) {
      return NextResponse.json(
        { error: "Fee structure not set up for this student." },
        { status: 404 }
      );
    }

    const { totalFees, paidAmount } = financesSnap.data() as { totalFees: number; paidAmount: number };
    const remaining = totalFees - paidAmount;

    // 2. Validate amount
    if (requestedAmount > remaining) {
      return NextResponse.json(
        { error: `Requested amount (₹${requestedAmount}) exceeds remaining balance (₹${remaining}).` },
        { status: 400 }
      );
    }

    if (remaining <= 0) {
      return NextResponse.json(
        { error: "Total fees are already paid." },
        { status: 400 }
      );
    }

    // 3. Create Razorpay order (Amount is in paise, so multiply by 100)
    const shortId = studentId.substring(0, 8);
    const options = {
      amount: requestedAmount * 100,
      currency: "INR",
      receipt: `rcpt_${shortId}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json(
      { error: "Failed to create order." },
      { status: 500 }
    );
  }
}
