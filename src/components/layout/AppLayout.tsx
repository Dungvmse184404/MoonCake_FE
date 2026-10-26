import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { BackToTop } from "./BackToTop";
import { Footer } from "./Footer";

// Sections with their own side navigation animate only their content (see SideNavLayout)
const SECTIONS = ["/account", "/store", "/admin"];

export function AppLayout() {
  const { pathname } = useLocation();
  // Keyed by path only: filters and searches (?q=, ?page=) do not replay the transition
  const transitionKey = SECTIONS.find((s) => pathname === s || pathname.startsWith(`${s}/`)) ?? pathname;

  // New page starts at the top; links with #anchor scroll on their own
  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="flex-1">
        <div key={transitionKey} className="mc-page-enter">
          <Outlet />
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
