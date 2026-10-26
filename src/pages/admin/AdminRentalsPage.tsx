import { useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { CalendarDays } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { Pager } from "@/components/ui/Pager";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminApi } from "@/lib/adminApi";
import { friendlyError } from "@/lib/errors";
import { formatDate, formatVnd, RENTAL_STATUS_LABEL, RENTAL_STATUS_TONE } from "@/lib/labels";
import type { RentalStatus } from "@/lib/organizerApi";
import { useAsync } from "@/lib/useAsync";

const PAGE_SIZE = 8;

// Flow 15: the manager can end an active contract early; the stall is released unless another rental is booked.
export function AdminRentalsPage() {
  const [status, setStatus] = useState<RentalStatus | "">("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data, loading, error, reload } = useAsync(
    () => adminApi.listRentals({ status: status || undefined, search: query, page, pageSize: PAGE_SIZE }),
    [status, query, page],
  );

  const terminate = async (id: string) => {
    setBusyId(id);
    setNotice(null);
    try {
      await adminApi.terminateRental(id);
      setNotice({ type: "success", message: "Đã chấm dứt hợp đồng. Sản phẩm của gian hàng được chuyển sang ngừng bán." });
      setConfirmingId(null);
      reload();
    } catch (e) {
      setNotice({ type: "error", message: friendlyError(e) });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="w-full">
      <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Hợp đồng thuê</h1>
      <p className="mt-0.5 text-sm text-ink-muted">Chỉ hợp đồng đang thuê mới chấm dứt trước hạn được.</p>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as RentalStatus | "");
            setPage(1);
          }}
          aria-label="Lọc theo trạng thái"
          className="rounded-lg border border-line bg-white px-3 py-1.5 outline-none focus:border-primary"
        >
          <option value="">Mọi trạng thái</option>
          {(Object.keys(RENTAL_STATUS_LABEL) as RentalStatus[]).map((s) => (
            <option key={s} value={s}>
              {RENTAL_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <SearchInput
          value={query}
          onSearch={(q) => {
            setPage(1);
            setQuery(q);
          }}
          placeholder="Tìm gian hàng hoặc thương hiệu"
          className="w-64"
        />
      </div>

      {notice && <div className="mt-4"><FormAlert type={notice.type}>{notice.message}</FormAlert></div>}
      {error && <div className="mt-4"><FormAlert type="error">{error}</FormAlert></div>}
      {loading && !data && <p className="mt-4 text-sm text-ink-muted">Đang tải...</p>}
      {data && data.items.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">Không có hợp đồng nào.</p>
      )}

      <ul className="mt-4 space-y-3">
        {data?.items.map((r) => (
          <li key={r.id} className="rounded-xl border border-line p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-primary">{r.stallCode}</p>
                <p className="truncate font-semibold text-ink">{r.stallName}</p>
                <p className="text-xs text-ink-muted">
                  {r.organizerBrandName} · {r.organizerUserFullName} ({r.organizerUserEmail})
                </p>
              </div>
              <StatusBadge tone={RENTAL_STATUS_TONE[r.status]}>{RENTAL_STATUS_LABEL[r.status]}</StatusBadge>
            </div>

            <p className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-ink-soft">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-ink-muted" />
                {formatDate(r.startDate)} đến {r.endDate ? formatDate(r.endDate) : "không thời hạn"}
              </span>
              <span>Giá thuê: {formatVnd(r.rentalPrice)}</span>
            </p>

            {r.status === "Active" &&
              (confirmingId === r.id ? (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <button
                    onClick={() => terminate(r.id)}
                    disabled={busyId === r.id}
                    className="rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                  >
                    {busyId === r.id ? "Đang xử lý..." : "Xác nhận chấm dứt"}
                  </button>
                  <button onClick={() => setConfirmingId(null)} className="px-2 py-2 font-semibold text-ink-soft hover:text-primary">
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingId(r.id)}
                  className="mt-4 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-soft hover:border-primary hover:text-primary"
                >
                  Chấm dứt trước hạn
                </button>
              ))}
          </li>
        ))}
      </ul>

      {data && <Pager page={data.currentPage} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
