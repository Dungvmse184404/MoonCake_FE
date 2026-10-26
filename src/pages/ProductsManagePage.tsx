import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { CakeImage } from "@/components/ui/CakeImage";
import { Pager } from "@/components/ui/Pager";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Product, ProductStatus } from "@/lib/catalog";
import { friendlyError } from "@/lib/errors";
import { formatVnd, PRODUCT_STATUS_LABEL, PRODUCT_STATUS_TONE } from "@/lib/labels";
import { productApi } from "@/lib/productApi";
import { useAsync } from "@/lib/useAsync";

const PAGE_SIZE = 8;
const STATUSES = Object.keys(PRODUCT_STATUS_LABEL) as ProductStatus[];

// Organizer's own products: filter, change status, restock, edit and delete.
export function ProductsManagePage() {
  const location = useLocation();
  const initialNotice = (location.state as { notice?: string } | null)?.notice;
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    initialNotice ? { type: "success", message: initialNotice } : null,
  );
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [stockDraft, setStockDraft] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, loading, error, reload } = useAsync(
    () => productApi.myProducts({ status: status || undefined, page, pageSize: PAGE_SIZE }),
    [status, page],
  );

  const run = async (product: Product, action: () => Promise<unknown>, success: string) => {
    setBusyId(product.id);
    setNotice(null);
    try {
      await action();
      setNotice({ type: "success", message: success });
      reload();
    } catch (e) {
      setNotice({ type: "error", message: friendlyError(e) });
    } finally {
      setBusyId(null);
    }
  };

  const applyStock = (product: Product) => {
    const delta = Number(stockDraft[product.id]);
    if (!Number.isInteger(delta) || delta === 0) {
      setNotice({ type: "error", message: "Nhập một số nguyên khác 0 (dương để nhập thêm, âm để giảm)." });
      return;
    }
    void run(product, () => productApi.adjustStock(product.id, delta), "Đã cập nhật tồn kho.").then(() =>
      setStockDraft((d) => ({ ...d, [product.id]: "" })),
    );
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Sản phẩm</h1>
          <p className="mt-0.5 text-sm text-ink-muted">Chỉ sản phẩm ở trạng thái "Đang bán" mới hiển thị với khách.</p>
        </div>
        <Link
          to="/store/products/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <Plus size={16} /> Thêm sản phẩm
        </Link>
      </div>

      {notice && (
        <div className="mb-4">
          <FormAlert type={notice.type}>{notice.message}</FormAlert>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2 text-sm">
        <label htmlFor="product-status" className="text-ink-soft">
          Trạng thái
        </label>
        <select
          id="product-status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ProductStatus | "");
            setPage(1);
          }}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm outline-none focus:border-primary"
        >
          <option value="">Tất cả</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {PRODUCT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <FormAlert type="error">{error}</FormAlert>}
      {loading && !data && <p className="text-sm text-ink-muted">Đang tải...</p>}
      {data && data.items.length === 0 && (
        <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm text-ink-soft">Chưa có sản phẩm nào.</p>
          <Link to="/store/products/new" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
            Thêm sản phẩm đầu tiên
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {data?.items.map((p) => (
          <li key={p.id} className="flex flex-col gap-4 rounded-xl border border-line p-4 sm:flex-row">
            <CakeImage src={p.imageUrl} alt={p.name} className="size-24 shrink-0 rounded-lg" iconClassName="size-9" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-ink-muted">
                    {[...p.categories.map((c) => c.name), ...p.fillings.map((f) => f.name)].join(" · ") || "Chưa có danh mục"}
                  </p>
                </div>
                <StatusBadge tone={PRODUCT_STATUS_TONE[p.status]}>{PRODUCT_STATUS_LABEL[p.status]}</StatusBadge>
              </div>

              <p className="mt-1 text-sm">
                <span className="font-bold text-primary">{formatVnd(p.price)}</span>
                <span className="ml-3 text-ink-soft">Tồn kho: {p.stockQuantity}</span>
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <select
                  value={p.status}
                  disabled={busyId === p.id}
                  onChange={(e) => run(p, () => productApi.setStatus(p.id, e.target.value as ProductStatus), "Đã đổi trạng thái.")}
                  aria-label={`Trạng thái của ${p.name}`}
                  className="rounded-lg border border-line bg-white px-2.5 py-1.5 outline-none focus:border-primary"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {PRODUCT_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>

                <input
                  value={stockDraft[p.id] ?? ""}
                  onChange={(e) => setStockDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                  inputMode="numeric"
                  placeholder="+10 / -5"
                  aria-label={`Điều chỉnh tồn kho của ${p.name}`}
                  className="w-24 rounded-lg border border-line bg-white px-2.5 py-1.5 outline-none focus:border-primary"
                />
                <button
                  onClick={() => applyStock(p)}
                  disabled={busyId === p.id}
                  className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink-soft hover:border-primary hover:text-primary disabled:opacity-60"
                >
                  Cập nhật kho
                </button>

                <Link
                  to={`/store/products/${p.id}/edit`}
                  className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 font-semibold text-ink-soft hover:border-primary hover:text-primary"
                >
                  <Pencil size={14} /> Sửa
                </Link>

                {deletingId === p.id ? (
                  <>
                    <button
                      onClick={() => run(p, () => productApi.remove(p.id), "Đã xóa sản phẩm.").then(() => setDeletingId(null))}
                      disabled={busyId === p.id}
                      className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                    >
                      Xác nhận xóa
                    </button>
                    <button onClick={() => setDeletingId(null)} className="px-2 py-1.5 font-semibold text-ink-soft hover:text-primary">
                      Giữ lại
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDeletingId(p.id)}
                    aria-label={`Xóa ${p.name}`}
                    className="grid size-8 place-items-center rounded-lg border border-line text-ink-soft hover:border-primary hover:text-primary"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {data && <Pager page={data.currentPage} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
