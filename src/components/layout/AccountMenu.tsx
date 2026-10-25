import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck, Store, User, UserRound } from "lucide-react";
import { ROLE_LABEL, useAuth } from "@/context/AuthContext";

export function AccountMenu() {
  const { user, role, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (loading) {
    return <span className="mx-3 h-8 w-14 animate-pulse rounded bg-cream-dark" aria-label="Đang tải" />;
  }

  if (!user) {
    return (
      <Link
        to="/login"
        className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-ink-soft hover:text-primary"
      >
        <User size={20} />
        <span className="hidden text-[11px] sm:block">Đăng nhập</span>
      </Link>
    );
  }

  const isSeller = role === "organizer";

  const onLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-ink-soft hover:text-primary"
      >
        <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">
          {user.fullName.trim()[0]?.toUpperCase() ?? "U"}
        </span>
        <span className="hidden max-w-[84px] truncate text-[11px] sm:block">{user.fullName}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-line bg-white p-2 shadow-lg"
        >
          <div className="border-b border-line px-3 pb-2 pt-1">
            <p className="truncate text-sm font-semibold text-ink">{user.fullName}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
            <p className="mt-1 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-dark">
              {ROLE_LABEL[role]}
            </p>
          </div>
          <Link
            to="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-primary-soft hover:text-primary"
          >
            <UserRound size={16} /> Thông tin cá nhân
          </Link>
          {role === "manager" && (
            <Link
              to="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-primary-soft hover:text-primary"
            >
              <ShieldCheck size={16} /> Quản trị sàn
            </Link>
          )}
          {isSeller && (
            <Link
              to="/store"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-primary-soft hover:text-primary"
            >
              <Store size={16} /> Quản lý cửa hàng
            </Link>
          )}
          <button
            role="menuitem"
            onClick={onLogout}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-primary-soft hover:text-primary"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
