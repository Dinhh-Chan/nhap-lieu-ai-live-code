import { createContext, useCallback, useContext, useMemo, useState } from "react";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  accessExpireAt: number | null;
  refreshExpireAt: number | null;
  user: { id: string; username: string; email: string; firstName: string; lastName: string; platform: string; systemRole: string } | null;
};

type AuthContextValue = AuthState & {
  login: (accessToken: string, refreshToken: string, accessExpireAt: number, refreshExpireAt: number, user?: AuthState["user"]) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem("accessToken"));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem("refreshToken"));
  const [accessExpireAt, setAccessExpireAt] = useState<number | null>(() => {
    const stored = localStorage.getItem("accessExpireAt");
    return stored ? parseInt(stored) : null;
  });
  const [refreshExpireAt, setRefreshExpireAt] = useState<number | null>(() => {
    const stored = localStorage.getItem("refreshExpireAt");
    return stored ? parseInt(stored) : null;
  });
  const [user, setUser] = useState<AuthState["user"] | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback((
    newAccessToken: string, 
    newRefreshToken: string, 
    newAccessExpireAt: number, 
    newRefreshExpireAt: number, 
    nextUser?: AuthState["user"]
  ) => {
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setAccessExpireAt(newAccessExpireAt);
    setRefreshExpireAt(newRefreshExpireAt);
    
    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);
    localStorage.setItem("accessExpireAt", newAccessExpireAt.toString());
    localStorage.setItem("refreshExpireAt", newRefreshExpireAt.toString());
    
    if (nextUser) {
      setUser(nextUser);
      localStorage.setItem("user", JSON.stringify(nextUser));
    }
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setAccessExpireAt(null);
    setRefreshExpireAt(null);
    setUser(null);
    
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("accessExpireAt");
    localStorage.removeItem("refreshExpireAt");
    localStorage.removeItem("user");
  }, []);

  const isAuthenticated = useCallback(() => {
    if (!accessToken || !accessExpireAt) return false;
    // Kiểm tra token còn hạn không (để lại 5 phút buffer)
    return Date.now() < (accessExpireAt * 1000 - 5 * 60 * 1000);
  }, [accessToken, accessExpireAt]);

  const value = useMemo<AuthContextValue>(() => ({ 
    accessToken, 
    refreshToken, 
    accessExpireAt, 
    refreshExpireAt, 
    user, 
    login, 
    logout, 
    isAuthenticated 
  }), [accessToken, refreshToken, accessExpireAt, refreshExpireAt, user, login, logout, isAuthenticated]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};


