import { useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Link, useLocation } from "react-router-dom";
import { Package } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { Pager } from "@/components/ui/Pager";
import { CakeImage } from "@/components/ui/CakeImage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatVnd, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/labels";
import { orderApi, type OrderStatus } from "@/lib/orderApi";
import { useAsync } from "@/lib/useAsync";

const PAGE_SIZE = 8;

export type OrderMode = "buyer" | "seller";

// Buyer view lists the orders placed by the account; seller view lists the orders of the organizer's shop.
export function OrdersPage({ mode }: { mode: OrderMode }) {
  const notice = (useLocation().state as { notice?: string } | null)?.notice;
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const base = mode === "buyer" ? "/account/orders" : "/store/orders";
  const { data, loading, error } = useAsync(() => {
    const params = { status: status || undefined, search: query, page, pageSize: PAGE_SIZE };
    return mode === "buyer" ? orderApi.myOrders(params) : orderApi.organizerOrders(params);
  }, [mode, status, query, page]);

  return (
    <div className="w-full">
      <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">
        {mode === "buyer" ? "Đơn hàng của tôi" : "Đơn hàng của cửa hàng"}
      </h1>
      <p className="mt-0.5 text-sm text-ink-muted">
        {mode === "buyer" ? "Theo dõi đơn đã đặt, hủy đơn chờ xác nhận và đánh giá sản phẩm đã nhận." : "Xác nhận, giao và hoàn tất các đơn của khách."}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | "");
            setPage(1);
          }}
          aria-label="Lọc theo trạng thái"
          className="rounded-lg border border-line bg-white px-3 py-1.5 outline-none focus:border-primary"
        >
          <option value="">Mọi trạng thái</option>
          {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <SearchInput
          value={query}
          onSearch={(q) => {
            setPage(1);
            setQuery(q);
          }}
          placeholder={mode === "buyer" ? "Tìm mã đơn" : "Tìm mã đơn, tên hoặc số điện thoại"}
          className="w-72"
        />
      </div>

      {notice && !error && <div className="mt-4"><FormAlert type="success">{notice}</FormAlert></div>}
      {error && <div className="mt-4"><FormAlert type="error">{error}</FormAlert></div>}
      {loading && !data && <p className="mt-4 text-sm text-ink-muted">Đang tải...</p>}
      {data && data.items.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">
          Chưa có đơn hàng nào.
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {data?.items.map((o) => (
          <li key={o.id}>
            <Link to={`${base}/${o.id}`} className="block rounded-xl border border-line p-4 transition hover:border-primary sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Package size={13} /> {o.orderCode}
                  </p>
                  <p className="mt-0.5 truncate font-semibold text-ink">
                    {mode === "buyer" ? o.organizerBrandName : `${o.receiverName} · ${o.receiverPhone}`}
                  </p>
                  <p className="text-xs text-ink-muted">Đặt ngày {formatDate(o.createdAt)}</p>
                </div>
                <StatusBadge tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</StatusBadge>
              </div>
              <ul className="mt-3 divide-y divide-line border-t border-line">
                {o.items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-2.5">
                    <CakeImage
                      src={i.imageUrl}
                      alt={i.name}
                      kind={i.itemType === "Box" ? "box" : "product"}
                      className="size-12 shrink-0 rounded-lg"
                      iconClassName="size-5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{i.name}</p>
                      <p className="truncate text-xs text-ink-muted">
                        {[i.categoryName, i.fillingName].filter(Boolean).join(" · ") || (i.itemType === "Box" ? "Hộp combo" : "")}
                      </p>
                    </div>
                    <p className="hidden text-sm text-ink-muted sm:block">
                      {formatVnd(i.unitPrice)} × {i.quantity}
                    </p>
                    <p className="w-24 text-right text-sm font-semibold text-ink">{formatVnd(i.subtotal)}</p>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <span className="text-xs text-ink-muted">{o.items.reduce((n, i) => n + i.quantity, 0)} sản phẩm</span>
                <span className="text-sm text-ink-soft">
                  Tổng cộng <span className="ml-1 text-base font-bold text-primary">{formatVnd(o.totalAmount)}</span>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {data && <Pager page={data.currentPage} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}
