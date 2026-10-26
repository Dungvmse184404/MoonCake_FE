import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { Pager } from "@/components/ui/Pager";
import { friendlyError } from "@/lib/errors";
import { formatDate } from "@/lib/labels";
import { notificationApi, type AppNotification } from "@/lib/notificationApi";
import { useAsync } from "@/lib/useAsync";
import { REALTIME_EVENTS, useRealtime } from "@/context/RealtimeContext";

const PAGE_SIZE = 8;

export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");

  const { data, loading, error, reload } = useAsync(
    () => notificationApi.list({ isRead: unreadOnly ? false : undefined, page, pageSize: PAGE_SIZE }),
    [unreadOnly, page],
  );

  // New notifications appear without reloading the page
  useRealtime(REALTIME_EVENTS.notificationReceived, () => reload());

  const markRead = async (n: AppNotification) => {
    if (n.isRead) return;
    try {
      await notificationApi.markRead(n.id);
      reload();
    } catch (e) {
      setMessage(friendlyError(e));
    }
  };

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      reload();
    } catch (e) {
      setMessage(friendlyError(e));
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Thông báo</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Cập nhật về đơn đăng ký, hợp đồng thuê và đơn hàng của bạn.</p>
        </div>
        <button
          onClick={markAll}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-soft hover:border-primary hover:text-primary"
        >
          <CheckCheck size={16} /> Đánh dấu tất cả đã đọc
        </button>
      </div>

      <label className="mb-4 flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={unreadOnly}
          onChange={(e) => {
            setUnreadOnly(e.target.checked);
            setPage(1);
          }}
          className="size-4 accent-[var(--color-primary)]"
        />
        Chỉ hiện thông báo chưa đọc
      </label>

      {(error || message) && <FormAlert type="error">{error || message}</FormAlert>}
      {loading && !data && <p className="text-sm text-ink-muted">Đang tải...</p>}
      {data && data.items.length === 0 && (
        <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center text-sm text-ink-soft">
          Bạn chưa có thông báo nào.
        </div>
      )}

      <ul className="space-y-2">
        {data?.items.map((n) => (
          <li key={n.id}>
            <button
              onClick={() => markRead(n)}
              className={`flex w-full gap-3 rounded-xl border p-4 text-left transition hover:border-primary/50 ${
                n.isRead ? "border-line bg-white" : "border-primary/30 bg-primary/5"
              }`}
            >
              <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${n.isRead ? "bg-cream-dark text-ink-muted" : "bg-primary text-white"}`}>
                <Bell size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm ${n.isRead ? "text-ink" : "font-semibold text-ink"}`}>{n.title}</span>
                {n.content && <span className="mt-0.5 block text-sm text-ink-soft">{n.content}</span>}
                <span className="mt-1 block text-xs text-ink-muted">{formatDate(n.createdAt)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {data && <Pager page={data.currentPage} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
