import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Container } from "./Container";
import { useAuth } from "@/context/AuthContext";

// Shows a login prompt in place of pages that make no sense for guests (cart, orders).
export function RequireLogin({ message, children }: { message: string; children: ReactNode }) {
  const { user, loading } = useAuth();
  const { pathname, search } = useLocation();

  if (loading) return <Container className="py-16 text-center text-ink-muted">Đang tải...</Container>;
  if (user) return <>{children}</>;

  return (
    <Container className="py-16 text-center">
      <p className="text-ink-soft">{message}</p>
      <Link
        to="/login"
        state={{ from: pathname + search }}
        className="mt-4 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
      >
        Đăng nhập
      </Link>
    </Container>
  );
}
