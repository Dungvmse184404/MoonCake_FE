import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type Role } from "@/context/AuthContext";
import { Container } from "./Container";

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Container className="py-20 text-center text-ink-muted">Đang tải...</Container>;

  if (role === "guest") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (!roles.includes(role)) {
    return (
      <Container className="py-20 text-center">
        <h1 className="font-serif text-2xl font-black text-primary-dark">Bạn chưa có quyền truy cập trang này</h1>
        <p className="mt-2 text-ink-soft">Trang này dành cho chủ gian hàng. Hãy đăng ký làm đối tác để sử dụng.</p>
      </Container>
    );
  }

  return <>{children}</>;
}
