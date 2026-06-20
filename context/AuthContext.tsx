"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface UserData {
  username: string;
  role: string;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  function login(data: UserData) {
    localStorage.setItem("user", JSON.stringify(data));

    setUser(data);
  }

  function logout() {
    localStorage.removeItem("user");

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
