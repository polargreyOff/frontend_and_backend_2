import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { clearTokens, hasTokens, setTokens } from "./token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    if (!hasTokens()) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data);
      return data;
    } catch (error) {
      clearTokens();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function login(tokens) {
    setTokens(tokens);
    setLoading(true);
    return loadMe();
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  useEffect(() => {
    loadMe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        logout,
        reloadMe: loadMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
