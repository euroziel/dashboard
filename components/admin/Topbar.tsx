"use client";

import { useAuth } from "@/context/AuthContext";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function AdminTopbar({ title, subtitle }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header
      className="flex items-center justify-between px-8 py-4"
      style={{
        background: "rgba(10, 14, 26, 0.8)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-4">
        <button 
          className="md:hidden text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
          onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {subtitle}
          </p>
        )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white">{user?.username ?? "Admin"}</p>
          <p className="text-xs" style={{ color: "#E5A800" }}>Administrator</p>
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: "rgba(229, 168, 0,0.15)", color: "#E5A800", border: "1px solid rgba(229, 168, 0,0.3)" }}
        >
          {user?.username?.charAt(0).toUpperCase() ?? "A"}
        </div>
      </div>
    </header>
  );
}
