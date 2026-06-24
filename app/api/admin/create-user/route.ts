import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, username, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, password, role" },
        { status: 400 }
      );
    }

    // Create the Firebase Auth user via Admin SDK
    // (Admin SDK does NOT sign out the current admin user)
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    const uid = userRecord.uid;
    const now = new Date().toISOString();

    // Write to Firestore users collection
    await adminDb.collection("users").doc(uid).set({
      uid,
      name,
      email,
      username: username || email.split("@")[0],
      phone: phone || "",
      role,
      currentMilestone: 1,
      status: "In Progress",
      feesPaid: 0,
      totalFees: 0,
      createdAt: now,
    });

    // If student, also write to students collection (for backward compat)
    if (role === "student") {
      await adminDb.collection("students").doc(uid).set({
        uid,
        name,
        email,
        username: username || email.split("@")[0],
        password, // Note: stored for username/password login flow
        phone: phone || "",
        currentMilestone: 1,
        status: "In Progress",
        feesPaid: 0,
        totalFees: 0,
        createdAt: now,
      });
    }

    // If admin, write to admins collection
    if (role === "admin") {
      await adminDb.collection("admins").doc(uid).set({
        uid,
        name,
        email,
        username: username || email.split("@")[0],
        password,
        createdAt: now,
      });
    }

    return NextResponse.json(
      { success: true, uid, message: `${role} account created successfully.` },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("CREATE USER ERROR:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
