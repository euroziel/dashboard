"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import StudentTopbar from "@/components/student/Topbar";
import { getStudent, createDocument, subscribeToStudentDocuments } from "@/lib/collections";
import type { Student, Document } from "@/types";
import { MILESTONES } from "@/types";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export default function StudentDocumentsPage() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<number>(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    async function load() {
      if (!user?.uid) return;
      const data = await getStudent(user.uid);
      if (data) {
        setStudent(data);
        setSelectedMilestone(data.currentMilestone ?? 1);
      }
    }
    load();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToStudentDocuments(user.uid, (docs) => {
      setDocuments(docs);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !student || !user?.uid) return;

    setIsUploading(true);
    setUploadProgress(0);

    const stepName = MILESTONES[selectedMilestone - 1].replace(/\s+/g, "_");
    const safeFilename = selectedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const storagePath = `documents/${user.uid}/${stepName}/${Date.now()}_${safeFilename}`;
    
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        alert("Upload failed. Please try again.");
        setIsUploading(false);
        setUploadProgress(0);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          await createDocument({
            studentId: user.uid,
            studentName: student.name ?? student.username,
            milestoneIndex: selectedMilestone,
            milestoneName: MILESTONES[selectedMilestone - 1],
            fileName: selectedFile.name,
            fileUrl: downloadURL,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
            status: "pending",
            uploadedAt: new Date().toISOString()
          });

          setSelectedFile(null);
          // reset file input visually
          const fileInput = document.getElementById("file-upload") as HTMLInputElement;
          if (fileInput) fileInput.value = "";
          
        } catch (err) {
          console.error("Failed to save document metadata:", err);
          alert("Upload successful, but failed to link document to your profile.");
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return { bg: "rgba(34,197,94,0.15)", text: "#86efac" };
      case "rejected": return { bg: "rgba(239,68,68,0.15)", text: "#fca5a5" };
      default: return { bg: "rgba(255,215,0,0.15)", text: "#FFD700" }; // pending
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
      <StudentTopbar title="Document Center" subtitle="Upload and track your application documents" />

      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
        
        {/* LEFT: Upload Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="euro-card rounded-xl p-6 sticky top-8">
            <h2 className="text-xl font-bold text-white mb-6">Upload Document</h2>
            
            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Related Journey Step
                </label>
                <select
                  value={selectedMilestone}
                  onChange={(e) => setSelectedMilestone(Number(e.target.value))}
                  disabled={isUploading}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all cursor-pointer disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                >
                  {MILESTONES.map((m, i) => (
                    <option key={i + 1} value={i + 1}>Step {i + 1}: {m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Select File
                </label>
                <input
                  id="file-upload"
                  type="file"
                  required
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold transition-all disabled:opacity-50"
                  style={{ 
                    border: "1px dashed rgba(255,215,0,0.3)", 
                    padding: "16px", 
                    borderRadius: "8px",
                    background: "rgba(255,215,0,0.02)"
                  }}
                />
                <style>{`
                  input[type=file]::file-selector-button {
                    background-color: #FFD700;
                    color: #0A0E1A;
                    transition: all 0.2s;
                    cursor: pointer;
                  }
                  input[type=file]::file-selector-button:hover {
                    background-color: #e6c200;
                  }
                `}</style>
                <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Supported formats: PDF, JPG, PNG (Max 5MB)
                </p>
              </div>

              {isUploading && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Uploading...</span>
                    <span style={{ color: "#FFD700" }}>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, background: "#FFD700" }} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="w-full py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                style={{ background: "#FFD700", color: "#0A0E1A" }}
              >
                {isUploading ? "Uploading..." : "Upload Document"}
                {!isUploading && (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: Uploaded Documents List */}
        <div className="lg:col-span-2">
          <div className="euro-card rounded-xl flex flex-col h-full">
            <div className="px-6 py-5 border-b flex justify-between items-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="font-semibold text-sm uppercase tracking-widest" style={{ color: "#FFD700" }}>My Documents</h3>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: "rgba(255,255,255,0.05)", color: "white" }}>
                {documents.length} Total
              </span>
            </div>
            
            <div className="flex-1 p-6">
              {documents.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">📄</div>
                  <p className="text-white font-medium text-lg">No documents uploaded yet</p>
                  <p className="text-sm mt-1 max-w-xs mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Select a journey step and upload your first requirement.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => {
                    const statusStyle = getStatusColor(doc.status);
                    
                    return (
                      <div key={doc.id} className="p-4 rounded-xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center transition-colors hover:bg-white/5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
                             <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.4)" }}>
                               <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                               <polyline points="14 2 14 8 20 8" />
                               <line x1="16" y1="13" x2="8" y2="13" />
                               <line x1="16" y1="17" x2="8" y2="17" />
                               <polyline points="10 9 9 9 8 9" />
                             </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                             <h4 className="font-bold text-white text-sm truncate mb-1" title={doc.fileName}>{doc.fileName}</h4>
                             <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                               Step {doc.milestoneIndex}: {doc.milestoneName} • {(doc.fileSize ?? 0) > 1024 * 1024 ? `${((doc.fileSize ?? 0) / (1024 * 1024)).toFixed(2)} MB` : `${Math.round((doc.fileSize ?? 0) / 1024)} KB`}
                             </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full sm:w-auto gap-4 shrink-0 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-white/5">
                           <div className="flex flex-col sm:items-end gap-1">
                              <span className="text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold w-fit" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                                {doc.status}
                              </span>
                              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                           </div>
                           
                           <a 
                             href={doc.fileUrl} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="p-2 rounded-lg transition-colors"
                             style={{ background: "rgba(255,215,0,0.1)", color: "#FFD700" }}
                             title="View Document"
                           >
                              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                           </a>
                        </div>

                        {/* Admin Rejection Note if any */}
                        {doc.status === "rejected" && doc.reviewNote && (
                          <div className="w-full mt-3 p-3 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                             <strong>Admin Note:</strong> {doc.reviewNote}
                          </div>
                        )}
                        
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
