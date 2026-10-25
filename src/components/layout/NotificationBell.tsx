import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { notificationApi } from "@/lib/notificationApi";

const POLL_MS = 60_000;

// Bell with the unread count, refreshed once a minute while the tab is visible.
export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () => {
      if (document.hidden) return;
      notificationApi
        .unreadCount()
        .then((n) => active && setCount(n))
        .catch(() => undefined);
    };
    load();
    const timer = window.setInterval(load, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <Link to="/account/notifications" className="relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-ink-soft hover:text-primary">
      <Bell size={20} />
      {count > 0 && (
        <span className="absolute right-1.5 top-0 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
      <span className="hidden text-[11px] sm:block">Thông báo</span>
    </Link>
  );
}
