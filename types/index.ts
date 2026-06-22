// ============================================
// EuroZiel Portal — Shared TypeScript Types
// ============================================

// ─────────────────────────────────────────
// USERS (Firestore: /users/{uid})
// Unified record for both admins and students
// ─────────────────────────────────────────
export interface User {
  uid: string;
  email: string;
  name: string;
  username: string;
  phone?: string;
  role: "admin" | "student";
  currentMilestone: number; // 1–8 (students only)
  status: ApplicationStatus;
  createdAt: string; // ISO string
}

// ─────────────────────────────────────────
// STUDENTS (Firestore: /students/{uid})
// Extended student profile — mirrors User + extra fields
// ─────────────────────────────────────────
export interface Student extends User {
  role: "student";
  address?: string;
  dateOfBirth?: string;
  educationalBackground?: string;
  profilePhotoUrl?: string;
  totalFees: number;
  feesPaid: number;
  password?: string; // stored for username/password login
}

// ─────────────────────────────────────────
// ADMINS (Firestore: /admins/{uid})
// ─────────────────────────────────────────
export interface Admin {
  uid: string;
  name: string;
  email: string;
  username: string;
  password?: string;
  createdAt: string;
}

// ─────────────────────────────────────────
// FINANCES (Firestore: /finances/{studentId})
// One document per student
// ─────────────────────────────────────────
export interface Finances {
  studentId: string;
  totalFees: number;
  paidAmount: number;
  currency: "INR";
  history: PaymentRecord[];
  updatedAt: string;
}

export interface PaymentRecord {
  amount: number;
  paidAt: string; // ISO string
  method?: string; // "Razorpay" | "Cash" | "Bank Transfer"
  razorpayPaymentId?: string;
  note?: string;
  status?: "Successful" | "Failed" | "Abandoned";
}

// ─────────────────────────────────────────
// ANNOUNCEMENTS (Firestore: /announcements/{id})
// Global or individual messages from admin
// ─────────────────────────────────────────
export interface Announcement {
  id: string;
  type: "global" | "individual";
  targetId: string | "all"; // studentId or "all"
  title: string;
  message: string;
  createdAt: string;
  createdBy: string; // admin username
  readBy?: string[]; // array of studentIds who have read it
}

// ─────────────────────────────────────────
// DOCUMENTS (Firestore: /documents/{id})
// Student uploaded files per milestone
// ─────────────────────────────────────────
export interface Document {
  id: string;
  studentId: string;
  studentName?: string;
  milestoneIndex: number; // 1–8
  milestoneName?: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  status: DocumentStatus;
  uploadedAt: string;
  reviewedAt?: string;
  reviewNote?: string; // admin's rejection/approval note
}

// ─────────────────────────────────────────
// SHARED ENUMS / TYPES
// ─────────────────────────────────────────
export type ApplicationStatus =
  | "In Progress"
  | "Action Required"
  | "Completed"
  | "On Hold";

export type DocumentStatus = "pending" | "verified" | "rejected";

export const MILESTONES: string[] = [
  "Profile Verification",
  "APS Support",
  "University Match",
  "SOP / LOR",
  "Application",
  "Offer Letter",
  "Visa",
  "Flight to Germany",
];

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "In Progress",
  "Action Required",
  "Completed",
  "On Hold",
];
