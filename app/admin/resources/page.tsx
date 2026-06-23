"use client";

import { useEffect, useState } from "react";
import { subscribeToResources, createResource, deleteResource } from "@/lib/collections";
import type { StudyResource } from "@/types";
import AdminTopbar from "@/components/admin/Topbar";
import { useAuth } from "@/context/AuthContext";

export default function AdminResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToResources((data) => {
      setResources(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || selectedFiles.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      // Mock File Upload since Storage is disabled
      // In production, this will iterate through selectedFiles and upload to Firebase Storage
      const mockUploadedFiles = selectedFiles.map(f => ({
        name: f.name,
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
      }));

      await createResource({
        title,
        description,
        createdBy: user?.username ?? "Admin",
        files: mockUploadedFiles,
      });

      alert("Resource uploaded successfully! (Mock storage used)");
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setSelectedFiles([]);
    } catch (err) {
      console.error(err);
      alert("Failed to create resource.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this study material?")) return;
    try {
      await deleteResource(id);
    } catch (err) {
      console.error(err);
      alert("Failed to delete resource.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen" style={{ background: "#030617" }}>
        <div className="animate-spin w-8 h-8 border-4 border-[#E5A800] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: "#030617" }}>
      <AdminTopbar title="Study Resources" />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Resource Library</h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                Upload study materials, prep guides, and required readings for students.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all"
              style={{ background: "#1B73BA", color: "white" }}
            >
              + Upload Resource
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {resources.length === 0 ? (
              <div className="col-span-full py-12 text-center euro-card rounded-xl">
                <p style={{ color: "rgba(255,255,255,0.5)" }}>No study materials available yet.</p>
              </div>
            ) : (
              resources.map((res) => (
                <div key={res.id} className="euro-card rounded-xl p-6 flex flex-col h-full relative group">
                  <button 
                    onClick={() => handleDelete(res.id)}
                    className="absolute top-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 text-red-400"
                    title="Delete Resource"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                  <h3 className="font-bold text-lg text-white mb-2 pr-8">{res.title}</h3>
                  <p className="text-sm flex-1 mb-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{res.description}</p>
                  
                  <div className="space-y-2 mt-auto pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Attached Files ({res.files?.length || 0})
                    </p>
                    {res.files?.map((file, i) => (
                      <a 
                        key={i}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
                        style={{ background: "rgba(255,255,255,0.03)", color: "#93c5fd" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                          <polyline points="13 2 13 9 20 9"></polyline>
                        </svg>
                        <span className="truncate">{file.name}</span>
                      </a>
                    ))}
                  </div>

                  <div className="mt-4 text-[10px] flex justify-between" style={{ color: "rgba(255,255,255,0.3)" }}>
                    <span>By {res.createdBy}</span>
                    <span>{new Date(res.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(10,14,26,0.8)", backdropFilter: "blur(4px)" }}>
           <div className="euro-card w-full max-w-lg rounded-xl p-6 shadow-2xl border border-white/5">
              <h3 className="text-lg font-bold text-white mb-6">Upload Study Material</h3>
              
              <form onSubmit={handleCreateResource} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Resource Title</label>
                  <input 
                    type="text" 
                    required 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. APS Application Guide"
                    className="w-full px-4 py-3 rounded-lg text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => e.target.style.borderColor = "#E5A800"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
                
                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Description</label>
                  <textarea 
                    required 
                    rows={3}
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about what these materials cover..."
                    className="w-full px-4 py-3 rounded-lg text-sm text-white outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={(e) => e.target.style.borderColor = "#E5A800"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Attach Files (Multiple Allowed)</label>
                  <input 
                    type="file" 
                    required
                    multiple
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 rounded-lg text-sm text-white outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#E5A800] file:text-[#030617] hover:file:bg-[#e6c200] file:cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.2)" }}
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg space-y-1" style={{ background: "rgba(0,0,0,0.2)" }}>
                      <p className="text-[10px] uppercase font-bold text-white/50 mb-2">Selected Files ({selectedFiles.length}):</p>
                      {selectedFiles.map((f, i) => (
                        <div key={i} className="text-xs text-white/80 truncate">• {f.name}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-6 mt-2">
                   <button 
                     type="button" 
                     onClick={() => setIsModalOpen(false)}
                     className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all hover:bg-white/10"
                     style={{ background: "rgba(255,255,255,0.05)", color: "white" }}
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit" 
                     disabled={isSubmitting || selectedFiles.length === 0}
                     className="flex-1 py-3 rounded-lg text-sm font-bold disabled:opacity-50 transition-all hover:brightness-110"
                     style={{ background: "#1B73BA", color: "white" }}
                   >
                     {isSubmitting ? "Uploading..." : "Upload Material"}
                   </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
