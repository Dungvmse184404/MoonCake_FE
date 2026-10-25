import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadTokens, refreshTokens, saveTokens } from "@/lib/api";
import { roleInToken } from "@/lib/jwt";
import { authApi, type ApiUserRole, type CurrentUser } from "@/lib/authApi";

export type Role = "guest" | "user" | "organizer" | "manager";

const ROLE_FROM_API: Record<ApiUserRole, Role> = {
  User: "user",
  Organization: "organizer",
  Manager: "manager",
};

export const ROLE_LABEL: Record<Role, string> = {
  guest: "Khách",
  user: "Khách mua hàng",
  organizer: "Chủ gian hàng",
  manager: "Quản trị sàn",
};

interface AuthState {
  user: CurrentUser | null;
  role: Role;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: CurrentUser) => void;
}

// The role lives in the access token, so refresh it when the DB role changed (e.g. partner approved)
async function fetchCurrentUser(): Promise<CurrentUser> {
  let me = await authApi.me();
  const tokens = loadTokens();
  if (tokens && roleInToken(tokens.accessToken) !== me.role) {
    if (await refreshTokens()) me = await authApi.me();
  }
  return me;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(() => loadTokens() !== null);

  useEffect(() => {
    if (!loadTokens()) return;
    let cancelled = false;

    fetchCurrentUser()
      .then((me) => !cancelled && setUser(me))
      .catch(() => {
        saveTokens(null);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    saveTokens(tokens);
    try {
      setUser(await fetchCurrentUser());
    } catch (error) {
      saveTokens(null);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
    }
    saveTokens(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    setUser(await fetchCurrentUser());
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      role: user ? ROLE_FROM_API[user.role] : "guest",
      loading,
      login,
      logout,
      refreshUser,
      updateUser: setUser,
    }),
    [user, loading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
