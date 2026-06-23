"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);

      // Check admins collection
      const adminQuery = query(
        collection(db, "admins"),
        where("username", "==", username),
        where("password", "==", password),
      );
      const adminSnapshot = await getDocs(adminQuery);

      if (!adminSnapshot.empty) {
        const admin = adminSnapshot.docs[0].data();
        login({ 
          uid: admin.uid,
          username: admin.username, 
          role: "admin",
          name: admin.name,
          email: admin.email
        });
        router.push("/redirect");
        return;
      }

      // Check students collection
      const studentQuery = query(
        collection(db, "students"),
        where("username", "==", username),
        where("password", "==", password),
      );
      const studentSnapshot = await getDocs(studentQuery);

      if (!studentSnapshot.empty) {
        const student = studentSnapshot.docs[0].data();
        login({ 
          uid: student.uid,
          username: student.username, 
          role: "student",
          name: student.name,
          email: student.email
        });
        router.push("/redirect");
        return;
      }

      setError("Invalid username or password. Please try again.");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: "#030617" }}
    >
      {/* Ambient background glow */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ backgroundColor: "#E5A800" }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-8 blur-[100px] pointer-events-none"
        style={{ backgroundColor: "#E5A800" }}
      />

      {/* Login Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl p-8"
        style={{
          background: "rgba(26, 31, 46, 0.85)",
          border: "1px solid rgba(229, 168, 0, 0.2)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 0 60px rgba(229, 168, 0, 0.05), 0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(229, 168, 0, 0.2), rgba(229, 168, 0, 0.05))",
              border: "2px solid rgba(229, 168, 0, 0.5)",
            }}
          >
            <span className="text-2xl font-bold" style={{ color: "#E5A800" }}>E</span>
          </div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "#E5A800" }}
          >
            EuroZiel
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Student Portal — Sign in to continue
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="mb-5 px-4 py-3 rounded-lg text-sm"
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        {/* Username field */}
        <div className="mb-4">
          <label
            className="block text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: "rgba(229, 168, 0,0.7)" }}
          >
            Username
          </label>
          <input
            id="login-username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 rounded-lg text-white placeholder-white/30 outline-none transition-all duration-200"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
            onFocus={(e) => {
              e.target.style.border = "1px solid rgba(229, 168, 0, 0.6)";
              e.target.style.boxShadow = "0 0 0 3px rgba(229, 168, 0, 0.08)";
            }}
            onBlur={(e) => {
              e.target.style.border = "1px solid rgba(255, 255, 255, 0.12)";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Password field */}
        <div className="mb-6">
          <label
            className="block text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: "rgba(229, 168, 0,0.7)" }}
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 rounded-lg text-white placeholder-white/30 outline-none transition-all duration-200"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
            onFocus={(e) => {
              e.target.style.border = "1px solid rgba(229, 168, 0, 0.6)";
              e.target.style.boxShadow = "0 0 0 3px rgba(229, 168, 0, 0.08)";
            }}
            onBlur={(e) => {
              e.target.style.border = "1px solid rgba(255, 255, 255, 0.12)";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Login button */}
        <button
          id="login-submit"
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: loading
              ? "rgba(229, 168, 0, 0.5)"
              : "#E5A800",
            color: "#030617",
            boxShadow: loading ? "none" : "0 0 20px rgba(229, 168, 0, 0.3)",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              (e.target as HTMLButtonElement).style.boxShadow = "0 0 30px rgba(229, 168, 0, 0.5)";
              (e.target as HTMLButtonElement).style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              (e.target as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(229, 168, 0, 0.3)";
              (e.target as HTMLButtonElement).style.transform = "translateY(0)";
            }
          }}
        >
          {loading ? "Verifying..." : "Sign In"}
        </button>

        {/* Footer note */}
        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.25)" }}>
          Contact your EuroZiel advisor if you need access.
        </p>
      </div>
    </div>
  );
}
