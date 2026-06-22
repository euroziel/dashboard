"use client";

import { useEffect, useState } from "react";
import AdminTopbar from "@/components/admin/Topbar";
import { createAnnouncement, subscribeToAnnouncements } from "@/lib/collections";
import type { Announcement } from "@/types";
import { useAuth } from "@/context/AuthContext";

export default function GlobalAnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // "all" means fetch global + all targetId (subscribeToAnnouncements does this when targetId is "all")
    const unsub = subscribeToAnnouncements("all", (data) => {
      // Filter strictly for global ones to show in this view
      setAnnouncements(data.filter((a) => a.type === "global"));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await createAnnouncement({
        type: "global",
        targetId: "all",
        title: title.trim(),
        message: message.trim(),
        createdBy: user?.username ?? "Admin",
      });
      setTitle("");
      setMessage("");
    } catch (error) {
      console.error(error);
      alert("Failed to post announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminTopbar title="Global Announcements" subtitle="Send messages to all students" />

      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
        
        {/* Creator Form */}
        <div>
          <div className="euro-card rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Post New Announcement</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Subject / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Visa Interview Updates"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-white outline-none transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Message Content
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Write your announcement here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm text-white outline-none transition-colors resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !message.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: "#FFD700", color: "#0A0E1A" }}
              >
                {isSubmitting ? "Posting..." : "Post to All Students"}
                {!isSubmitting && (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* History List */}
        <div className="lg:col-span-1">
           <div className="euro-card rounded-xl flex flex-col h-full">
              <div className="px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <h3 className="font-semibold text-sm uppercase tracking-widest" style={{ color: "#FFD700" }}>Past Announcements</h3>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 250px)" }}>
                {announcements.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📢</div>
                    <p className="text-white font-medium">No announcements yet</p>
                    <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Use the form to post your first message.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((ann) => (
                      <div key={ann.id} className="p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-bold text-white text-base">{ann.title}</h4>
                           <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold" style={{ background: "rgba(34,197,94,0.15)", color: "#86efac" }}>Global</span>
                        </div>
                        <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>{ann.message}</p>
                        
                        <div className="flex items-center justify-between text-xs" style={{ color: "rgba(255,255,255,0.35)", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                          <span>Posted by {ann.createdBy}</span>
                          <span>{new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
