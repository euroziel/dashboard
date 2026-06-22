"use client";

import { useEffect, useState } from "react";
import StudentTopbar from "@/components/student/Topbar";
import { useAuth } from "@/context/AuthContext";
import { subscribeToStudents, subscribeToAnnouncements, subscribeToFinances } from "@/lib/collections";
import type { Student, Announcement, Finances } from "@/types";
import { MILESTONES } from "@/types";
import Link from "next/link";
import { SkeletonStudentDashboard } from "@/components/Skeletons";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [finances, setFinances] = useState<Finances | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // We can just use the subscribeToStudents but filter locally since we don't have a single-student subscription helper
    // Or we can just import doc/onSnapshot directly. The collection helper has subscribeToStudents.
    // For simplicity, we can fetch via subscribeToStudents and find our user.
    const unsubStudents = subscribeToStudents((all) => {
      const me = all.find((s) => s.username === user.username);
      if (me) setStudent(me);
      setLoading(false);
    });

    return () => unsubStudents();
  }, [user]);

  useEffect(() => {
    if (!student?.uid) return;

    const unsubAnnouncements = subscribeToAnnouncements(student.uid, (data) => {
      setAnnouncements(data);
    });

    const unsubFinances = subscribeToFinances(student.uid, (data) => {
      setFinances(data);
    });

    return () => {
      unsubAnnouncements();
      unsubFinances();
    };
  }, [student?.uid]);

  if (loading || !student) {
    return (
      <div className="flex flex-col min-h-screen">
        <StudentTopbar title="My Journey" subtitle="Track your progress to Germany" />
        <SkeletonStudentDashboard />
      </div>
    );
  }

  const currentStep = student.currentMilestone ?? 1;
  const progressPercent = Math.round((currentStep / 8) * 100);
  const feesPaid = finances?.paidAmount ?? student.feesPaid ?? 0;
  const totalFees = finances?.totalFees ?? student.totalFees ?? 0;
  const feePercent = totalFees > 0 ? Math.min(100, Math.round((feesPaid / totalFees) * 100)) : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <StudentTopbar title="My Journey" subtitle="Track your progress to Germany" />

      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Welcome Section */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Hello, {student.name ?? student.username} 👋
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)" }}>
              You are on step <strong style={{ color: "#FFD700" }}>{currentStep}</strong> of 8. Let's keep moving!
            </p>
          </div>
        </div>

        {/* Milestone Tracker (Roadmap) */}
        <div className="euro-card rounded-xl p-6 relative">
          <div className="absolute top-0 left-0 w-full h-1 overflow-hidden rounded-t-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
             <div 
               className="h-full transition-all duration-1000 ease-in-out" 
               style={{ 
                 width: `${progressPercent}%`, 
                 background: "#FFD700",
                 boxShadow: "0 0 15px #FFD700"
               }} 
             />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 mt-4">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,215,0,0.7)" }}>Current Step</p>
              <h3 className="text-xl font-bold text-white mb-2">{MILESTONES[currentStep - 1]}</h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                {student.status === "Action Required" 
                  ? "Action required on your part to proceed to the next step. Check announcements or documents." 
                  : "We are currently processing this step. We'll notify you once it's complete."}
              </p>
            </div>
            
            <div className="w-full sm:w-64 shrink-0 flex items-center justify-center p-6 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="text-center">
                 <div className="text-4xl font-bold mb-1" style={{ color: "#FFD700" }}>{progressPercent}%</div>
                 <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Journey Complete</p>
              </div>
            </div>
          </div>

          {/* Stepper Visual */}
          <div className="mt-8 flex justify-between relative pb-4">
             <div className="absolute top-4 left-0 w-full h-0.5" style={{ background: "rgba(255,255,255,0.1)", zIndex: 0 }} />
             {MILESTONES.map((milestone, idx) => {
               const stepNumber = idx + 1;
               const isCompleted = stepNumber < currentStep;
               const isCurrent = stepNumber === currentStep;
               
               // To prevent the last tooltip from overflowing the screen on the right edge
               const tooltipPositionClass = idx === MILESTONES.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2";
               
               return (
                 <div key={stepNumber} className="relative z-10 flex flex-col items-center group">
                   <div 
                     className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 relative z-20 cursor-pointer"
                     style={{
                       background: isCompleted ? "#FFD700" : isCurrent ? "#0A0E1A" : "#1A1F2E",
                       color: isCompleted ? "#0A0E1A" : isCurrent ? "#FFD700" : "rgba(255,255,255,0.3)",
                       border: isCurrent ? "2px solid #FFD700" : `1px solid ${isCompleted ? "#FFD700" : "rgba(255,255,255,0.2)"}`,
                       boxShadow: isCurrent ? "0 0 10px rgba(255,215,0,0.3)" : "none"
                     }}
                   >
                     {isCompleted ? "✓" : stepNumber}
                   </div>
                   {/* Tooltip on hover for larger screens */}
                   <div 
                     className={`absolute top-10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs px-3 py-1.5 rounded pointer-events-none z-30 shadow-lg ${tooltipPositionClass}`} 
                     style={{ background: "#FFD700", color: "#0A0E1A", fontWeight: "bold" }}
                   >
                     {milestone}
                   </div>
                 </div>
               )
             })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Dashboard Cards (Left 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Upload Center Card */}
              <div className="euro-card rounded-xl p-6 flex flex-col">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(255,215,0,0.1)", color: "#FFD700" }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <polyline points="9 15 12 12 15 15" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Upload Center</h3>
                <p className="text-sm flex-1 mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Manage and upload all required documents for your current step.
                </p>
                <Link href="/student/documents" className="block text-center py-2.5 rounded-lg text-sm font-semibold transition-all" style={{ background: "rgba(255,215,0,0.1)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.25)" }}>
                  Manage Documents →
                </Link>
              </div>

              {/* Fee Status Card */}
              <div className="euro-card rounded-xl p-6 flex flex-col">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(34,197,94,0.1)", color: "#86efac" }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Fee Status</h3>
                
                <div className="flex-1 mb-6">
                  {totalFees > 0 ? (
                    <div>
                      <div className="flex justify-between items-end mb-2">
                         <span className="text-xl font-bold text-white">₹{feesPaid.toLocaleString('en-IN')}</span>
                         <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>of ₹{totalFees.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
                        <div className="h-full rounded-full transition-all duration-500 ease-in-out" style={{ width: `${feePercent}%`, background: feePercent === 100 ? "#86efac" : "#FFD700" }} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Your fee structure has not been set up yet.</p>
                  )}
                </div>

                <Link href="/student/fees" className="block text-center py-2.5 rounded-lg text-sm font-semibold transition-all" style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}>
                  View Details
                </Link>
              </div>

            </div>
          </div>

          {/* Announcements Feed (Right Column) */}
          <div className="lg:col-span-1">
             <div className="euro-card rounded-xl flex flex-col h-full">
                <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <h3 className="font-semibold text-sm uppercase tracking-widest" style={{ color: "#FFD700" }}>Announcements</h3>
                </div>
                
                <div className="flex-1 p-5 overflow-y-auto" style={{ maxHeight: "400px" }}>
                  {announcements.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="text-3xl mb-2">📬</div>
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No new announcements.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((ann) => (
                        <div key={ann.id} className="p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <div className="flex justify-between items-start mb-2">
                             <h4 className="text-sm font-bold text-white">{ann.title}</h4>
                             {ann.type === "individual" && (
                               <span className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700" }}>Direct</span>
                             )}
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{ann.message}</p>
                          <p className="text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                            {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
