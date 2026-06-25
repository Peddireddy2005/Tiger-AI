import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser, getProfile } from "../api/authApi";

const AuthContext = createContext();

// FIX: export AuthProvider as named export only (not default)
// This fixes the react-refresh/only-export-components warning
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const res = await getProfile();
        if (!cancelled) setUser(res.data);
      } catch {
        localStorage.removeItem("token");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const login = async (data) => {
    const res = await loginUser(data);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await registerUser(data);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const loginWithTokenAndUser = (token, userData) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithTokenAndUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// FIX: export hook separately — satisfies react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}