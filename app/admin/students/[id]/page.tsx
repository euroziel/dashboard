"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  getStudent, 
  getFinances, 
  setFinances, 
  updateStudent, 
  createAnnouncement, 
  subscribeToAnnouncements,
  subscribeToStudentDocuments,
  updateDocumentStatus,
  getSystemSettings
} from "@/lib/collections";
import type { Student, Finances, PaymentRecord, Announcement, Document, MilestoneConfig } from "@/types";
import { MILESTONES, APPLICATION_STATUSES } from "@/types";
import AdminTopbar from "@/components/admin/Topbar";
import { useAuth } from "@/context/AuthContext";

export default function StudentProfilePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [finances, setFinancesData] = useState<Finances | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Fee Modal State
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [isConfirmFeeModalOpen, setIsConfirmFeeModalOpen] = useState(false);
  const [feeForm, setFeeForm] = useState({ totalFees: 0, paidAmount: 0 });
  const [isSavingFee, setIsSavingFee] = useState(false);

  // Profile Edit Modal State
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    address: "",
    educationalBackground: "",
    dateOfBirth: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Announcement State
  const [noteTitle, setNoteTitle] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [selectedNoteFile, setSelectedNoteFile] = useState<File | null>(null);
  const [isPostingNote, setIsPostingNote] = useState(false);

  // Documents State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [settings, setSettings] = useState<MilestoneConfig[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [studentData, financeData, settingsData] = await Promise.all([
          getStudent(id),
          getFinances(id),
          getSystemSettings(),
        ]);
        if (studentData) {
          setStudent(studentData);
          setFeeForm({
            totalFees: financeData?.totalFees ?? studentData.totalFees ?? 0,
            paidAmount: financeData?.paidAmount ?? studentData.feesPaid ?? 0,
          });
        }
        setFinancesData(financeData);
        if (settingsData?.milestoneConfigs) {
          setSettings(settingsData.milestoneConfigs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();

    const unsubAnnouncements = subscribeToAnnouncements(id, (data) => {
      // Only show individual notes in this specific view, global notes are in the main page
      setAnnouncements(data.filter((a) => a.type === "individual" && a.targetId === id));
    });

    const unsubDocs = subscribeToStudentDocuments(id, (data) => {
      setDocuments(data);
    });

    return () => {
      unsubAnnouncements();
      unsubDocs();
    };
  }, [id]);

  const handleUpdateFees = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmFeeModalOpen(true);
  };

  const executeFeeUpdate = async () => {
    setIsSavingFee(true);
    try {
      await setFinances(id, {
        totalFees: Number(feeForm.totalFees),
        paidAmount: Number(feeForm.paidAmount),
      });
      // Refresh local data
      const newFinances = await getFinances(id);
      setFinancesData(newFinances);
      const newStudent = await getStudent(id);
      if (newStudent) setStudent(newStudent);
      
      setIsConfirmFeeModalOpen(false);
      setIsFeeModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update fees.");
    } finally {
      setIsSavingFee(false);
    }
  };

  const updateStudentField = async (field: string, value: string | number) => {
    try {
      await updateStudent(id, { [field]: value });
      setStudent((prev) => prev ? { ...prev, [field]: value } : null);
    } catch (e) {
      console.error(e);
      alert("Failed to update status/milestone.");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateStudent(id, profileForm);
      setStudent(prev => prev ? { ...prev, ...profileForm } : null);
      setIsEditProfileModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteMessage.trim()) return;

    setIsPostingNote(true);
    
    let attachmentUrl = "";
    let attachmentName = "";
    if (selectedNoteFile) {
       alert("Storage is not yet enabled in this environment. Using a mock URL for the attachment.");
       attachmentUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
       attachmentName = selectedNoteFile.name;
    }

    try {
      await createAnnouncement({
        type: "individual",
        targetId: id as string,
        title: noteTitle.trim(),
        message: noteMessage.trim(),
        createdBy: user?.username ?? "Admin",
        ...(attachmentUrl ? { attachmentUrl, attachmentName } : {})
      });
      setNoteTitle("");
      setNoteMessage("");
      setSelectedNoteFile(null);
    } catch (err) {
      console.error(err);
      alert("Failed to post note.");
    } finally {
      setIsPostingNote(false);
    }
  };

  const handleDocumentStatus = async (docId: string, status: "approved" | "rejected") => {
    try {
      await updateDocumentStatus(docId, status);
    } catch (err) {
      console.error(err);
      alert("Failed to update document status.");
    }
  };

  const mandatoryRequirements = settings.filter(s => s.requirement === "mandatory" && s.milestoneIndex <= (student?.currentMilestone ?? 1));

  const handleSendReminder = async () => {
    const missingDocs = mandatoryRequirements.filter(req => 
       !documents.some(d => d.milestoneIndex === req.milestoneIndex && d.status !== "rejected")
    ).map(req => `Step ${req.milestoneIndex}: ${MILESTONES[req.milestoneIndex - 1]}`);

    if (missingDocs.length === 0) {
      alert("This student has uploaded all mandatory documents for their current step.");
      return;
    }

    try {
      await createAnnouncement({
        type: "individual",
        targetId: id as string,
        title: "Action Required: Missing Mandatory Documents",
        message: `Please upload the following required documents to proceed:\n\n${missingDocs.join("\n")}`,
        createdBy: user?.username ?? "System",
      });
      alert("Reminder sent successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to send reminder.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen" style={{ background: "#030617" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E5A800" }} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen text-center p-8" style={{ background: "#030617" }}>
        <p className="text-white text-xl font-bold mb-4">Student not found.</p>
        <button onClick={() => router.push("/admin/students")} className="text-sm px-4 py-2 rounded-lg" style={{ background: "#1B73BA", color: "white" }}>
          ← Back to Students
        </button>
      </div>
    );
  }

  const currentStep = student.currentMilestone ?? 1;
  const progressPercent = Math.round((currentStep / MILESTONES.length) * 100);
  const actualTotalFees = finances?.totalFees ?? student.totalFees ?? 0;
  const actualPaidFees = finances?.paidAmount ?? student.feesPaid ?? 0;
  const feePercent = actualTotalFees > 0 ? Math.min(100, Math.round((actualPaidFees / actualTotalFees) * 100)) : 0;

  return (
    <div className="flex flex-col min-h-screen relative">
      <AdminTopbar title="Student Profile" subtitle={`Managing profile for ${student.name ?? student.username}`} />

      <main className="flex-1 p-4 md:p-8">
        <button 
          onClick={() => router.push("/admin/students")}
          className="mb-6 flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#E5A800")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
        >
          ← Back to directory
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT COLUMN: Profile Info & Status Controls */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Identity Card */}
            <div className="euro-card rounded-xl p-6 relative">
              <button 
                onClick={() => {
                  setProfileForm({
                    name: student.name || "",
                    phone: student.phone || "",
                    address: student.address || "",
                    educationalBackground: student.educationalBackground || "",
                    dateOfBirth: student.dateOfBirth || "",
                  });
                  setIsEditProfileModalOpen(true);
                }}
                className="absolute top-6 right-6 text-xs px-3 py-1.5 rounded-md font-semibold transition-all"
                style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              >
                Edit
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
                  style={{ background: "rgba(229, 168, 0,0.15)", color: "#E5A800", border: "1px solid rgba(229, 168, 0,0.3)" }}
                >
                  {(student.name ?? student.username)?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{student.name ?? student.username}</h2>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>@{student.username}</p>
                </div>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Email Address</p>
                  <p className="text-white">{student.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Phone Number</p>
                  <p className="text-white">{student.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Registered On</p>
                  <p className="text-white">
                    {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Controls Card */}
            <div className="euro-card rounded-xl p-6">
              <h3 className="font-bold text-lg text-white mb-5" style={{ borderLeft: "3px solid #E5A800", paddingLeft: "10px" }}>Journey Controls</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Current Milestone
                  </label>
                  <select
                    value={currentStep}
                    onChange={(e) => updateStudentField("currentMilestone", Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E5A800" }}
                  >
                    {MILESTONES.map((m, i) => {
                      const text = `Step ${i + 1}: ${m}`;
                      const display = text.length > 25 ? text.slice(0, 25) + "..." : text;
                      return (
                        <option key={i + 1} value={i + 1} style={{ background: "#1A1F2E", color: "white", fontSize: "14px" }}>
                          {display}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Process Status
                  </label>
                  <select
                    value={student.status}
                    onChange={(e) => updateStudentField("status", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s} value={s} style={{ background: "#1A1F2E", color: "white", fontSize: "14px" }}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Progress & Fees */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Journey Progress */}
            <div className="euro-card rounded-xl p-6">
               <h3 className="font-bold text-lg text-white mb-6" style={{ borderLeft: "3px solid #E5A800", paddingLeft: "10px" }}>Journey Progress</h3>
               
               <div className="flex items-center justify-between mb-2">
                 <p className="text-sm font-medium text-white">Step {currentStep}: {MILESTONES[currentStep - 1]}</p>
                 <p className="text-sm font-bold" style={{ color: "#E5A800" }}>{progressPercent}%</p>
               </div>
               <div className="w-full h-2 rounded-full overflow-hidden mb-8" style={{ background: "rgba(255,255,255,0.05)" }}>
                 <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%`, background: "#E5A800", boxShadow: "0 0 10px #E5A800" }} />
               </div>

               {/* Quick Stepper */}
               <div className="flex justify-between relative">
                 <div className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2" style={{ background: "rgba(255,255,255,0.1)", zIndex: 0 }} />
                 {MILESTONES.map((m, idx) => {
                   const sNum = idx + 1;
                   const isPast = sNum < currentStep;
                   const isCurr = sNum === currentStep;
                   return (
                     <div 
                       key={sNum} 
                       className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10"
                       style={{
                         background: isPast ? "#E5A800" : isCurr ? "#030617" : "#1A1F2E",
                         color: isPast ? "#030617" : isCurr ? "#E5A800" : "rgba(255,255,255,0.3)",
                         border: isCurr ? "2px solid #E5A800" : `1px solid ${isPast ? "#E5A800" : "rgba(255,255,255,0.2)"}`
                       }}
                     >
                       {isPast ? "✓" : sNum}
                     </div>
                   );
                 })}
               </div>
            </div>

            {/* Fee Control Section */}
            <div className="euro-card rounded-xl p-6">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold text-lg text-white" style={{ borderLeft: "3px solid #86efac", paddingLeft: "10px" }}>Fee Status</h3>
                 <button 
                   onClick={() => setIsFeeModalOpen(true)}
                   className="text-xs px-3 py-1.5 rounded-md font-semibold transition-all"
                   style={{ background: "rgba(34,197,94,0.1)", color: "#86efac", border: "1px solid rgba(34,197,94,0.2)" }}
                   onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34,197,94,0.2)")}
                   onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(34,197,94,0.1)")}
                 >
                   Update Fees
                 </button>
               </div>

               {actualTotalFees > 0 ? (
                 <div>
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-2xl font-bold text-white">₹{actualPaidFees.toLocaleString('en-IN')}</span>
                       <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>of ₹{actualTotalFees.toLocaleString('en-IN')} ({feePercent}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
                      <div className="h-full rounded-full transition-all duration-500 ease-in-out" style={{ width: `${feePercent}%`, background: feePercent === 100 ? "#86efac" : "#E5A800" }} />
                    </div>
                 </div>
               ) : (
                 <div className="py-6 text-center rounded-lg mb-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Fee structure has not been set for this student.</p>
                 </div>
               )}
            </div>

            {/* Individual Notes */}
            <div className="euro-card rounded-xl p-6">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-lg text-white" style={{ borderLeft: "3px solid #1B73BA", paddingLeft: "10px" }}>Direct Notes</h3>
               </div>
               
               {/* Post Note Form */}
               <form onSubmit={handlePostNote} className="mb-6 space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Subject (e.g. Needs updated passport)"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => (e.target.style.borderColor = "#E5A800")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                  <textarea
                    required
                    rows={2}
                    placeholder="Write a message directly to this student..."
                    value={noteMessage}
                    onChange={(e) => setNoteMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => (e.target.style.borderColor = "#E5A800")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                  <input
                    type="file"
                    onChange={(e) => setSelectedNoteFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                  <button
                    type="submit"
                    disabled={isPostingNote || !noteTitle.trim() || !noteMessage.trim()}
                    className="w-full py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                    style={{ background: "rgba(59,130,246,0.15)", color: "#93c5fd" }}
                  >
                    {isPostingNote ? "Posting..." : "Send Direct Note"}
                  </button>
               </form>

               {/* Notes History */}
               <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                 {announcements.length === 0 ? (
                   <p className="text-sm text-center py-4" style={{ color: "rgba(255,255,255,0.4)" }}>No direct notes sent yet.</p>
                 ) : (
                   announcements.map(ann => (
                     <div key={ann.id} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                       <div className="flex justify-between items-start mb-1">
                         <h4 className="font-bold text-sm text-white">{ann.title}</h4>
                         {ann.readBy?.includes(id) && (
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1B73BA" strokeWidth="2">
                             <polyline points="20 6 9 17 4 12"></polyline>
                           </svg>
                         )}
                       </div>
                       <p className="text-xs mb-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{ann.message}</p>
                       
                       {ann.attachmentUrl && (
                         <div className="mb-3">
                           <a 
                             href={ann.attachmentUrl} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors hover:bg-white/10"
                             style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                           >
                             <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                               <path d="M21.44 11.05l-9.19 9.19a6 6 0 1 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                             </svg>
                             {ann.attachmentName || "Attached Document"}
                           </a>
                         </div>
                       )}

                       <div className="flex justify-between items-center text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                         <span>By {ann.createdBy}</span>
                         <span>{new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </div>

            {/* Uploaded Documents Section */}
            <div className="euro-card rounded-xl p-6">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-lg text-white" style={{ borderLeft: "3px solid #E5A800", paddingLeft: "10px" }}>Document Center</h3>
               </div>

               {/* Mandatory Checklist */}
               {mandatoryRequirements.length > 0 && (
                 <div className="mb-6 p-4 rounded-lg" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
                   <div className="flex items-center justify-between mb-3">
                     <h4 className="text-xs uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>
                       Mandatory Requirements for Step {student?.currentMilestone}
                     </h4>
                     <button
                       onClick={handleSendReminder}
                       className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                       style={{ background: "rgba(59,130,246,0.1)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.2)" }}
                       onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.2)")}
                       onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.1)")}
                     >
                       Send Reminder
                     </button>
                   </div>
                   
                   <div className="space-y-2">
                     {mandatoryRequirements.map(req => {
                        const isUploaded = documents.some(d => d.milestoneIndex === req.milestoneIndex && d.status !== "rejected");
                        const mName = MILESTONES[req.milestoneIndex - 1];
                        return (
                          <div key={req.milestoneIndex} className="flex items-center gap-3 text-sm">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ 
                              background: isUploaded ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                              color: isUploaded ? "#86efac" : "#fca5a5"
                            }}>
                              {isUploaded ? "✓" : "!"}
                            </div>
                            <span style={{ color: isUploaded ? "rgba(255,255,255,0.8)" : "white", textDecoration: isUploaded ? "line-through" : "none" }}>
                              Step {req.milestoneIndex}: {mName}
                            </span>
                          </div>
                        );
                     })}
                   </div>
                 </div>
               )}
               
               <h4 className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>All Uploads</h4>
               <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                 {documents.length === 0 ? (
                   <p className="text-sm text-center py-4" style={{ color: "rgba(255,255,255,0.4)" }}>No documents uploaded by this student.</p>
                 ) : (
                   documents.map(doc => (
                     <div key={doc.id} className="p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                       <div>
                         <h4 className="font-bold text-sm text-white mb-1">{doc.milestoneName || doc.fileName}</h4>
                         <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                           <a 
                             href={doc.fileUrl} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                             className="hover:underline text-blue-400"
                           >
                             {doc.fileName}
                           </a> 
                           {" "}• {new Date(doc.uploadedAt).toLocaleDateString()}
                         </p>
                         
                         <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold" style={{ 
                           background: doc.status === "approved" ? "rgba(34,197,94,0.15)" : doc.status === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(229, 168, 0,0.15)", 
                           color: doc.status === "approved" ? "#86efac" : doc.status === "rejected" ? "#fca5a5" : "#E5A800" 
                         }}>
                           {doc.status}
                         </span>
                       </div>
                       
                       <div className="flex gap-2 shrink-0">
                         {doc.status === "pending" && (
                           <>
                             <button 
                               onClick={() => handleDocumentStatus(doc.id, "approved")}
                               className="px-3 py-1.5 rounded-md text-xs font-bold transition-all"
                               style={{ background: "rgba(34,197,94,0.1)", color: "#86efac", border: "1px solid rgba(34,197,94,0.2)" }}
                               onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34,197,94,0.2)")}
                               onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(34,197,94,0.1)")}
                             >
                               Approve
                             </button>
                             <button 
                               onClick={() => handleDocumentStatus(doc.id, "rejected")}
                               className="px-3 py-1.5 rounded-md text-xs font-bold transition-all"
                               style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}
                               onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
                               onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                             >
                               Reject
                             </button>
                           </>
                         )}
                         {doc.status !== "pending" && (
                            <button 
                              onClick={() => handleDocumentStatus(doc.id, "pending")}
                              className="px-3 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all"
                              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                            >
                              Reset
                            </button>
                         )}
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </div>

          </div>
        </div>
      </main>

      {/* Fee Update Modal */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(10,14,26,0.8)", backdropFilter: "blur(4px)" }}>
           <div className="euro-card w-full max-w-md rounded-xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Update Fee Structure</h3>
              
              <form onSubmit={handleUpdateFees} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Total Fees (₹)</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    value={feeForm.totalFees} 
                    onChange={(e) => setFeeForm(p => ({ ...p, totalFees: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => e.target.style.borderColor = "#E5A800"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Paid Amount (₹)</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    max={feeForm.totalFees || undefined}
                    value={feeForm.paidAmount} 
                    onChange={(e) => setFeeForm(p => ({ ...p, paidAmount: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => e.target.style.borderColor = "#E5A800"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>

                <div className="flex gap-3 pt-4 mt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                   <button 
                     type="button" 
                     onClick={() => setIsFeeModalOpen(false)}
                     className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                     style={{ background: "rgba(255,255,255,0.05)", color: "white" }}
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit" 
                     disabled={isSavingFee}
                     className="flex-1 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50"
                     style={{ background: "#1B73BA", color: "white" }}
                   >
                     {isSavingFee ? "Saving..." : "Save Fees"}
                   </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* Confirm Fee Update Modal */}
      {isConfirmFeeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: "rgba(10,14,26,0.9)", backdropFilter: "blur(8px)" }}>
           <div className="euro-card w-full max-w-md rounded-xl p-6 shadow-2xl border border-red-500/30">
              <div className="flex items-center gap-3 mb-4 text-red-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <h3 className="text-lg font-bold">Confirm Fee Update</h3>
              </div>
              
              <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                Are you sure you want to set this fee structure? This will permanently update the student's financial records.
              </p>

              <div className="p-4 rounded-lg mb-6" style={{ background: "rgba(0,0,0,0.3)" }}>
                <div className="flex justify-between mb-2">
                  <span className="text-xs uppercase tracking-widest font-bold text-white/50">Total Fees:</span>
                  <span className="text-sm font-bold text-white">₹{Number(feeForm.totalFees).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs uppercase tracking-widest font-bold text-white/50">Paid Amount:</span>
                  <span className="text-sm font-bold text-green-400">₹{Number(feeForm.paidAmount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex gap-3">
                 <button 
                   type="button" 
                   onClick={() => setIsConfirmFeeModalOpen(false)}
                   className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                   style={{ background: "rgba(255,255,255,0.05)", color: "white" }}
                 >
                   Cancel
                 </button>
                 <button 
                   type="button" 
                   onClick={executeFeeUpdate}
                   disabled={isSavingFee}
                   className="flex-1 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                   style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}
                 >
                   {isSavingFee ? "Saving..." : "Confirm & Save"}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(10,14,26,0.8)", backdropFilter: "blur(4px)" }}>
           <div className="euro-card w-full max-w-md rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-white mb-6">Edit Student Profile</h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Full Name</label>
                  <input 
                    type="text" 
                    value={profileForm.name} 
                    onChange={(e) => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => e.target.style.borderColor = "#E5A800"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
                
                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Phone Number</label>
                  <input 
                    type="tel" 
                    value={profileForm.phone} 
                    onChange={(e) => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => e.target.style.borderColor = "#E5A800"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Date of Birth</label>
                  <input 
                    type="date" 
                    value={profileForm.dateOfBirth} 
                    onChange={(e) => setProfileForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => e.target.style.borderColor = "#E5A800"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Address</label>
                  <textarea 
                    rows={2}
                    value={profileForm.address} 
                    onChange={(e) => setProfileForm(p => ({ ...p, address: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => e.target.style.borderColor = "#E5A800"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
                
                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Educational Background</label>
                  <textarea 
                    rows={2}
                    value={profileForm.educationalBackground} 
                    onChange={(e) => setProfileForm(p => ({ ...p, educationalBackground: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => e.target.style.borderColor = "#E5A800"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>

                <div className="flex gap-3 pt-4 mt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                   <button 
                     type="button" 
                     onClick={() => setIsEditProfileModalOpen(false)}
                     className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                     style={{ background: "rgba(255,255,255,0.05)", color: "white" }}
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit" 
                     disabled={isSavingProfile}
                     className="flex-1 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50"
                     style={{ background: "#1B73BA", color: "white" }}
                   >
                     {isSavingProfile ? "Saving..." : "Save Profile"}
                   </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
