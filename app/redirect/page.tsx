"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

export default function RedirectPage() {
  const { user, loading } = useAuth();

  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Not logged in
      if (!user) {
        router.push("/login");
      }

      // Admin
      else if (user.role === "admin") {
        router.push("/admin");
      }

      // Student
      else if (user.role === "student") {
        router.push("/student");
      } else {
        router.push("/login");
      }
    }
  }, [loading, user, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#0A0E1A" }}
    >
      <div className="text-center">
        <div
          className="inline-block w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mb-4"
          style={{ borderColor: "#FFD700", borderTopColor: "transparent" }}
        />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          Redirecting...
        </p>
      </div>
    </div>
  );
}
