"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminSidebar from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "admin") {
        router.push("/login");
      }
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0A0E1A" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#FFD700", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0E1A" }}>
      <AdminSidebar />
      {/* Main content — offset by sidebar width on desktop */}
      <div className="md:ml-64 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
