"use client";

import { useState } from "react";
import AdminTopbar from "@/components/admin/Topbar";
import { useRouter } from "next/navigation";

export default function AddStudentPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    phone: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name || !form.email || !form.password) {
      setError("Name, email, and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create user.");
        return;
      }

      setSuccess(`✅ ${form.role === "admin" ? "Admin" : "Student"} "${form.name}" created successfully!`);
      setForm({ name: "", email: "", username: "", password: "", phone: "", role: "student" });

      setTimeout(() => router.push("/admin/students"), 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "white",
  };

  const fields = [
    { name: "name", label: "Full Name", type: "text", placeholder: "e.g. Rahul Sharma", required: true },
    { name: "email", label: "Email Address", type: "email", placeholder: "rahul@email.com", required: true },
    { name: "username", label: "Username", type: "text", placeholder: "rahulsharma (optional)", required: false },
    { name: "phone", label: "Phone Number", type: "tel", placeholder: "+91 98765 43210", required: false },
    { name: "password", label: "Password", type: "password", placeholder: "Set a secure password", required: true },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AdminTopbar title="Add User" subtitle="Create a new student or admin account" />

      <main className="flex-1 p-8">
        <div className="max-w-xl mx-auto">
          <div
            className="euro-card rounded-xl p-8"
          >
            <h2
              className="font-bold text-lg mb-6"
              style={{ color: "#E5A800", borderLeft: "3px solid #E5A800", paddingLeft: "12px" }}
            >
              New Account Details
            </h2>

            {error && (
              <div
                className="mb-5 px-4 py-3 rounded-lg text-sm"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="mb-5 px-4 py-3 rounded-lg text-sm"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#86efac" }}
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(229, 168, 0,0.7)" }}>
                  Role
                </label>
                <div className="flex gap-3">
                  {["student", "admin"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, role: r }))}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize"
                      style={{
                        background: form.role === r ? "#E5A800" : "rgba(255,255,255,0.05)",
                        color: form.role === r ? "#030617" : "rgba(255,255,255,0.5)",
                        border: form.role === r ? "none" : "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {r === "student" ? "🎓 Student" : "👑 Admin"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields */}
              {fields.map((f) => (
                <div key={f.name}>
                  <label
                    className="block text-xs font-semibold uppercase tracking-widest mb-2"
                    style={{ color: "rgba(229, 168, 0,0.7)" }}
                  >
                    {f.label} {f.required && <span style={{ color: "#fca5a5" }}>*</span>}
                  </label>
                  <input
                    type={f.type}
                    name={f.name}
                    placeholder={f.placeholder}
                    value={form[f.name as keyof typeof form]}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all placeholder-white/25"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = "rgba(229, 168, 0,0.5)";
                      e.target.style.boxShadow = "0 0 0 3px rgba(229, 168, 0,0.05)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255,255,255,0.1)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              ))}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/admin/students")}
                  className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.55)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                  style={{ background: "#1B73BA", color: "white" }}
                >
                  {loading ? "Creating..." : `Create ${form.role === "admin" ? "Admin" : "Student"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
