"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { subscribeToAnnouncements } from "@/lib/collections";
import type { Announcement } from "@/types";
import StudentTopbar from "@/components/student/Topbar";

export default function StudentAnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementFilter, setAnnouncementFilter] = useState<"all" | "direct" | "general">("all");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubAnnouncements = subscribeToAnnouncements(user.uid, (data) => {
      setAnnouncements(data);
      setLoading(false);
    });

    return () => unsubAnnouncements();
  }, [user]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen" style={{ background: "#030617" }}>
        <div className="animate-spin w-8 h-8 border-4 border-[#E5A800] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const filteredAnnouncements = announcements.filter((ann) => {
    if (announcementFilter === "all") return true;
    if (announcementFilter === "direct") return ann.type === "individual";
    if (announcementFilter === "general") return ann.type === "global";
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: "#030617" }}>
      <StudentTopbar title="Announcements" subtitle="Stay updated with the latest news" />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Announcements</h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                View important updates from EuroZiel.
              </p>
            </div>
          </div>

          <div className="euro-card rounded-xl flex flex-col h-full shadow-lg">
            <div className="px-5 py-4 border-b flex gap-2" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <button 
                onClick={() => setAnnouncementFilter("all")}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${announcementFilter === "all" ? "bg-[#1B73BA] text-white" : "bg-white/5 text-white/50 hover:text-white"}`}
              >
                All
              </button>
              <button 
                onClick={() => setAnnouncementFilter("direct")}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${announcementFilter === "direct" ? "bg-[#1B73BA] text-white" : "bg-white/5 text-white/50 hover:text-white"}`}
              >
                Direct
              </button>
              <button 
                onClick={() => setAnnouncementFilter("general")}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${announcementFilter === "general" ? "bg-[#1B73BA] text-white" : "bg-white/5 text-white/50 hover:text-white"}`}
              >
                General
              </button>
            </div>

            <div className="flex-1 p-6">
              {filteredAnnouncements.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-4">📬</div>
                  <p className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>No announcements</p>
                  <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>There are no announcements in this category right now.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAnnouncements.map((ann) => (
                    <div 
                      key={ann.id} 
                      onClick={() => setSelectedAnnouncement(ann)}
                      className="p-5 rounded-lg transition-transform hover:-translate-y-1 shadow-md cursor-pointer" 
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <div className="flex justify-between items-start mb-3">
                         <h3 className="text-lg font-bold text-white">{ann.title}</h3>
                         {ann.type === "individual" ? (
                           <span className="text-xs font-bold px-2 py-1 rounded uppercase tracking-wider" style={{ background: "rgba(229, 168, 0,0.15)", color: "#E5A800" }}>Direct</span>
                         ) : (
                           <span className="text-xs font-bold px-2 py-1 rounded uppercase tracking-wider" style={{ background: "rgba(27, 115, 186,0.15)", color: "#1B73BA" }}>General</span>
                         )}
                      </div>
                      <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>{ann.message}</p>
                      
                      {ann.attachmentUrl && (
                        <div className="mt-4">
                          <a 
                            href={ann.attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors hover:bg-white/10"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                          >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 1 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                            </svg>
                            {ann.attachmentName || "Attached Document"}
                          </a>
                        </div>
                      )}

                      <p className="text-xs mt-4 pt-4 border-t" style={{ color: "rgba(255,255,255,0.3)", borderColor: "rgba(255,255,255,0.05)" }}>
                        Posted on {new Date(ann.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Message Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" style={{ background: "rgba(10,14,26,0.8)", backdropFilter: "blur(4px)" }}>
          <div className="euro-card w-full max-w-lg rounded-xl p-6 md:p-8 shadow-2xl relative">
            <button 
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            
            <div className="mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(229, 168, 0,0.15)", color: "#E5A800" }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">{selectedAnnouncement.title}</h2>
                <p className="text-[11px] uppercase tracking-widest mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {new Date(selectedAnnouncement.createdAt).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            
            <div className="p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">
                {selectedAnnouncement.message}
              </p>
            </div>
            
            {selectedAnnouncement.attachmentUrl && (
              <div className="mt-6">
                <a 
                  href={selectedAnnouncement.attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 1 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  Open Attached Document
                </a>
              </div>
            )}
            
            <div className="mt-8 text-right">
              <button 
                onClick={() => setSelectedAnnouncement(null)}
                className="px-6 py-2.5 rounded-lg text-sm font-bold transition-colors"
                style={{ background: "#1B73BA", color: "white" }}
              >
                Close Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
