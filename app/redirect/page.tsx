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
      className="
      min-h-screen
      flex
      items-center
      justify-center
    "
    >
      <p className="text-xl">Loading...</p>
    </div>
  );
}
