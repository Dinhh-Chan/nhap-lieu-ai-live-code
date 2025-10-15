import { createContext, useCallback, useContext, useMemo, useState } from "react";

type AuthState = {
  token: string | null;
  user: { id: string; name: string } | null;
};

type AuthContextValue = AuthState & {
  login: (token: string, user?: AuthState["user"]) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<AuthState["user"] | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback((newToken: string, nextUser?: AuthState["user"]) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    if (nextUser) {
      setUser(nextUser);
      localStorage.setItem("user", JSON.stringify(nextUser));
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ token, user, login, logout }), [token, user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};


