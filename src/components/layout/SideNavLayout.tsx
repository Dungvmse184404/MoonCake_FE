import type { ComponentType } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Container } from "./Container";

export interface SideNavItem {
  name: string;
  path?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  end?: boolean;
}

export function SideNavLayout({ title, items }: { title: string; items: SideNavItem[] }) {
  const { pathname } = useLocation();
  return (
    <Container className="py-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <aside className="w-full shrink-0 md:sticky md:top-36 md:w-64">
          <div className="rounded-2xl border border-line bg-white/95 p-4 shadow-sm">
            <h2 className="mb-4 px-2 font-serif text-lg font-black tracking-tight text-primary-dark">{title}</h2>
            <nav className="flex flex-col gap-1">
              {items.map(({ name, path, icon: Icon, end }) =>
                path ? (
                  <NavLink
                    key={name}
                    to={path}
                    end={end}
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
            {/* The sidebar stays put; only the panel content plays the page transition */}
            <div key={pathname} className="mc-page-enter">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </Container>
  );
}
