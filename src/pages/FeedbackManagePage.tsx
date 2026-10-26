import { useState } from "react";
import { EyeOff, Eye } from "lucide-react";
import { FormAlert, TextAreaField } from "@/components/auth/FormField";
import { RatingStars } from "@/components/feedback/RatingStars";
import { Pager } from "@/components/ui/Pager";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { friendlyError } from "@/lib/errors";
import { feedbackApi, type Feedback, type FeedbackStatus } from "@/lib/feedbackApi";
import { formatDate } from "@/lib/labels";
import { useAsync } from "@/lib/useAsync";

const PAGE_SIZE = 8;

// Organizers read and answer the reviews of their shop; managers hide or show reviews.
export function FeedbackManagePage({ mode }: { mode: "organizer" | "manager" }) {
  const [rating, setRating] = useState("");
  const [status, setStatus] = useState<FeedbackStatus | "">("");
  const [page, setPage] = useState(1);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data, loading, error, reload } = useAsync(() => {
    const params = { rating: rating ? Number(rating) : undefined, status: status || undefined, page, pageSize: PAGE_SIZE };
    return mode === "organizer" ? feedbackApi.organizerList(params) : feedbackApi.adminList(params);
  }, [mode, rating, status, page]);

  const run = async (f: Feedback, action: () => Promise<unknown>, done: string) => {
    setBusyId(f.id);
    setNotice(null);
    try {
      await action();
      setNotice({ type: "success", message: done });
      setReplyingId(null);
      reload();
    } catch (e) {
      setNotice({ type: "error", message: friendlyError(e) });
    } finally {
      setBusyId(null);
    }
  };

  const items = data?.pagination.items ?? [];

  return (
    <div className="w-full">
      <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Đánh giá</h1>
      <p className="mt-0.5 text-sm text-ink-muted">
        {mode === "organizer" ? "Đọc và phản hồi đánh giá của khách về sản phẩm của bạn." : "Ẩn các đánh giá không phù hợp hoặc hiện lại khi cần."}
        {!!data?.pagination.totalCount && data.averageRating != null && ` Điểm trung bình ${data.averageRating.toFixed(1)}/5.`}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={rating}
          onChange={(e) => {
            setRating(e.target.value);
            setPage(1);
          }}
          aria-label="Lọc theo số sao"
          className="rounded-lg border border-line bg-white px-3 py-1.5 outline-none focus:border-primary"
        >
          <option value="">Mọi số sao</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} sao
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as FeedbackStatus | "");
            setPage(1);
          }}
          aria-label="Lọc theo trạng thái"
          className="rounded-lg border border-line bg-white px-3 py-1.5 outline-none focus:border-primary"
        >
          <option value="">Mọi trạng thái</option>
          <option value="Visible">Đang hiện</option>
          <option value="Hidden">Đã ẩn</option>
        </select>
      </div>

      {notice && <div className="mt-4"><FormAlert type={notice.type}>{notice.message}</FormAlert></div>}
      {error && <div className="mt-4"><FormAlert type="error">{error}</FormAlert></div>}
      {loading && !data && <p className="mt-4 text-sm text-ink-muted">Đang tải...</p>}
      {data && items.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">Chưa có đánh giá nào.</p>
      )}

      <ul className="mt-4 space-y-3">
        {items.map((f) => (
          <li key={f.id} className="rounded-xl border border-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{f.productName || f.boxItemName}</p>
                <p className="text-xs text-ink-muted">
                  {f.userName || "Khách hàng"} · {formatDate(f.createdAt)}
                  {mode === "manager" ? ` · ${f.organizerBrandName}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <RatingStars value={f.rating} />
                {f.status === "Hidden" && <StatusBadge tone="neutral">Đã ẩn</StatusBadge>}
              </div>
            </div>
            {f.comment && <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{f.comment}</p>}

            {f.replyContent && (
              <div className="mt-2 rounded-lg bg-cream px-3 py-2 text-sm text-ink-soft">
                <p className="text-xs font-semibold text-primary-dark">Phản hồi của cửa hàng</p>
                <p className="mt-0.5 whitespace-pre-line">{f.replyContent}</p>
              </div>
            )}

            {mode === "organizer" &&
              (replyingId === f.id ? (
                <div className="mt-3 space-y-2 rounded-lg bg-cream p-3">
                  <TextAreaField label="Nội dung phản hồi" name={`reply-${f.id}`} rows={2} value={reply} onChange={(e) => setReply(e.target.value)} />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!reply.trim()) return setNotice({ type: "error", message: "Vui lòng nhập nội dung phản hồi." });
                        void run(f, () => feedbackApi.reply(f.id, reply.trim()), "Đã gửi phản hồi.");
                      }}
                      disabled={busyId === f.id}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                    >
                      Gửi phản hồi
                    </button>
                    <button
                      onClick={() => setReplyingId(null)}
                      className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft hover:text-primary"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setReplyingId(f.id);
                    setReply(f.replyContent ?? "");
                  }}
                  className="mt-3 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-primary hover:text-primary"
                >
                  {f.replyContent ? "Sửa phản hồi" : "Phản hồi"}
                </button>
              ))}

            {mode === "manager" && (
              <button
                onClick={() =>
                  run(f, () => feedbackApi.setStatus(f.id, f.status === "Visible" ? "Hidden" : "Visible"), f.status === "Visible" ? "Đã ẩn đánh giá." : "Đã hiện lại đánh giá.")
                }
                disabled={busyId === f.id}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-primary hover:text-primary disabled:opacity-60"
              >
                {f.status === "Visible" ? (
                  <>
                    <EyeOff size={14} /> Ẩn
                  </>
                ) : (
                  <>
                    <Eye size={14} /> Hiện lại
                  </>
                )}
              </button>
            )}
          </li>
        ))}
      </ul>

      {data && <Pager page={data.pagination.currentPage} totalPages={data.pagination.totalPages} onChange={setPage} />}
    </div>
  );
}
