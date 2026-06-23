"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { subscribeToAnnouncements, markAnnouncementRead } from "@/lib/collections";
import type { Announcement } from "@/types";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function StudentTopbar({ title, subtitle }: TopbarProps) {
  const { user } = useAuth();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid) return;
    
    const unsub = subscribeToAnnouncements(user.uid, (data) => {
      setAnnouncements(data);
    });

    return () => unsub();
  }, [user]);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const unreadCount = announcements.filter(a => !a.readBy?.includes(user?.uid ?? "")).length;

  const handleMarkAsRead = async (ann: Announcement) => {
    if (user?.uid && !ann.readBy?.includes(user.uid)) {
      await markAnnouncementRead(ann.id, user.uid);
    }
    setSelectedAnnouncement(ann);
    setIsDropdownOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    for (const ann of announcements) {
      if (!ann.readBy?.includes(user.uid)) {
        await markAnnouncementRead(ann.id, user.uid);
      }
    }
  };

  return (
    <>
      <header
        className="flex items-center justify-between px-4 md:px-8 py-4 relative z-40"
        style={{
          background: "rgba(10, 14, 26, 0.8)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <button 
            className="md:hidden shrink-0 text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-white truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs md:text-sm mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
              {subtitle}
            </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6 shrink-0 ml-2">
          {/* Notification Bell */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="relative p-2 rounded-full transition-colors hover:bg-white/5 outline-none"
              style={{ color: isDropdownOpen ? "#E5A800" : "rgba(255,255,255,0.6)" }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#030617]"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl overflow-hidden"
                style={{ background: "#1A1F2E", border: "1px solid rgba(255,255,255,0.1)", transformOrigin: "top right" }}
              >
                <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <h3 className="font-bold text-sm text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] uppercase tracking-wider hover:text-white transition-colors"
                      style={{ color: "#E5A800" }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {announcements.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>You have no notifications.</p>
                    </div>
                  ) : (
                    announcements.map((ann) => {
                      const isUnread = !ann.readBy?.includes(user?.uid ?? "");
                      return (
                        <div 
                          key={ann.id} 
                          onClick={() => handleMarkAsRead(ann)}
                          className="p-4 border-b last:border-0 cursor-pointer transition-colors"
                          style={{ 
                            borderColor: "rgba(255,255,255,0.04)",
                            background: isUnread ? "rgba(229, 168, 0,0.03)" : "transparent"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = isUnread ? "rgba(229, 168, 0,0.03)" : "transparent")}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: isUnread ? "#E5A800" : "white" }}>
                              {isUnread && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>}
                              {ann.title}
                            </h4>
                          </div>
                          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                            {ann.message}
                          </p>
                          <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                            {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 border-l pl-6" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.username ?? "Student"}</p>
              <p className="text-xs" style={{ color: "#E5A800" }}>Student</p>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "rgba(229, 168, 0,0.15)", color: "#E5A800", border: "1px solid rgba(229, 168, 0,0.3)" }}
            >
              {user?.username?.charAt(0).toUpperCase() ?? "S"}
            </div>
          </div>
        </div>
      </header>

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
    </>
  );
}
