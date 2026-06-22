"use client";

import { useAuth } from "@/context/AuthContext";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function StudentTopbar({ title, subtitle }: TopbarProps) {
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
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white">{user?.username ?? "Student"}</p>
          <p className="text-xs" style={{ color: "#FFD700" }}>Student</p>
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700", border: "1px solid rgba(255,215,0,0.3)" }}
        >
          {user?.username?.charAt(0).toUpperCase() ?? "S"}
        </div>
      </div>
    </header>
  );
}
