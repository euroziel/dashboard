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

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Enter username and password");

      return;
    }

    try {
      setLoading(true);

      // =========================
      // CHECK ADMIN COLLECTION
      // =========================

      const adminQuery = query(
        collection(db, "admins"),

        where("username", "==", username),

        where("password", "==", password),
      );

      const adminSnapshot = await getDocs(adminQuery);

      if (!adminSnapshot.empty) {
        const admin = adminSnapshot.docs[0].data();

        login({
          username: admin.username,

          role: "admin",
        });

        router.push("/redirect");

        return;
      }

      // =========================
      // CHECK STUDENT COLLECTION
      // =========================

      const studentQuery = query(
        collection(db, "students"),

        where("username", "==", username),

        where("password", "==", password),
      );

      const studentSnapshot = await getDocs(studentQuery);

      if (!studentSnapshot.empty) {
        const student = studentSnapshot.docs[0].data();

        login({
          username: student.username,

          role: "student",
        });

        router.push("/redirect");

        return;
      }

      alert("Invalid username or password");
    } catch (error) {
      console.log("LOGIN ERROR:", error);

      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
      min-h-screen
      flex
      items-center
      justify-center
      bg-gray-100
    "
    >
      <div
        className="
        bg-white
        w-[380px]
        p-8
        rounded-xl
        shadow-lg
      "
      >
        <h1
          className="
          text-3xl
          font-bold
          mb-6
          text-center
        "
        >
          Login
        </h1>

        <input
          type="text"
          placeholder="Username"
          className="
            w-full
            border
            p-3
            rounded
            mb-4
          "
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="
            w-full
            border
            p-3
            rounded
            mb-5
          "
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="
            w-full
            bg-blue-600
            text-white
            p-3
            rounded
            hover:bg-blue-700
          "
        >
          {loading ? "Checking..." : "Login"}
        </button>
      </div>
    </div>
  );
}
