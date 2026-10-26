import { useEffect, useMemo, useState } from "react";
import { ChipDrawer } from "@/components/catalog/ChipDrawer";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { Container } from "@/components/layout/Container";
import { RequireLogin } from "@/components/layout/RequireLogin";
import { CakeImage } from "@/components/ui/CakeImage";
import { useCart } from "@/context/CartContext";
import type { CartItem } from "@/lib/cartApi";
import { catalogApi, type Product } from "@/lib/catalog";
import { friendlyError } from "@/lib/errors";
import { formatVnd } from "@/lib/labels";
import { saveCheckout } from "@/lib/checkout";
import { loadStallNames } from "@/lib/stallNames";

interface Draft {
  selected: boolean;
  quantity: number;
  categoryId: string;
  fillingId: string;
}


const pickOnly = (list: Array<{ id: string }>) => (list.length === 1 ? list[0].id : "");

export function CartPage() {
  return (
    <RequireLogin message="Đăng nhập để xem giỏ hàng của bạn.">
      <CartContent />
    </RequireLogin>
  );
}

// The cart is a saved list. Product lines are bought from here as direct product orders
// (quantity, category and filling chosen now); box lines open the box page to pick their cakes.
function CartContent() {
  const navigate = useNavigate();
  const { cart, loading, refresh, remove } = useCart();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [stallNames, setStallNames] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [error, setError] = useState("");

  const lines = useMemo(
    () =>
      cart?.groups.flatMap((g) =>
        g.items.map((item) => ({ item, stallId: g.stallId ?? null, organizerId: g.organizerId, brandName: g.organizerBrandName })),
      ) ?? [],
    [cart],
  );

  useEffect(() => {
    void refresh();
    void loadStallNames().then(setStallNames);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Category, filling and stock come from the product itself
  useEffect(() => {
    const missing = lines.filter(({ item }) => item.productId && !products[item.productId]);
    if (!missing.length) return;
    let cancelled = false;
    Promise.all(missing.map(({ item }) => catalogApi.getProduct(item.productId!).catch(() => null))).then((found) => {
      if (cancelled) return;
      setProducts((current) => {
        const next = { ...current };
        for (const p of found) if (p) next[p.id] = p;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [lines, products]);

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };
      for (const { item } of lines) {
        const product = item.productId ? products[item.productId] : undefined;
        if (!product || next[item.id]) continue;
        next[item.id] = {
          selected: false,
          quantity: 1,
          categoryId: pickOnly(product.categories),
          fillingId: pickOnly(product.fillings),
        };
      }
      return next;
    });
  }, [lines, products]);

  const patch = (id: string, change: Partial<Draft>) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...change } }));

  const chosen = lines.filter(({ item }) => item.itemType === "Product" && drafts[item.id]?.selected);
  const chosenTotal = chosen.reduce((sum, { item }) => sum + item.unitPrice * drafts[item.id].quantity, 0);

  const onRemove = async (item: CartItem) => {
    setError("");
    try {
      await remove(item.id);
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  const onContinue = () => {
    setError("");
    if (!chosen.length) return setError("Hãy chọn ít nhất một sản phẩm để đặt hàng.");
    if (chosen.some(({ item }) => !drafts[item.id].categoryId || !drafts[item.id].fillingId)) {
      return setError("Hãy chọn loại bánh và nhân bánh cho các sản phẩm đã chọn.");
    }

    saveCheckout(
      chosen.map(({ item, stallId, organizerId, brandName }) => {
        const draft = drafts[item.id];
        const product = products[item.productId!];
        const category = product?.categories.find((c) => c.id === draft.categoryId)?.name;
        const filling = product?.fillings.find((f) => f.id === draft.fillingId)?.name;
        return {
          key: item.id,
          line: {
            itemType: "Product",
            productId: item.productId!,
            stallId,
            categoryId: draft.categoryId,
            fillingId: draft.fillingId,
            quantity: draft.quantity,
          },
          name: item.name,
          imageUrl: item.imageUrl,
          kind: "product",
          detail: [category, filling].filter(Boolean).join(" · "),
          unitPrice: item.unitPrice,
          quantity: draft.quantity,
          organizerId,
          brandName,
          stallId,
          cartItemId: item.id,
        };
      }),
    );
    navigate("/checkout");
  };

  if (!cart && loading) return <Container className="py-16 text-center text-ink-muted">Đang tải...</Container>;

  if (!lines.length) {
    return (
      <Container className="py-16 text-center">
        <ShoppingCart className="mx-auto text-primary" size={48} strokeWidth={1.25} />
        <h1 className="mt-4 font-serif text-2xl font-black text-primary-dark">Giỏ hàng trống</h1>
        <p className="mt-1 text-sm text-ink-soft">Lưu vài chiếc bánh Trung thu để đặt sau nhé.</p>
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
      <h1 className="font-serif text-2xl font-black text-primary-dark">Giỏ hàng ({lines.length})</h1>
      <p className="mt-1 text-sm text-ink-soft">Chọn sản phẩm, số lượng và nhân bánh rồi đặt hàng. Hộp combo cần chọn bánh trước khi mua.</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="space-y-4">
          {cart?.groups.map((group) => (
            <section key={`${group.organizerId}-${group.stallId ?? "online"}`} className="rounded-xl border border-line bg-white">
              <h2 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">
                {group.organizerBrandName}
                <span className="ml-2 text-xs font-normal text-ink-muted">
                  {group.stallId ? (stallNames[group.stallId] ?? "Gian hàng") : "Bán online"}
                </span>
              </h2>
              <ul className="divide-y divide-line">
                {group.items.map((item) => {
                  const product = item.productId ? products[item.productId] : undefined;
                  const draft = drafts[item.id];
                  const query = `?cartItem=${item.id}${group.stallId ? `&stallId=${group.stallId}` : ""}`;
                  const link = item.productId ? `/products/${item.productId}${query}` : `/boxes/${item.boxItemId}${query}`;
                  const unorderable = product && (product.categories.length === 0 || product.fillings.length === 0);
                  const soldOut = product && (product.status !== "Active" || product.stockQuantity <= 0);

                  return (
                    <li key={item.id} className="flex gap-3 p-4">
                      {item.itemType === "Product" ? (
                        <input
                          type="checkbox"
                          checked={draft?.selected ?? false}
                          disabled={!draft || Boolean(unorderable) || Boolean(soldOut)}
                          onChange={(e) => patch(item.id, { selected: e.target.checked })}
                          aria-label={`Chọn ${item.name}`}
                          className="mt-1 size-4 shrink-0 accent-[var(--color-primary)] disabled:opacity-40"
                        />
                      ) : (
                        <span className="size-4 shrink-0" />
                      )}
                      <Link to={link} className="shrink-0">
                        <CakeImage
                          src={item.imageUrl}
                          alt={item.name}
                          kind={item.itemType === "Box" ? "box" : "product"}
                          className="size-20 rounded-lg"
                          iconClassName="size-8"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link to={link} className="line-clamp-2 text-sm font-semibold text-ink hover:text-primary">
                            {item.name}
                          </Link>
                          <button
                            onClick={() => onRemove(item)}
                            aria-label={`Xóa ${item.name}`}
                            className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-ink-soft hover:border-primary hover:text-primary"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-primary">{formatVnd(item.unitPrice)}</p>

                        {item.itemType === "Box" && (
                          <Link
                            to={link}
                            className="mt-2 inline-block rounded-lg border border-primary px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary-soft"
                          >
                            Chọn bánh và mua
                          </Link>
                        )}

                        {item.itemType === "Product" && soldOut && (
                          <p className="mt-1 text-xs font-semibold text-primary-dark">Sản phẩm đã hết hàng hoặc ngừng bán.</p>
                        )}
                        {item.itemType === "Product" && !soldOut && unorderable && (
                          <p className="mt-1 text-xs text-ink-muted">Sản phẩm chưa có đủ loại bánh và nhân bánh.</p>
                        )}

                        {item.itemType === "Product" && product && draft && !soldOut && !unorderable && (
                          <div className="mt-2 flex flex-wrap items-start gap-x-6 gap-y-2">
                            <ChipDrawer
                              label="Loại bánh"
                              options={product.categories}
                              value={draft.categoryId}
                              onChange={(categoryId) => patch(item.id, { categoryId })}
                            />
                            <ChipDrawer
                              label="Nhân bánh"
                              options={product.fillings}
                              value={draft.fillingId}
                              onChange={(fillingId) => patch(item.id, { fillingId })}
                            />
                            <div className="ml-auto inline-flex items-center self-end overflow-hidden rounded-lg border border-line text-sm">
                              <button
                                onClick={() => patch(item.id, { quantity: Math.max(1, draft.quantity - 1) })}
                                disabled={draft.quantity <= 1}
                                aria-label="Giảm số lượng"
                                className="grid size-8 place-items-center hover:bg-cream disabled:opacity-40"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-10 text-center font-semibold">{draft.quantity}</span>
                              <button
                                onClick={() => patch(item.id, { quantity: Math.min(product.stockQuantity, draft.quantity + 1) })}
                                disabled={draft.quantity >= product.stockQuantity}
                                aria-label="Tăng số lượng"
                                className="grid size-8 place-items-center hover:bg-cream disabled:opacity-40"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <aside className="space-y-3 rounded-xl border border-line bg-white p-5 lg:sticky lg:top-36">
          <h2 className="font-semibold text-ink">Đặt hàng</h2>
          <div className="flex justify-between text-sm text-ink-soft">
            <span>Đã chọn {chosen.length} sản phẩm</span>
            <span className="font-semibold text-ink">{formatVnd(chosenTotal)}</span>
          </div>
          {error && <FormAlert type="error">{error}</FormAlert>}
          <button
            onClick={onContinue}
            disabled={!chosen.length}
            className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            Đặt hàng
          </button>
          <p className="text-xs text-ink-muted">Bước tiếp theo: chọn cách nhận hàng và phương thức thanh toán.</p>
        </aside>
      </div>
    </Container>
  );
}
