"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminTopbar from "@/components/admin/Topbar";
import Link from "next/link";
import { MILESTONES } from "@/types";
import { SkeletonTable, SkeletonCard } from "@/components/Skeletons";
import type { Student } from "@/types";

const statusColors: Record<string, { bg: string; text: string }> = {
  "In Progress": { bg: "rgba(59,130,246,0.15)", text: "#93c5fd" },
  "Action Required": { bg: "rgba(239,68,68,0.15)", text: "#fca5a5" },
  "Completed": { bg: "rgba(34,197,94,0.15)", text: "#86efac" },
  "On Hold": { bg: "rgba(234,179,8,0.15)", text: "#fde047" },
};

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      className="rounded-xl p-5 flex items-center gap-4"
      style={{
        background: "#1A1F2E",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: accent ?? "rgba(255,215,0,0.1)", color: "#FFD700" }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminTopbar title="Dashboard" subtitle="Loading metrics..." />
        <main className="flex-1 p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonTable rows={5} />
        </main>
      </div>
    );
  }

  const totalStudents = students.length;
  const actionRequired = students.filter((s) => s.status === "Action Required").length;
  const totalFeesCollected = students.reduce((sum, s) => sum + (s.feesPaid ?? 0), 0);
  const completedStudents = students.filter((s) => s.currentMilestone >= MILESTONES.length).length;

  return (
    <div className="flex flex-col min-h-screen">
      <AdminTopbar title="Dashboard" subtitle="Welcome back — here's what's happening" />

      <main className="flex-1 p-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Students"
            value={totalStudents}
            icon={
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <StatCard
            label="Action Required"
            value={actionRequired}
            accent="rgba(239,68,68,0.15)"
            icon={
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fca5a5" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            }
          />
          <StatCard
            label="Total Fees Collected"
            value={`₹${totalFeesCollected.toLocaleString("en-IN")}`}
            accent="rgba(34,197,94,0.1)"
            icon={
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#86efac" strokeWidth={2}>
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
          />
          <StatCard
            label="Journey Complete"
            value={completedStudents}
            accent="rgba(168,85,247,0.12)"
            icon={
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#d8b4fe" strokeWidth={2}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
          />
        </div>

        {/* Recent Students */}
        <div
          className="euro-card rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Table Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div>
              <h2
                className="font-semibold text-sm uppercase tracking-widest"
                style={{ color: "#FFD700", borderLeft: "3px solid #FFD700", paddingLeft: "10px" }}
              >
                Recent Students
              </h2>
            </div>
            <Link
              href="/admin/students"
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: "rgba(255,215,0,0.1)",
                color: "#FFD700",
                border: "1px solid rgba(255,215,0,0.25)",
              }}
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <SkeletonTable rows={5} />
          ) : students.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              style={{ background: "#1A1F2E" }}
            >
              <div className="text-4xl mb-3">🎓</div>
              <p className="text-white font-medium">No students yet</p>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                Add your first student to get started
              </p>
              <Link
                href="/admin/students"
                className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: "#FFD700", color: "#0A0E1A" }}
              >
                + Add Student
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Name", "Current Step", "Progress", "Status", "Fees"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "#FFD700" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 8).map((student) => {
                    const progress = Math.round(((student.currentMilestone ?? 1) / MILESTONES.length) * 100);
                    const statusStyle = statusColors[student.status] ?? statusColors["In Progress"];
                    const feePercent =
                      student.totalFees > 0
                        ? Math.round((student.feesPaid / student.totalFees) * 100)
                        : 0;

                    return (
                      <tr
                        key={student.id}
                        className="cursor-pointer transition-all duration-150"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                        onClick={() => window.location.href = `/admin/students/${student.id}`}
                      >
                        {/* Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700" }}
                            >
                              {(student.name ?? student.username)?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {student.name ?? student.username}
                              </p>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                                @{student.username}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Current Step */}
                        <td className="px-6 py-4">
                          <p className="text-white">
                            Step {student.currentMilestone ?? 1}
                          </p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                            {MILESTONES[(student.currentMilestone ?? 1) - 1]}
                          </p>
                        </td>

                        {/* Progress bar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="flex-1 h-1.5 rounded-full overflow-hidden"
                              style={{ background: "rgba(255,255,255,0.08)", minWidth: "80px" }}
                            >
                              <div
                                  className="h-full rounded-full transition-all duration-500 ease-in-out"
                                  style={{
                                    width: `${progress}%`,
                                  background: "#FFD700",
                                  boxShadow: progress > 0 ? "0 0 8px rgba(255,215,0,0.5)" : "none",
                                }}
                              />
                            </div>
                            <span className="text-xs shrink-0" style={{ color: "rgba(255,255,255,0.45)" }}>
                              {progress}%
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: statusStyle.bg, color: statusStyle.text }}
                          >
                            {student.status ?? "In Progress"}
                          </span>
                        </td>

                        {/* Fees */}
                        <td className="px-6 py-4">
                          {student.totalFees > 0 ? (
                            <div>
                              <p className="text-white text-xs">
                                ₹{(student.feesPaid ?? 0).toLocaleString("en-IN")} /{" "}
                                <span style={{ color: "rgba(255,255,255,0.4)" }}>
                                  ₹{student.totalFees.toLocaleString("en-IN")}
                                </span>
                              </p>
                              <div
                                className="mt-1 h-1 rounded-full overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.08)" }}
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-500 ease-in-out"
                                  style={{
                                    width: `${feePercent}%`,
                                    background: feePercent === 100 ? "#86efac" : "#FFD700",
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: "rgba(255,255,255,0.25)" }} className="text-xs">
                              Not set
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
