"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface UserData {
  uid: string;
  username: string;
  role: string;
  name?: string;
  email?: string;
}

interface AuthContextType {
  user: UserData | null;
  login: (data: UserData) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

/** Set a cookie accessible to middleware (no httpOnly so JS can delete it) */
function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("euroziel_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  function login(data: UserData) {
    // Persist to localStorage (client-side reads)
    localStorage.setItem("euroziel_user", JSON.stringify(data));
    // Persist to cookie (middleware reads)
    setCookie("euroziel_user", JSON.stringify(data));
    setUser(data);
  }

  function logout() {
    localStorage.removeItem("euroziel_user");
    deleteCookie("euroziel_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
