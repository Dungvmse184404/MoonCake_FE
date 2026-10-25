import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Minus, Moon, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { Container } from "@/components/layout/Container";
import { useCart, type CartItem } from "@/context/CartContext";
import { catalogApi } from "@/lib/catalog";
import { formatVnd } from "@/lib/labels";

// Group lines by the seller so the buyer sees who each product comes from.
function groupByBrand(items: CartItem[]) {
  const groups = new Map<string, { brandName: string; lines: CartItem[] }>();
  for (const item of items) {
    const group = groups.get(item.organizerId) ?? { brandName: item.brandName, lines: [] };
    group.lines.push(item);
    groups.set(item.organizerId, group);
  }
  return [...groups.values()];
}

export function CartPage() {
  const { items, count, total, setQuantity, remove, clear, sync } = useCart();

  // Refresh price, stock and availability once when the page opens
  useEffect(() => {
    const ids = items.map((i) => i.productId);
    if (!ids.length) return;
    let cancelled = false;
    Promise.all(ids.map((id) => catalogApi.getProduct(id).catch(() => null))).then((fresh) => {
      if (!cancelled) sync(fresh, ids);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(() => groupByBrand(items), [items]);
  const hasSoldOut = items.some((i) => i.stockQuantity <= 0);

  if (!items.length) {
    return (
      <Container className="py-16 text-center">
        <ShoppingCart className="mx-auto text-primary" size={48} strokeWidth={1.25} />
        <h1 className="mt-4 font-serif text-2xl font-black text-primary-dark">Giỏ hàng trống</h1>
        <p className="mt-1 text-sm text-ink-soft">Chọn vài chiếc bánh Trung thu để bắt đầu nhé.</p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Xem sản phẩm
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="flex items-end justify-between">
        <h1 className="font-serif text-2xl font-black text-primary-dark">Giỏ hàng ({count})</h1>
        <button onClick={clear} className="text-sm font-semibold text-ink-soft hover:text-primary">
          Xóa tất cả
        </button>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.lines[0].organizerId} className="rounded-xl border border-line bg-white">
              <h2 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">{group.brandName}</h2>
              <ul className="divide-y divide-line">
                {group.lines.map((item) => {
                  const soldOut = item.stockQuantity <= 0;
                  return (
                    <li key={item.productId} className="flex gap-3 p-4">
                      <Link
                        to={`/products/${item.productId}`}
                        className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-primary-soft to-cream-dark"
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                        ) : (
                          <Moon className="size-8 text-primary/40" strokeWidth={1.25} />
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link to={`/products/${item.productId}`} className="line-clamp-2 text-sm font-semibold text-ink hover:text-primary">
                          {item.name}
                        </Link>
                        <p className="mt-1 text-sm font-bold text-primary">{formatVnd(item.price)}</p>
                        {soldOut && <p className="mt-1 text-xs font-semibold text-primary-dark">Đã hết hàng</p>}

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="inline-flex items-center overflow-hidden rounded-lg border border-line text-sm">
                            <button
                              onClick={() => setQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label="Giảm số lượng"
                              className="grid size-8 place-items-center hover:bg-cream disabled:opacity-40"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-10 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => setQuantity(item.productId, item.quantity + 1)}
                              disabled={soldOut || item.quantity >= Math.min(item.stockQuantity, 99)}
                              aria-label="Tăng số lượng"
                              className="grid size-8 place-items-center hover:bg-cream disabled:opacity-40"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            onClick={() => remove(item.productId)}
                            aria-label={`Xóa ${item.name}`}
                            className="grid size-8 place-items-center rounded-lg border border-line text-ink-soft hover:border-primary hover:text-primary"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <aside className="space-y-3 rounded-xl border border-line bg-white p-5 lg:sticky lg:top-36">
          <h2 className="font-semibold text-ink">Tóm tắt đơn</h2>
          <div className="flex justify-between text-sm text-ink-soft">
            <span>Tạm tính ({count} sản phẩm)</span>
            <span className="font-semibold text-ink">{formatVnd(total)}</span>
          </div>
          {hasSoldOut && <FormAlert type="error">Có sản phẩm đã hết hàng, hãy xóa trước khi thanh toán.</FormAlert>}
          <button
            disabled
            title="Chức năng đặt hàng chưa có trên máy chủ"
            className="w-full cursor-not-allowed rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white opacity-60"
          >
            Đặt hàng (sắp có)
          </button>
          <p className="text-xs text-ink-muted">
            Giỏ hàng được lưu trên trình duyệt này. Đặt hàng và thanh toán sẽ mở khi máy chủ hỗ trợ đơn hàng.
          </p>
        </aside>
      </div>
    </Container>
  );
}
