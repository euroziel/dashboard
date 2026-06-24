import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      studentId,
      amountPaid, // the amount passed from frontend that we verified in create-order
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !studentId || !amountPaid) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Verify Signature
    const secret = process.env.RAZORPAY_KEY_SECRET as string;
    const bodyString = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyString.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Signature matches, update Firestore safely using Admin SDK
    const financesRef = adminDb.collection("finances").doc(studentId);
    
    // We use a transaction to safely increment paidAmount and append to history
    await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(financesRef);
      if (!doc.exists) {
        throw new Error("Finances record not found.");
      }
      
      const data = doc.data();
      const currentPaid = data?.paidAmount || 0;
      const newPaidAmount = currentPaid + amountPaid;
      
      const history = data?.history || [];
      const newPaymentRecord = {
        amount: amountPaid,
        paidAt: new Date().toISOString(),
        method: "Razorpay",
        razorpayPaymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: "Successful"
      };

      transaction.update(financesRef, {
        paidAmount: newPaidAmount,
        history: [...history, newPaymentRecord],
        updatedAt: new Date().toISOString()
      });

      // Also update the students collection for redundancy
      const studentRef = adminDb.collection("students").doc(studentId);
      transaction.update(studentRef, {
        feesPaid: newPaidAmount
      });
    });

    return NextResponse.json({ success: true, message: "Payment verified successfully" });
  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment." },
      { status: 500 }
    );
  }
}
