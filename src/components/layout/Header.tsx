import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronDown, Menu, Moon, Search, ShoppingCart, Store, Truck, Undo2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { categories } from "@/data/mock";
import { AccountMenu } from "./AccountMenu";
import { Container } from "./Container";

const navItems = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/banh-trung-thu", label: "Bánh & hộp Trung thu" },
  { to: "/san-pham", label: "Sản phẩm" },
  { to: "/#gian-hang", label: "Gian hàng" },
  { to: "/#gioi-thieu", label: "Giới thiệu" },
];

export function Header() {
  const { role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="hidden border-b border-line bg-cream-dark/60 text-xs text-ink-soft md:block">
        <Container className="flex h-8 items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Truck size={14} /> Miễn phí vận chuyển từ 500.000đ
            </span>
            <span className="flex items-center gap-1.5">
              <Undo2 size={14} /> Đổi trả trong 7 ngày
            </span>
          </div>
          <span>Tiếng Việt</span>
        </Container>
      </div>

      <Container className="flex h-16 items-center gap-4 lg:gap-8">
        <button
          className="rounded p-1.5 text-ink lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Mở menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-soft shadow-primary">
            <Moon size={18} />
          </span>
          <span className="font-serif text-xl font-black text-primary">MoonCake</span>
        </Link>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="hidden min-w-0 flex-1 items-center overflow-hidden rounded-lg border border-line bg-cream sm:flex"
        >
          <input
            type="search"
            placeholder="Bạn cần tìm bánh gì?"
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-ink-muted"
          />
          <button type="submit" className="bg-primary px-4 py-2.5 text-white hover:bg-primary-dark" aria-label="Tìm kiếm">
            <Search size={18} />
          </button>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          {(role === "organizer" || role === "manager") && (
            <IconLink to="/quan-ly-cua-hang" icon={<Store size={20} />} label="Gian hàng" />
          )}
          <AccountMenu />
          <IconLink to="/" icon={<ShoppingCart size={20} />} label="Giỏ hàng" />
        </div>
      </Container>

      <div className="hidden border-t border-line lg:block">
        <Container className="relative flex h-11 items-center gap-8">
          <button
            onClick={() => setCatOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-ink hover:text-primary"
          >
            <Menu size={18} /> Danh mục <ChevronDown size={14} />
          </button>
          {catOpen && (
            <div className="absolute left-4 top-11 z-50 w-56 rounded-xl border border-line bg-white p-2 shadow-lg sm:left-6 lg:left-10">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to="/san-pham"
                  onClick={() => setCatOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-primary-soft hover:text-primary"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
          <nav className="flex items-center gap-7 text-sm font-medium">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `border-b-2 py-2.5 transition-colors ${
                    isActive && !item.to.includes("#")
                      ? "border-primary text-primary"
                      : "border-transparent text-ink-soft hover:text-primary"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </Container>
      </div>

      {menuOpen && (
        <nav className="border-t border-line bg-white px-4 py-3 lg:hidden">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mb-3 flex overflow-hidden rounded-lg border border-line sm:hidden"
          >
            <input type="search" placeholder="Bạn cần tìm bánh gì?" className="min-w-0 flex-1 px-3 py-2 text-sm outline-none" />
            <button type="submit" className="bg-primary px-3 text-white" aria-label="Tìm kiếm">
              <Search size={16} />
            </button>
          </form>
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-primary-soft hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function IconLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-ink-soft hover:text-primary">
      {icon}
      <span className="hidden text-[11px] sm:block">{label}</span>
    </Link>
  );
}
