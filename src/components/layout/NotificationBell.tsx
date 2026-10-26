import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { REALTIME_EVENTS, useRealtime } from "@/context/RealtimeContext";
import { notificationApi, type AppNotification } from "@/lib/notificationApi";

const TOAST_MS = 6000;

// Bell with the unread count. The count is loaded once, then kept current by the realtime hub;
// a new notification also pops up briefly under the header.
export function NotificationBell() {
  const { refreshUser } = useAuth();
  const [count, setCount] = useState(0);
  const [toast, setToast] = useState<AppNotification | null>(null);

  useEffect(() => {
    let active = true;
    notificationApi
      .unreadCount()
      .then((n) => active && setCount(n))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useRealtime(REALTIME_EVENTS.unreadCountChanged, (payload) => {
    const unread = (payload as { unreadCount?: number }).unreadCount;
    if (typeof unread === "number") setCount(unread);
  });

  useRealtime(REALTIME_EVENTS.notificationReceived, (payload) => {
    setCount((c) => c + 1);
    setToast(payload as AppNotification);
    // An approval can change the account role, so pick up the new profile and token
    void refreshUser();
  });

  return (
    <div className="relative">
      <Link to="/account/notifications" className="relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-ink-soft hover:text-primary">
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute right-1.5 top-0 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
        <span className="hidden text-[11px] sm:block">Thông báo</span>
      </Link>

      {toast && (
        <div
          role="status"
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-line bg-white p-4 text-left shadow-lg"
        >
          <button
            onClick={() => setToast(null)}
            aria-label="Đóng thông báo"
            className="absolute right-2 top-2 grid size-6 place-items-center rounded text-ink-muted hover:text-primary"
          >
            <X size={14} />
          </button>
          <p className="pr-5 text-sm font-semibold text-ink">{toast.title}</p>
          {toast.content && <p className="mt-1 line-clamp-3 text-xs text-ink-soft">{toast.content}</p>}
          <Link
            to="/account/notifications"
            onClick={() => setToast(null)}
            className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
          >
            Xem thông báo
          </Link>
        </div>
      )}
    </div>
  );
}
