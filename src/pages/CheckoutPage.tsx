import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Store, Truck } from "lucide-react";
import { AddressField } from "@/components/address/AddressField";
import { FormAlert, FormField, TextAreaField } from "@/components/auth/FormField";
import { Container } from "@/components/layout/Container";
import { RequireLogin } from "@/components/layout/RequireLogin";
import { CakeImage } from "@/components/ui/CakeImage";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { authApi } from "@/lib/authApi";
import { clearCheckout, loadCheckout, PAYMENT_METHODS, type CheckoutItem, type PaymentMethod } from "@/lib/checkout";
import { friendlyError } from "@/lib/errors";
import { formatVnd } from "@/lib/labels";
import { orderApi } from "@/lib/orderApi";
import { loadStalls } from "@/lib/stallNames";
import { useAsync } from "@/lib/useAsync";
import { PHONE_REGEX } from "@/lib/validation";

type Delivery = "ship" | "pickup";

interface Group {
  key: string;
  organizerId: string;
  brandName: string;
  stallId: string | null;
  items: CheckoutItem[];
  subtotal: number;
}

// The server makes one order per shop and stall, so the page groups the same way
function groupItems(items: CheckoutItem[]): Group[] {
  const groups = new Map<string, Group>();
  for (const item of items) {
    const key = `${item.organizerId}:${item.stallId ?? "online"}`;
    const group = groups.get(key) ?? { key, organizerId: item.organizerId, brandName: item.brandName, stallId: item.stallId, items: [], subtotal: 0 };
    group.items.push(item);
    group.subtotal += item.unitPrice * item.quantity;
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function CheckoutPage() {
  return (
    <RequireLogin message="Đăng nhập để thanh toán.">
      <CheckoutContent />
    </RequireLogin>
  );
}

function CheckoutContent() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { remove } = useCart();
  const [items] = useState<CheckoutItem[]>(loadCheckout);
  const groups = useMemo(() => groupItems(items), [items]);
  const { data: stalls } = useAsync(() => loadStalls(), []);

  const [delivery, setDelivery] = useState<Record<string, Delivery>>({});
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [note, setNote] = useState("");
  const [editingReceiver, setEditingReceiver] = useState(false);
  const [receiver, setReceiver] = useState({ fullName: user?.fullName ?? "", phone: user?.phone ?? "", address: user?.address ?? "" });
  const [receiverError, setReceiverError] = useState("");
  const [savingReceiver, setSavingReceiver] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editingReceiver) setReceiver({ fullName: user?.fullName ?? "", phone: user?.phone ?? "", address: user?.address ?? "" });
  }, [user, editingReceiver]);

  const total = groups.reduce((sum, g) => sum + g.subtotal, 0);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const needsAddress = groups.some((g) => (delivery[g.key] ?? "ship") === "ship");
  const receiverMissing = !user?.fullName?.trim() || !user?.phone?.trim() || (needsAddress && !user?.address?.trim());

  const stallLabel = (id: string | null) => {
    const s = id ? stalls?.[id] : undefined;
    return s ? `${s.code} · ${s.name}` : "Gian hàng";
  };

  // The order takes the receiver from the profile, so changes here are saved to the profile
  const saveReceiver = async () => {
    const fullName = receiver.fullName.trim();
    const phone = receiver.phone.trim();
    if (!fullName) return setReceiverError("Vui lòng nhập họ tên người nhận.");
    if (!PHONE_REGEX.test(phone)) return setReceiverError("Số điện thoại không hợp lệ.");
    if (needsAddress && !receiver.address.trim()) return setReceiverError("Vui lòng nhập địa chỉ nhận hàng.");
    setReceiverError("");
    setSavingReceiver(true);
    try {
      updateUser(await authApi.updateProfile({ fullName, phone, address: receiver.address.trim() || null }));
      setEditingReceiver(false);
    } catch (e) {
      setReceiverError(friendlyError(e));
    } finally {
      setSavingReceiver(false);
    }
  };

  const placeOrder = async () => {
    setError("");
    if (receiverMissing) return setError("Vui lòng cập nhật thông tin người nhận trước khi đặt hàng.");
    const method = PAYMENT_METHODS.find((m) => m.value === payment)!;
    if (!method.available) return setError("Phương thức thanh toán này chưa được hỗ trợ.");

    setBusy(true);
    try {
      // One request per group so each order carries its own receiving method in the note
      for (const group of groups) {
        const how =
          (delivery[group.key] ?? "ship") === "pickup" ? `Nhận tại ${stallLabel(group.stallId)}` : "Giao tận nơi";
        const groupNote = [`[Thanh toán: ${method.label}]`, `[Nhận hàng: ${how}]`, note.trim()].filter(Boolean).join(" ");
        await orderApi.create(
          group.items.map((i) => i.line),
          groupNote,
        );
        for (const item of group.items) if (item.cartItemId) await remove(item.cartItemId).catch(() => undefined);
      }
      clearCheckout();
      navigate("/account/orders", {
        replace: true,
        state: {
          notice: groups.length > 1 ? `Đã tạo ${groups.length} đơn hàng, mỗi gian hàng một đơn.` : "Đặt hàng thành công. Gian hàng sẽ xác nhận đơn của bạn.",
        },
      });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  if (!items.length) {
    return (
      <Container className="py-16 text-center">
        <p className="text-ink-soft">Không có sản phẩm nào để thanh toán.</p>
        <Link to="/cart" className="mt-4 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          Về giỏ hàng
        </Link>
      </Container>
    );
  }

  const sectionClass = "rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6";

  return (
    <Container className="py-8">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-primary">
        <ChevronLeft size={16} /> Quay lại
      </button>
      <h1 className="mt-2 font-serif text-2xl font-black text-primary-dark">Thanh toán</h1>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="space-y-5">
          <section className={sectionClass} aria-labelledby="receiver-title">
            <div className="flex items-center justify-between gap-3">
              <h2 id="receiver-title" className="flex items-center gap-2 font-semibold text-ink">
                <MapPin size={18} className="text-primary" /> Người nhận và địa chỉ
              </h2>
              {!editingReceiver && (
                <button onClick={() => setEditingReceiver(true)} className="text-sm font-semibold text-primary hover:underline">
                  Thay đổi
                </button>
              )}
            </div>

            {editingReceiver ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Họ tên người nhận" name="receiverName" value={receiver.fullName} onChange={(e) => setReceiver((r) => ({ ...r, fullName: e.target.value }))} />
                  <FormField label="Số điện thoại" name="receiverPhone" type="tel" value={receiver.phone} onChange={(e) => setReceiver((r) => ({ ...r, phone: e.target.value }))} />
                </div>
                <AddressField label="Địa chỉ nhận hàng" value={receiver.address} onChange={(address) => setReceiver((r) => ({ ...r, address }))} />
                {receiverError && <FormAlert type="error">{receiverError}</FormAlert>}
                <p className="text-xs text-ink-muted">Thông tin này được lưu vào hồ sơ và dùng cho các đơn sau.</p>
                <div className="flex gap-2">
                  <button
                    onClick={saveReceiver}
                    disabled={savingReceiver}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                  >
                    {savingReceiver ? "Đang lưu..." : "Lưu thông tin"}
                  </button>
                  <button onClick={() => setEditingReceiver(false)} className="px-3 py-2 text-sm font-semibold text-ink-soft hover:text-primary">
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-ink-soft">
                <p className="font-semibold text-ink">
                  {user?.fullName || "Chưa có họ tên"} · {user?.phone || "Chưa có số điện thoại"}
                </p>
                <p className="mt-0.5">{user?.address || "Chưa có địa chỉ nhận hàng"}</p>
                {receiverMissing && <p className="mt-2 text-xs font-semibold text-primary-dark">Hãy bổ sung thông tin còn thiếu trước khi đặt hàng.</p>}
              </div>
            )}
          </section>

          {groups.map((group) => {
            const how = delivery[group.key] ?? "ship";
            return (
              <section key={group.key} className={sectionClass} aria-label={`Đơn của ${group.brandName}`}>
                <h2 className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                  <Store size={18} className="text-primary" /> {group.brandName}
                  <span className="text-xs font-normal text-ink-muted">{group.stallId ? stallLabel(group.stallId) : "Bán online"}</span>
                </h2>

                <ul className="mt-3 divide-y divide-line">
                  {group.items.map((item) => (
                    <li key={item.key} className="flex items-center gap-3 py-3">
                      <CakeImage src={item.imageUrl} alt={item.name} kind={item.kind} className="size-14 shrink-0 rounded-lg" iconClassName="size-6" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                        {item.detail && <p className="text-xs text-ink-muted">{item.detail}</p>}
                      </div>
                      <p className="hidden text-sm text-ink-muted sm:block">
                        {formatVnd(item.unitPrice)} × {item.quantity}
                      </p>
                      <p className="w-24 text-right text-sm font-semibold text-ink">{formatVnd(item.unitPrice * item.quantity)}</p>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 border-t border-line pt-4">
                  <p className="mb-2 text-sm font-medium text-ink">Cách nhận hàng</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${how === "ship" ? "border-primary bg-primary-soft/40" : "border-line"}`}>
                      <input
                        type="radio"
                        name={`delivery-${group.key}`}
                        checked={how === "ship"}
                        onChange={() => setDelivery((d) => ({ ...d, [group.key]: "ship" }))}
                        className="mt-0.5 accent-[var(--color-primary)]"
                      />
                      <span>
                        <span className="flex items-center gap-1.5 font-semibold text-ink">
                          <Truck size={14} /> Giao tận nơi
                        </span>
                        <span className="text-xs text-ink-muted">Giao tới địa chỉ người nhận ở trên.</span>
                      </span>
                    </label>
                    {group.stallId ? (
                      <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${how === "pickup" ? "border-primary bg-primary-soft/40" : "border-line"}`}>
                        <input
                          type="radio"
                          name={`delivery-${group.key}`}
                          checked={how === "pickup"}
                          onChange={() => setDelivery((d) => ({ ...d, [group.key]: "pickup" }))}
                          className="mt-0.5 accent-[var(--color-primary)]"
                        />
                        <span>
                          <span className="flex items-center gap-1.5 font-semibold text-ink">
                            <Store size={14} /> Nhận tại gian hàng
                          </span>
                          <span className="text-xs text-ink-muted">
                            {stallLabel(group.stallId)}
                            {stalls?.[group.stallId]?.location ? ` - ${stalls[group.stallId].location}` : ""}
                          </span>
                        </span>
                      </label>
                    ) : (
                      <p className="rounded-xl border border-dashed border-line p-3 text-xs text-ink-muted">
                        Gian hàng bán online, không có điểm nhận trực tiếp. Đơn sẽ được giao tận nơi.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex justify-end text-sm text-ink-soft">
                  Tạm tính <span className="ml-2 font-semibold text-ink">{formatVnd(group.subtotal)}</span>
                </div>
              </section>
            );
          })}

          <section className={sectionClass} aria-labelledby="payment-title">
            <h2 id="payment-title" className="font-semibold text-ink">
              Phương thức thanh toán
            </h2>
            <div className="mt-3 space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
                    !m.available ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  } ${payment === m.value ? "border-primary bg-primary-soft/40" : "border-line"}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === m.value}
                    disabled={!m.available}
                    onChange={() => setPayment(m.value)}
                    className="mt-0.5 accent-[var(--color-primary)]"
                  />
                  <span className="flex-1">
                    <span className="font-semibold text-ink">{m.label}</span>
                    <span className="block text-xs text-ink-muted">{m.desc}</span>
                  </span>
                  {!m.available && <span className="rounded-full bg-cream-dark px-2 py-0.5 text-[10px] font-semibold text-ink-muted">Sắp có</span>}
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className={`${sectionClass} space-y-3 lg:sticky lg:top-36`}>
          <h2 className="font-semibold text-ink">Tóm tắt đơn hàng</h2>
          <div className="space-y-1.5 text-sm text-ink-soft">
            {groups.map((g) => (
              <div key={g.key} className="flex justify-between gap-3">
                <span className="truncate">{g.brandName}</span>
                <span>{formatVnd(g.subtotal)}</span>
              </div>
            ))}
          </div>
          <TextAreaField label="Ghi chú cho gian hàng" name="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <span className="text-sm text-ink-soft">Tổng cộng ({count} sản phẩm)</span>
            <span className="text-xl font-bold text-primary">{formatVnd(total)}</span>
          </div>
          {error && <FormAlert type="error">{error}</FormAlert>}
          <button
            onClick={placeOrder}
            disabled={busy}
            className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Đang đặt hàng..." : "Đặt hàng"}
          </button>
          {groups.length > 1 && <p className="text-xs text-ink-muted">Mỗi gian hàng sẽ tạo một đơn riêng.</p>}
        </aside>
      </div>
    </Container>
  );
}
