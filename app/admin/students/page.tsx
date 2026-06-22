"use client";

import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminTopbar from "@/components/admin/Topbar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MILESTONES, APPLICATION_STATUSES } from "@/types";
import { updateStudentMilestone, updateStudentStatus } from "@/lib/collections";
import { SkeletonTable } from "@/components/Skeletons";
import type { Student, ApplicationStatus } from "@/types";

const statusColors: Record<string, { bg: string; text: string }> = {
  "In Progress": { bg: "rgba(59,130,246,0.15)", text: "#93c5fd" },
  "Action Required": { bg: "rgba(239,68,68,0.15)", text: "#fca5a5" },
  "Completed": { bg: "rgba(34,197,94,0.15)", text: "#86efac" },
  "On Hold": { bg: "rgba(234,179,8,0.15)", text: "#fde047" },
};

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Student));
      setStudents(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.name ?? "").toLowerCase().includes(q) ||
      (s.username ?? "").toLowerCase().includes(q) ||
      (s.email ?? "").toLowerCase().includes(q)
    );
  });

  const updateField = async (id: string, field: string, value: string | number) => {
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, "students", id), { [field]: value });
      // Also sync to users collection
      await updateDoc(doc(db, "users", id), { [field]: value }).catch(() => {});
    } catch (e) {
      console.error("Update error:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminTopbar title="Students" subtitle="Manage all student journeys" />

      <main className="flex-1 p-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="16" height="16" fill="none" viewBox="0 0 24 24"
              stroke="rgba(255,255,255,0.35)" strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-all"
              style={{
                background: "#1A1F2E",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(255,215,0,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          {/* Add Student */}
          <Link
            href="/admin/students/add"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shrink-0"
            style={{ background: "#FFD700", color: "#0A0E1A" }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Student
          </Link>
        </div>

        {/* Table */}
        <div 
          className="euro-card rounded-xl overflow-hidden" 
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {loading ? (
            <SkeletonTable rows={10} />
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 text-center"
              style={{ background: "#1A1F2E" }}
            >
              <div className="text-5xl mb-4">🎓</div>
              <p className="text-white font-semibold text-lg">
                {search ? "No students match your search" : "No students yet"}
              </p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                {search ? "Try a different name or email" : "Add your first student to get started"}
              </p>
              {!search && (
                <Link
                  href="/admin/students/add"
                  className="mt-5 px-5 py-2.5 rounded-lg text-sm font-semibold"
                  style={{ background: "#FFD700", color: "#0A0E1A" }}
                >
                  + Add Student
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    {["Student", "Phone", "Milestone", "Status", "Fees", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest"
                        style={{ color: "#FFD700" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => {
                    const statusStyle = statusColors[student.status] ?? statusColors["In Progress"];
                    const feePercent =
                      student.totalFees > 0
                        ? Math.min(100, Math.round((student.feesPaid / student.totalFees) * 100))
                        : 0;
                    const isUpdating = updatingId === student.id;

                    return (
                      <tr
                        key={student.id}
                        className="transition-all duration-150"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "rgba(255,255,255,0.025)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {/* Student */}
                        <td
                          className="px-5 py-3.5 cursor-pointer"
                          onClick={() => router.push(`/admin/students/${student.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                              style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700" }}
                            >
                              {(student.name ?? student.username)?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white">
                                {student.name ?? student.username}
                              </p>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                                {student.email ?? `@${student.username}`}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-5 py-3.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                          {student.phone || "—"}
                        </td>

                        {/* Milestone inline dropdown */}
                        <td className="px-5 py-3.5">
                          <select
                            value={student.currentMilestone ?? 1}
                            disabled={isUpdating}
                            onChange={(e) =>
                              updateField(student.id, "currentMilestone", Number(e.target.value))
                            }
                            className="text-xs px-2 py-1.5 rounded-lg outline-none transition-all cursor-pointer disabled:opacity-50"
                            style={{
                              background: "#0A0E1A",
                              color: "#FFD700",
                              border: "1px solid rgba(255,215,0,0.3)",
                              minWidth: "160px",
                            }}
                          >
                            {MILESTONES.map((m, i) => (
                              <option key={i + 1} value={i + 1}>
                                Step {i + 1}: {m}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Status inline dropdown */}
                        <td className="px-5 py-3.5">
                          <select
                            value={student.status ?? "In Progress"}
                            disabled={isUpdating}
                            onChange={(e) =>
                              updateField(student.id, "status", e.target.value)
                            }
                            className="text-xs px-2 py-1 rounded-full outline-none cursor-pointer disabled:opacity-50"
                            style={{
                              background: statusStyle.bg,
                              color: statusStyle.text,
                              border: "none",
                            }}
                          >
                            {APPLICATION_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Fees */}
                        <td className="px-5 py-3.5">
                          {student.totalFees > 0 ? (
                            <div style={{ minWidth: "120px" }}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-white">
                                  ₹{(student.feesPaid ?? 0).toLocaleString("en-IN")}
                                </span>
                                <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                                  {feePercent}%
                                </span>
                              </div>
                              <div
                                className="h-1.5 rounded-full overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.08)" }}
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-500 ease-in-out"
                                  style={{
                                    width: `${feePercent}%`,
                                    background: feePercent === 100 ? "#86efac" : "#FFD700",
                                    boxShadow:
                                      feePercent > 0
                                        ? "0 0 6px rgba(255,215,0,0.4)"
                                        : "none",
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                              Not set
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => router.push(`/admin/students/${student.id}`)}
                            className="text-xs px-3 py-1.5 rounded-lg transition-all"
                            style={{
                              background: "rgba(255,215,0,0.08)",
                              color: "#FFD700",
                              border: "1px solid rgba(255,215,0,0.2)",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "rgba(255,215,0,0.15)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "rgba(255,215,0,0.08)")
                            }
                          >
                            View Profile →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <p className="mt-3 text-xs text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
            Showing {filtered.length} of {students.length} students
          </p>
        )}
      </main>
    </div>
  );
}
