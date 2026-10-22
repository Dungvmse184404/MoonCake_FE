import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadTokens, saveTokens } from "@/lib/api";
import { authApi, type ApiUserRole, type CurrentUser } from "@/lib/authApi";

// Vai trò dùng trong giao diện; ánh xạ từ UserRole của backend.
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
  /** true trong lúc kiểm tra token đã lưu khi mở trang */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Cập nhật thông tin người dùng đang đăng nhập (sau khi sửa hồ sơ) để header và các trang khác đổi theo */
  updateUser: (user: CurrentUser) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(() => loadTokens() !== null);

  // Khôi phục phiên đăng nhập từ token đã lưu.
  useEffect(() => {
    if (!loadTokens()) return;
    let cancelled = false;

    authApi
      .me()
      .then((me) => !cancelled && setUser(me))
      .catch(() => {
        // Token hỏng hoặc hết hạn cả refresh token
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
      setUser(await authApi.me());
    } catch (error) {
      saveTokens(null);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Dù server lỗi vẫn đăng xuất phía client
    }
    saveTokens(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, role: user ? ROLE_FROM_API[user.role] : "guest", loading, login, logout, updateUser: setUser }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
