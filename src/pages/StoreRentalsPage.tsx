import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Plus } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { Pager } from "@/components/ui/Pager";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatVnd, RENTAL_STATUS_LABEL, RENTAL_STATUS_TONE } from "@/lib/labels";
import { organizerApi, type RentalStatus } from "@/lib/organizerApi";
import { useAsync } from "@/lib/useAsync";

const PAGE_SIZE = 6;

// The organizer's stall contracts (GET /api/stall-rentals/me).
export function StoreRentalsPage() {
  const [status, setStatus] = useState<RentalStatus | "">("");
  const [page, setPage] = useState(1);
  const { data, loading, error } = useAsync(
    () => organizerApi.myRentals({ status: status || undefined, page, pageSize: PAGE_SIZE }),
    [status, page],
  );

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Hợp đồng thuê gian hàng</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Các gian hàng bạn đang thuê hoặc đã thuê.</p>
        </div>
        <Link
          to="/become-partner?type=stall"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus size={16} /> Thuê thêm gian hàng
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm">
        <label htmlFor="rental-status" className="text-ink-soft">
          Trạng thái
        </label>
        <select
          id="rental-status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as RentalStatus | "");
            setPage(1);
          }}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm outline-none focus:border-primary"
        >
          <option value="">Tất cả</option>
          {(Object.keys(RENTAL_STATUS_LABEL) as RentalStatus[]).map((s) => (
            <option key={s} value={s}>
              {RENTAL_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <FormAlert type="error">{error}</FormAlert>}
      {loading && !data && <p className="text-sm text-ink-muted">Đang tải...</p>}
      {data && data.items.length === 0 && (
        <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center text-sm text-ink-soft">
          Bạn chưa có hợp đồng thuê nào.
        </div>
      )}

      <ul className="space-y-3">
        {data?.items.map((r) => (
          <li key={r.id} className="rounded-xl border border-line p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-primary">{r.stallCode}</p>
                <p className="truncate font-semibold text-ink">{r.stallName}</p>
              </div>
              <StatusBadge tone={RENTAL_STATUS_TONE[r.status]}>{RENTAL_STATUS_LABEL[r.status]}</StatusBadge>
            </div>
            <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-ink-soft sm:grid-cols-2">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-ink-muted" />
                <dd>
                  {formatDate(r.startDate)} đến {r.endDate ? formatDate(r.endDate) : "không thời hạn"}
                </dd>
              </div>
              {r.stallLocation && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-ink-muted" />
                  <dd>{r.stallLocation}</dd>
                </div>
              )}
              <div className="flex gap-1.5">
                <dt className="text-ink-muted">Giá thuê:</dt>
                <dd>{formatVnd(r.rentalPrice)}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      {data && <Pager page={data.currentPage} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
