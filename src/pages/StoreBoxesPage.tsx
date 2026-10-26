import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { CakeImage } from "@/components/ui/CakeImage";
import { Pager } from "@/components/ui/Pager";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { boxApi, type BoxItem } from "@/lib/boxApi";
import type { ProductStatus } from "@/lib/catalog";
import { friendlyError } from "@/lib/errors";
import { formatVnd, PRODUCT_STATUS_LABEL, PRODUCT_STATUS_TONE } from "@/lib/labels";
import { useAsync } from "@/lib/useAsync";

const PAGE_SIZE = 8;
// A box is never "out of stock" by itself, so that status is not offered here
const STATUSES: ProductStatus[] = ["Draft", "Active", "Inactive"];

export function StoreBoxesPage() {
  const initialNotice = (useLocation().state as { notice?: string } | null)?.notice;
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    initialNotice ? { type: "success", message: initialNotice } : null,
  );
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, loading, error, reload } = useAsync(
    () => boxApi.mine({ status: status || undefined, page, pageSize: PAGE_SIZE }),
    [status, page],
  );

  const run = async (box: BoxItem, action: () => Promise<unknown>, success: string) => {
    setBusyId(box.id);
    setNotice(null);
    try {
      await action();
      setNotice({ type: "success", message: success });
      reload();
    } catch (e) {
      setNotice({ type: "error", message: friendlyError(e) });
    } finally {
      setBusyId(null);
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Hộp combo</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Hộp gồm nhiều bánh của bạn; khách tự chọn bánh và nhân cho từng hộp.</p>
        </div>
        <Link
          to="/store/boxes/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus size={16} /> Thêm hộp
        </Link>
      </div>

      <div className="mt-5">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ProductStatus | "");
            setPage(1);
          }}
          aria-label="Lọc theo trạng thái"
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm outline-none focus:border-primary"
        >
          <option value="">Mọi trạng thái</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {PRODUCT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {notice && <div className="mt-4"><FormAlert type={notice.type}>{notice.message}</FormAlert></div>}
      {error && <div className="mt-4"><FormAlert type="error">{error}</FormAlert></div>}
      {loading && !data && <p className="mt-4 text-sm text-ink-muted">Đang tải...</p>}
      {data && data.items.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">
          Chưa có hộp combo nào.
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {data?.items.map((box) => (
          <li key={box.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-line p-4">
            <CakeImage src={box.imageUrl} alt={box.name} kind="box" className="size-16 shrink-0 rounded-lg" iconClassName="size-7" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-ink">{box.name}</p>
                <StatusBadge tone={PRODUCT_STATUS_TONE[box.status]}>{PRODUCT_STATUS_LABEL[box.status]}</StatusBadge>
              </div>
              <p className="text-xs text-ink-muted">
                {formatVnd(box.price)} · {box.capacity} bánh/hộp · {box.products.length} loại bánh · {box.stallIds.length} gian hàng
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <select
                value={box.status}
                disabled={busyId === box.id}
                onChange={(e) => run(box, () => boxApi.setStatus(box.id, e.target.value as ProductStatus), "Đã đổi trạng thái.")}
                aria-label={`Trạng thái của ${box.name}`}
                className="rounded-lg border border-line bg-white px-2 py-1.5 outline-none focus:border-primary"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PRODUCT_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <Link
                to={`/store/boxes/${box.id}/edit`}
                className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 font-semibold text-ink-soft hover:border-primary hover:text-primary"
              >
                <Pencil size={14} /> Sửa
              </Link>
              {deletingId === box.id ? (
                <>
                  <button
                    onClick={() => run(box, () => boxApi.remove(box.id), "Đã xóa hộp combo.")}
                    className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-white hover:bg-primary-dark"
                  >
                    Xác nhận xóa
                  </button>
                  <button onClick={() => setDeletingId(null)} className="px-2 py-1.5 font-semibold text-ink-soft hover:text-primary">
                    Giữ lại
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setDeletingId(box.id)}
                  aria-label={`Xóa ${box.name}`}
                  className="grid size-8 place-items-center rounded-lg border border-line text-ink-soft hover:border-primary hover:text-primary"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {data && <Pager page={data.currentPage} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
