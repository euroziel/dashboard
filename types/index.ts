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
  currentMilestone: number; // 1–15 (students only)
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
  attachmentUrl?: string;
  attachmentName?: string;
}

// ─────────────────────────────────────────
// DOCUMENTS (Firestore: /documents/{id})
// Student uploaded files per milestone
// ─────────────────────────────────────────
export interface Document {
  id: string;
  studentId: string;
  studentName?: string;
  milestoneIndex: number; // 1–15
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
// RESOURCES (Firestore: /resources/{id})
// Study materials uploaded by admin
// ─────────────────────────────────────────
export interface StudyResource {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  createdBy: string;
  files: { name: string; url: string }[];
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

export type DocumentRequirement = "optional" | "mandatory" | "not_required";

export interface MilestoneConfig {
  milestoneIndex: number;
  requirement: DocumentRequirement;
}

export interface SystemSettings {
  milestoneConfigs?: MilestoneConfig[];
}

export const MILESTONES: string[] = [
  "Profile Verification",
  "University & Course Selection",
  "APS Application",
  "SOP / LOR / CV Creation",
  "IELTS / GRE / German Prep",
  "University Application",
  "Offer Letter",
  "Loan Assistance",
  "Blocked Account Opening",
  "Insurance Assistance",
  "Visa Guidance",
  "Flight to Germany",
  "On-Arrival Pickup",
  "Accommodation",
  "Settling in Germany"
];

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "In Progress",
  "Action Required",
  "Completed",
  "On Hold",
];
