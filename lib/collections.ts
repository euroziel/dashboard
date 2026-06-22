// ============================================
// EuroZiel Portal — Firestore Collection Helpers
// All CRUD operations for every collection
// ============================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  User,
  Student,
  Admin,
  Finances,
  Announcement,
  Document,
  ApplicationStatus,
  DocumentStatus,
  PaymentRecord,
} from "@/types";

// ─────────────────────────────────────────
// Collection References
// ─────────────────────────────────────────
export const usersCol = collection(db, "users");
export const studentsCol = collection(db, "students");
export const adminsCol = collection(db, "admins");
export const announcementsCol = collection(db, "announcements");
export const documentsCol = collection(db, "documents");
export const financesCol = collection(db, "finances");

// ─────────────────────────────────────────
// USERS
// ─────────────────────────────────────────
export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as User) : null;
}

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(db, "users", uid), data);
}

// ─────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────
export async function getAllStudents(): Promise<Student[]> {
  const snap = await getDocs(query(studentsCol, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
}

export async function getStudent(uid: string): Promise<Student | null> {
  const snap = await getDoc(doc(db, "students", uid));
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as Student) : null;
}

export async function updateStudent(uid: string, data: Partial<Student>): Promise<void> {
  await updateDoc(doc(db, "students", uid), data);
  // Sync relevant fields to users collection
  const syncFields: Partial<User> = {};
  if (data.currentMilestone !== undefined) syncFields.currentMilestone = data.currentMilestone;
  if (data.status !== undefined) syncFields.status = data.status as ApplicationStatus;
  if (data.name !== undefined) syncFields.name = data.name;
  if (data.phone !== undefined) syncFields.phone = data.phone;
  if (Object.keys(syncFields).length > 0) {
    await updateDoc(doc(db, "users", uid), syncFields).catch(() => {});
  }
}

/** Real-time listener for all students */
export function subscribeToStudents(
  callback: (students: Student[]) => void,
  constraints: QueryConstraint[] = []
): Unsubscribe {
  const q = query(studentsCol, orderBy("createdAt", "desc"), ...constraints);
  return onSnapshot(q, (snap) => {
    const students = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
    callback(students);
  });
}

// ─────────────────────────────────────────
// MILESTONE & STATUS UPDATES
// ─────────────────────────────────────────
export async function updateMilestone(studentId: string, milestone: number): Promise<void> {
  const data = { currentMilestone: milestone };
  await updateDoc(doc(db, "students", studentId), data);
  await updateDoc(doc(db, "users", studentId), data).catch(() => {});
}

export async function updateStatus(studentId: string, status: ApplicationStatus): Promise<void> {
  const data = { status };
  await updateDoc(doc(db, "students", studentId), data);
  await updateDoc(doc(db, "users", studentId), data).catch(() => {});
}

// ─────────────────────────────────────────
// FINANCES
// ─────────────────────────────────────────
export async function getFinances(studentId: string): Promise<Finances | null> {
  const snap = await getDoc(doc(db, "finances", studentId));
  return snap.exists() ? (snap.data() as Finances) : null;
}

export async function setFinances(
  studentId: string,
  data: Partial<Finances>
): Promise<void> {
  const ref = doc(db, "finances", studentId);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, { ...data, updatedAt: new Date().toISOString() });
  } else {
    await setDoc(ref, {
      studentId,
      totalFees: 0,
      paidAmount: 0,
      currency: "INR",
      history: [],
      updatedAt: new Date().toISOString(),
      ...data,
    });
  }
  // Also sync totalFees / feesPaid to students doc
  if (data.totalFees !== undefined) {
    await updateDoc(doc(db, "students", studentId), {
      totalFees: data.totalFees,
    }).catch(() => {});
  }
  if (data.paidAmount !== undefined) {
    await updateDoc(doc(db, "students", studentId), {
      feesPaid: data.paidAmount,
    }).catch(() => {});
  }
}

export async function recordPayment(
  studentId: string,
  payment: Omit<PaymentRecord, "paidAt">
): Promise<void> {
  const ref = doc(db, "finances", studentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const finances = snap.data() as Finances;
  const newHistory = [
    ...finances.history,
    { ...payment, paidAt: new Date().toISOString() },
  ];
  const newPaidAmount = (payment.status === "Failed" || payment.status === "Abandoned") 
    ? finances.paidAmount 
    : finances.paidAmount + payment.amount;

  await updateDoc(ref, {
    history: newHistory,
    paidAmount: newPaidAmount,
    updatedAt: new Date().toISOString(),
  });
  // Sync to students doc
  await updateDoc(doc(db, "students", studentId), {
    feesPaid: newPaidAmount,
  }).catch(() => {});
}

/** Real-time listener for a student's finances */
export function subscribeToFinances(
  studentId: string,
  callback: (finances: Finances | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "finances", studentId), (snap) => {
    callback(snap.exists() ? (snap.data() as Finances) : null);
  });
}

// ─────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────
export async function createAnnouncement(
  data: Omit<Announcement, "id">
): Promise<string> {
  const ref = await addDoc(announcementsCol, {
    ...data,
    createdAt: new Date().toISOString(),
    readBy: [],
  });
  return ref.id;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(db, "announcements", id));
}

/** Real-time listener for announcements targeted to a specific student OR global */
export function subscribeToAnnouncements(
  studentId: string | "all",
  callback: (announcements: Announcement[]) => void
): Unsubscribe {
  // For students: fetch their specific + global announcements
  const q =
    studentId === "all"
      ? query(announcementsCol, orderBy("createdAt", "desc"))
      : query(announcementsCol, orderBy("createdAt", "desc"));

  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
    // Client-side filter for student-specific
    const filtered =
      studentId === "all"
        ? all
        : all.filter((a) => a.targetId === "all" || a.targetId === studentId);
    callback(filtered);
  });
}

export async function markAnnouncementRead(
  announcementId: string,
  studentId: string
): Promise<void> {
  const ref = doc(db, "announcements", announcementId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const readBy: string[] = snap.data().readBy ?? [];
  if (!readBy.includes(studentId)) {
    await updateDoc(ref, { readBy: [...readBy, studentId] });
  }
}

// ─────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────
export async function createDocument(
  data: Omit<Document, "id">
): Promise<string> {
  const ref = await addDoc(documentsCol, {
    ...data,
    uploadedAt: new Date().toISOString(),
    status: "pending" as DocumentStatus,
  });
  return ref.id;
}

export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus,
  reviewNote?: string
): Promise<void> {
  await updateDoc(doc(db, "documents", id), {
    status,
    reviewedAt: new Date().toISOString(),
    ...(reviewNote !== undefined ? { reviewNote } : {}),
  });
}

/** Real-time listener for documents of a specific student */
export function subscribeToStudentDocuments(
  studentId: string,
  callback: (documents: Document[]) => void
): Unsubscribe {
  const q = query(
    documentsCol,
    where("studentId", "==", studentId),
    orderBy("uploadedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Document));
    callback(docs);
  });
}

/** Get all documents (admin view) */
export function subscribeToAllDocuments(
  callback: (documents: Document[]) => void
): Unsubscribe {
  const q = query(documentsCol, orderBy("uploadedAt", "desc"));
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Document));
    callback(docs);
  });
}
