"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import StudentTopbar from "@/components/student/Topbar";
import { getStudent, updateStudent } from "@/lib/collections";
import type { Student } from "@/types";

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    educationalBackground: "",
  });

  useEffect(() => {
    async function load() {
      if (!user?.uid) return;
      try {
        const data = await getStudent(user.uid);
        if (data) {
          setStudent(data);
          setFormData({
            phone: data.phone ?? "",
            address: data.address ?? "",
            educationalBackground: data.educationalBackground ?? "",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      await updateStudent(user.uid, formData);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !student) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen" style={{ background: "#0A0E1A" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#FFD700" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <StudentTopbar title="My Profile" subtitle="Manage your personal information" />

      <main className="flex-1 p-8 max-w-4xl w-full mx-auto space-y-8">
        
        {/* Read-Only Identity Card */}
        <div className="rounded-xl p-8 flex items-center gap-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shrink-0"
            style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.3)" }}
          >
            {(student.name ?? student.username)?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{student.name ?? student.username}</h2>
            <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>@{student.username} • {student.email}</p>
            <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold" style={{ background: "rgba(34,197,94,0.15)", color: "#86efac" }}>
              Active Student
            </span>
          </div>
        </div>

        {/* Editable Profile Form */}
        <div className="rounded-xl p-8" style={{ background: "#1A1F2E", border: "1px solid rgba(255,255,255,0.08)" }}>
           <h3 className="text-lg font-bold text-white mb-6" style={{ borderLeft: "3px solid #FFD700", paddingLeft: "10px" }}>
             Contact & Background Details
           </h3>

           <form onSubmit={handleSubmit} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg text-sm text-white outline-none transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>
                
                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Educational Background
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech in Computer Science"
                    value={formData.educationalBackground}
                    onChange={(e) => setFormData(p => ({ ...p, educationalBackground: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg text-sm text-white outline-none transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>
             </div>

             <div>
               <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                 Residential Address
               </label>
               <textarea
                 rows={3}
                 placeholder="Enter your full permanent address"
                 value={formData.address}
                 onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                 className="w-full px-4 py-3 rounded-lg text-sm text-white outline-none transition-colors resize-none"
                 style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                 onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
                 onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
               />
             </div>

             <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                  style={{ background: "#FFD700", color: "#0A0E1A", boxShadow: "0 4px 14px rgba(255,215,0,0.2)" }}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                  {!isSaving && (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                  )}
                </button>
             </div>
           </form>
        </div>
      </main>
    </div>
  );
}
