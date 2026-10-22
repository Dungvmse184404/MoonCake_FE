import type { ComponentType } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Bell, Handshake, Package, UserRound } from "lucide-react";
import { Container } from "./Container";

interface NavItem {
  name: string;
  path?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

// Chỉ "Thông tin cá nhân" đã có trang; các mục còn lại hiện mờ, sẽ nối vào khi làm xong các flow tương ứng.
const NAV_ITEMS: NavItem[] = [
  { name: "Thông tin cá nhân", path: "/tai-khoan/thong-tin", icon: UserRound },
  { name: "Đơn hàng của tôi", icon: Package },
  { name: "Đăng ký làm đối tác", icon: Handshake },
  { name: "Thông báo", icon: Bell },
];

// Khung trang cá nhân: thanh điều hướng bên trái + thẻ nội dung bên phải (theo bố cục của FengDeskAI).
export function ProfileLayout() {
  return (
    <Container className="py-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <aside className="w-full shrink-0 md:sticky md:top-36 md:w-64">
          <div className="rounded-2xl border border-line bg-white/95 p-4 shadow-sm">
            <h2 className="mb-4 px-2 font-serif text-lg font-black tracking-tight text-primary-dark">Tài khoản</h2>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map(({ name, path, icon: Icon }) =>
                path ? (
                  <NavLink
                    key={name}
                    to={path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "border-primary/20 bg-primary/10 font-semibold text-primary"
                          : "border-transparent text-ink-soft hover:bg-cream hover:text-ink"
                      }`
                    }
                  >
                    <Icon size={18} className="shrink-0" />
                    {name}
                  </NavLink>
                ) : (
                  <span
                    key={name}
                    aria-disabled="true"
                    title="Sắp có"
                    className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-muted/70"
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="flex-1">{name}</span>
                    <span className="rounded-full bg-cream-dark px-2 py-0.5 text-[10px] font-semibold text-ink-muted">
                      Sắp có
                    </span>
                  </span>
                ),
              )}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="min-h-[400px] rounded-xl border border-line bg-white p-6 shadow-sm">
            <Outlet />
          </div>
        </main>
      </div>
    </Container>
  );
}
