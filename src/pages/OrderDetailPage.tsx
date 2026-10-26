import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { FormAlert, TextAreaField } from "@/components/auth/FormField";
import { CakeImage } from "@/components/ui/CakeImage";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { friendlyError } from "@/lib/errors";
import { formatVnd, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/labels";
import { orderApi, type Order } from "@/lib/orderApi";
import { useAsync } from "@/lib/useAsync";
import type { OrderMode } from "./OrdersPage";

const dateTime = (value?: string | null) => (value ? new Date(value).toLocaleString("vi-VN") : "");

export function OrderDetailPage({ mode }: { mode: OrderMode }) {
  const { id = "" } = useParams();
  const initialNotice = (useLocation().state as { notice?: string } | null)?.notice;
  const base = mode === "buyer" ? "/account/orders" : "/store/orders";
  const { data: order, loading, error, reload } = useAsync(() => orderApi.get(id), [id]);

  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(
    initialNotice ? { type: "success", message: initialNotice } : null,
  );

  const run = async (action: () => Promise<Order>, done: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      setNotice({ type: "success", message: done });
      setCancelling(false);
      reload();
    } catch (e) {
      setNotice({ type: "error", message: friendlyError(e) });
    } finally {
      setBusy(false);
    }
  };

  const onCancel = () => {
    if (!reason.trim()) return setReasonError("Vui lòng nhập lý do hủy.");
    setReasonError("");
    void run(() => orderApi.cancel(id, reason.trim()), "Đã hủy đơn hàng.");
  };

  if (loading && !order) return <p className="text-sm text-ink-muted">Đang tải...</p>;
  if (error || !order) return <FormAlert type="error">{error || "Không tìm thấy đơn hàng."}</FormAlert>;

  // Buyers cancel while the order waits for the shop; the shop can also cancel after confirming
  const canCancel = mode === "buyer" ? order.status === "Pending" : order.status === "Pending" || order.status === "Confirmed";
  const canConfirm = mode === "seller" && order.status === "Pending";
  const timeline = [
    { label: "Đặt hàng", at: order.createdAt },
    { label: "Xác nhận", at: order.confirmedAt },
    { label: "Đã giao", at: order.deliveredAt },
    { label: "Đã hủy", at: order.cancelledAt },
  ].filter((step) => step.at);

  return (
    <div className="w-full">
      <Link to={base} className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-primary">
        <ChevronLeft size={16} /> Đơn hàng
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="font-serif text-xl font-black tracking-tight text-primary-dark">Đơn {order.orderCode}</h1>
          <p className="text-xs text-ink-muted">
            {order.organizerBrandName} · Đặt lúc {dateTime(order.createdAt)}
          </p>
        </div>
        <StatusBadge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</StatusBadge>
      </div>

      {notice && <div className="mt-4"><FormAlert type={notice.type}>{notice.message}</FormAlert></div>}

      <section className="mt-5 rounded-xl border border-line p-4 text-sm text-ink-soft">
        <h2 className="font-semibold text-ink">Giao tới</h2>
        <p className="mt-1">
          {order.receiverName} · {order.receiverPhone}
        </p>
        <p>{order.shippingAddress}</p>
        {order.note && <p className="mt-1 text-ink-muted">Ghi chú: {order.note}</p>}
        {order.status === "Cancelled" && order.cancelReason && (
          <p className="mt-2 text-primary-dark">Lý do hủy: {order.cancelReason}</p>
        )}
      </section>

      <ul className="mt-4 space-y-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-3 rounded-xl border border-line p-4">
            <CakeImage
              src={item.imageUrl}
              alt={item.name}
              kind={item.itemType === "Box" ? "box" : "product"}
              className="size-16 shrink-0 rounded-lg"
              iconClassName="size-7"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{item.name}</p>
              {(item.categoryName || item.fillingName) && (
                <p className="text-xs text-ink-muted">{[item.categoryName, item.fillingName].filter(Boolean).join(" · ")}</p>
              )}
              {item.boxSelections.length > 0 && (
                <p className="mt-0.5 text-xs text-ink-muted">
                  {item.boxSelections.map((s) => `${s.quantity} × ${s.productName} (${s.fillingName})`).join(" · ")}
                </p>
              )}
              <p className="mt-1 text-sm text-ink-soft">
                {formatVnd(item.unitPrice)} × {item.quantity}
              </p>
            </div>
            <p className="text-sm font-semibold text-ink">{formatVnd(item.subtotal)}</p>
          </li>
        ))}
      </ul>

      <section className="mt-4 space-y-1 rounded-xl border border-line p-4 text-sm text-ink-soft">
        <div className="flex justify-between">
          <span>Tạm tính</span>
          <span>{formatVnd(order.subtotalAmount)}</span>
        </div>
        {order.platformDiscount + order.organizerDiscount > 0 && (
          <div className="flex justify-between">
            <span>Giảm giá</span>
            <span>-{formatVnd(order.platformDiscount + order.organizerDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-primary">
          <span>Tổng cộng</span>
          <span>{formatVnd(order.totalAmount)}</span>
        </div>
      </section>

      {(canConfirm || canCancel) && (
        <div className="mt-4">
          {cancelling ? (
            <div className="space-y-3 rounded-lg bg-cream p-4">
              <TextAreaField label="Lý do hủy" name="cancel-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
              {reasonError && <p className="text-xs text-primary">{reasonError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  disabled={busy}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                >
                  {busy ? "Đang xử lý..." : "Xác nhận hủy đơn"}
                </button>
                <button
                  onClick={() => setCancelling(false)}
                  className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft hover:text-primary"
                >
                  Giữ đơn
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {canConfirm && (
                <button
                  onClick={() => run(() => orderApi.confirm(id), "Đã xác nhận đơn hàng.")}
                  disabled={busy}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                >
                  Xác nhận đơn
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => {
                    setCancelling(true);
                    setReason("");
                    setReasonError("");
                  }}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink-soft hover:border-primary hover:text-primary"
                >
                  Hủy đơn
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <section className="mt-6">
        <h2 className="font-semibold text-ink">Tiến trình</h2>
        <ol className="mt-2 space-y-1.5 border-l border-line pl-4 text-sm text-ink-soft">
          {timeline.map((step) => (
            <li key={step.label}>
              <span className="font-semibold text-ink">{step.label}</span>
              <span className="text-xs text-ink-muted"> · {dateTime(step.at)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
