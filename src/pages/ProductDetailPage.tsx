import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, ChevronLeft, Minus, Moon, Plus } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { Container } from "@/components/layout/Container";
import { useCart } from "@/context/CartContext";
import { catalogApi } from "@/lib/catalog";
import { formatVnd } from "@/lib/labels";
import { useAsync } from "@/lib/useAsync";

export function ProductDetailPage() {
  const { id = "" } = useParams();
  const { data: product, loading, error } = useAsync(() => catalogApi.getProduct(id), [id]);
  const { items, add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (loading && !product) return <Container className="py-16 text-center text-ink-muted">Đang tải...</Container>;

  if (error || !product) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-lg space-y-4 text-center">
          <FormAlert type="error">{error || "Không tìm thấy sản phẩm."}</FormAlert>
          <Link to="/products" className="inline-block text-sm font-semibold text-primary hover:underline">
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </Container>
    );
  }

  const outOfStock = product.status === "OutOfStock" || product.stockQuantity <= 0;
  const inCart = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const room = Math.max(0, Math.min(product.stockQuantity, 99) - inCart);
  const pick = Math.min(quantity, Math.max(room, 1));

  return (
    <Container className="py-8">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-primary">
        <ChevronLeft size={16} /> Sản phẩm
      </Link>

      <div className="mt-4 grid gap-8 rounded-2xl border border-line bg-white p-6 shadow-sm md:grid-cols-2">
        <div className="grid aspect-square place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-primary-soft to-cream-dark">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="size-full object-cover" />
          ) : (
            <Moon className="size-24 text-primary/40" strokeWidth={1} />
          )}
        </div>

        <div>
          {product.categories.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {product.categories.map((c) => c.name).join(", ")}
            </p>
          )}
          <h1 className="mt-1 font-serif text-3xl font-black text-primary-dark">{product.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">Gian hàng {product.organizerBrandName}</p>
          <p className="mt-4 text-2xl font-bold text-primary">{formatVnd(product.price)}</p>

          {product.fillings.length > 0 && (
            <p className="mt-3 text-sm text-ink-soft">
              <span className="text-ink-muted">Nhân bánh: </span>
              {product.fillings.map((f) => f.name).join(", ")}
            </p>
          )}
          <p className="mt-1 text-sm text-ink-soft">
            <span className="text-ink-muted">Tình trạng: </span>
            {outOfStock ? "Hết hàng" : `Còn ${product.stockQuantity} sản phẩm`}
          </p>

          {product.description && <p className="mt-4 text-sm leading-relaxed text-ink-soft">{product.description}</p>}

          {!outOfStock && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center overflow-hidden rounded-lg border border-line text-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, pick - 1))}
                  disabled={pick <= 1}
                  aria-label="Giảm số lượng"
                  className="grid size-10 place-items-center hover:bg-cream disabled:opacity-40"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center font-semibold">{pick}</span>
                <button
                  onClick={() => setQuantity(Math.min(room, pick + 1))}
                  disabled={pick >= room}
                  aria-label="Tăng số lượng"
                  className="grid size-10 place-items-center hover:bg-cream disabled:opacity-40"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => {
                  add(product, pick);
                  setQuantity(1);
                  setAdded(true);
                }}
                disabled={room <= 0}
                className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {room <= 0 ? "Đã thêm tối đa" : "Thêm vào giỏ hàng"}
              </button>
            </div>
          )}
          {outOfStock && (
            <p className="mt-6 rounded-lg bg-cream px-4 py-3 text-sm font-semibold text-ink-soft">Sản phẩm tạm hết hàng.</p>
          )}
          {(added || inCart > 0) && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft">
              <Check size={14} className="text-primary" /> Trong giỏ: {inCart}.{" "}
              <Link to="/cart" className="font-semibold text-primary hover:underline">
                Xem giỏ hàng
              </Link>
            </p>
          )}
        </div>
      </div>
    </Container>
  );
}
