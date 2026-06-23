"use client";

import { useEffect, useState } from "react";
import { subscribeToResources } from "@/lib/collections";
import type { StudyResource } from "@/types";
import StudentTopbar from "@/components/student/Topbar";
import { useAuth } from "@/context/AuthContext";

export default function StudentResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToResources((data) => {
      setResources(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen" style={{ background: "#030617" }}>
        <div className="animate-spin w-8 h-8 border-4 border-[#E5A800] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: "#030617" }}>
      <StudentTopbar title="Study Resources" />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Study Materials</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Access all your prep guides, application templates, and reading materials here.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.length === 0 ? (
              <div className="col-span-full py-16 text-center euro-card rounded-xl">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>No Materials Available</p>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Check back later for new resources from your admin.</p>
              </div>
            ) : (
              resources.map((res) => (
                <div key={res.id} className="euro-card rounded-xl p-6 flex flex-col h-full shadow-lg transition-transform hover:-translate-y-1">
                  {res.thumbnailUrl && (
                    <div className="w-full h-40 mb-4 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 border border-white/10">
                      <img src={res.thumbnailUrl} alt={res.title} className="w-full h-full object-cover transition-transform hover:scale-105" />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg text-white leading-tight">{res.title}</h3>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(229, 168, 0,0.1)", color: "#E5A800" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  <p className="text-sm flex-1 mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{res.description}</p>
                  
                  <div className="space-y-2 mt-auto pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <p className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Download Files ({res.files?.length || 0})
                    </p>
                    {res.files?.map((file, i) => (
                      <a 
                        key={i}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all hover:bg-white/10"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2" className="shrink-0">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                          </svg>
                          <span className="truncate text-white/80 group-hover:text-white transition-colors">{file.name}</span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-white/30 group-hover:text-white transition-colors">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
