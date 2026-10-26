import { useState } from "react";
import { FormAlert } from "@/components/auth/FormField";
import { RatingStars } from "@/components/feedback/RatingStars";
import { Pager } from "@/components/ui/Pager";
import { feedbackApi } from "@/lib/feedbackApi";
import { formatDate } from "@/lib/labels";
import { useAsync } from "@/lib/useAsync";

interface Props {
  productId?: string;
  boxItemId?: string;
}

// Public reviews of one product or combo box. Hidden reviews never reach this list.
export function FeedbackList({ productId, boxItemId }: Props) {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useAsync(
    () => feedbackApi.list({ productId, boxItemId, status: "Visible", page, pageSize: 5 }),
    [productId, boxItemId, page],
  );

  const items = data?.pagination.items ?? [];

  return (
    <section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm" aria-labelledby="reviews-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="reviews-title" className="font-serif text-xl font-black text-primary-dark">
          Đánh giá
        </h2>
        {!!data?.pagination.totalCount && data.averageRating != null && (
          <p className="flex items-center gap-2 text-sm text-ink-soft">
            <RatingStars value={data.averageRating} />
            <span className="font-semibold text-ink">{data.averageRating.toFixed(1)}</span>
            <span className="text-ink-muted">({data.pagination.totalCount} đánh giá)</span>
          </p>
        )}
      </div>

      {error && <div className="mt-3"><FormAlert type="error">{error}</FormAlert></div>}
      {loading && !data && <p className="mt-3 text-sm text-ink-muted">Đang tải...</p>}
      {data && items.length === 0 && <p className="mt-3 text-sm text-ink-muted">Chưa có đánh giá nào.</p>}

      <ul className="mt-4 divide-y divide-line">
        {items.map((f) => (
          <li key={f.id} className="py-4 first:pt-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-semibold text-ink">{f.userName || "Khách hàng"}</span>
              <RatingStars value={f.rating} />
              <span className="text-xs text-ink-muted">{formatDate(f.createdAt)}</span>
            </div>
            {f.comment && <p className="mt-1.5 whitespace-pre-line text-sm text-ink-soft">{f.comment}</p>}
            {f.replyContent && (
              <div className="mt-2 rounded-lg bg-cream px-3 py-2 text-sm text-ink-soft">
                <p className="text-xs font-semibold text-primary-dark">Phản hồi từ {f.organizerBrandName}</p>
                <p className="mt-0.5 whitespace-pre-line">{f.replyContent}</p>
              </div>
            )}
          </li>
        ))}
      </ul>

      {data && <Pager page={data.pagination.currentPage} totalPages={data.pagination.totalPages} onChange={setPage} />}
    </section>
  );
}
