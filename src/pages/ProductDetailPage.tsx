import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Check, ChevronLeft, Minus, Plus } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { OptionChips } from "@/components/catalog/OptionChips";
import { CommitmentBar, DescriptionCard, RelatedProducts, SellerCard } from "@/components/catalog/ProductInfoSections";
import { Container } from "@/components/layout/Container";
import { CakeImage } from "@/components/ui/CakeImage";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { catalogApi } from "@/lib/catalog";
import { friendlyError } from "@/lib/errors";
import { formatVnd } from "@/lib/labels";
import { saveCheckout } from "@/lib/checkout";
import { loadStallNames } from "@/lib/stallNames";
import { useAsync } from "@/lib/useAsync";
import { useProfileGaps } from "@/lib/useProfileGaps";

const onlyOption = (list: Array<{ id: string }>, preferred?: string | null) =>
  list.find((x) => x.id === preferred)?.id ?? (list.length === 1 ? list[0].id : "");

// Buying goes straight through the product: category, filling, stall and quantity are sent with the order.
// The cart only keeps the product (and stall) for later.
export function ProductDetailPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const profileGaps = useProfileGaps();
  const { cart, addProduct } = useCart();
  const { data: product, loading, error } = useAsync(() => catalogApi.getProduct(id), [id]);
  const { data: stallNames } = useAsync(() => loadStallNames(), []);

  const [quantity, setQuantity] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [fillingId, setFillingId] = useState("");
  const [stallId, setStallId] = useState("");
  const [busy, setBusy] = useState<"buy" | "cart" | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Preselect the only option, or the stall the buyer saved in the cart (?stallId=)
  useEffect(() => {
    if (!product) return;
    setCategoryId(onlyOption(product.categories));
    setFillingId(onlyOption(product.fillings));
    setStallId(onlyOption((product.stallIds ?? []).map((sid) => ({ id: sid })), params.get("stallId")));
    setQuantity(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

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
  const stalls = (product.stallIds ?? []).map((sid) => ({ id: sid, name: stallNames?.[sid] ?? "Gian hàng" }));
  const needsStall = stalls.length > 1;
  // An order line needs one category and one filling, so a product without them cannot be bought yet
  const unorderable = product.categories.length === 0 || product.fillings.length === 0;
  const ready = Boolean(categoryId && fillingId && (!needsStall || stallId));
  const savedLine = cart?.groups
    .filter((g) => !needsStall || g.stallId === stallId)
    .flatMap((g) => g.items)
    .find((i) => i.productId === product.id);

  const toLogin = () =>
    navigate("/login", { state: { from: location.pathname + location.search, notice: "Vui lòng đăng nhập để tiếp tục." } });

  const onBuy = () => {
    if (!user) return toLogin();
    const category = product.categories.find((c) => c.id === categoryId)?.name;
    const filling = product.fillings.find((f) => f.id === fillingId)?.name;
    saveCheckout([
      {
        key: product.id,
        line: { itemType: "Product", productId: product.id, stallId: stallId || null, categoryId, fillingId, quantity },
        name: product.name,
        imageUrl: product.imageUrl,
        kind: "product",
        detail: [category, filling].filter(Boolean).join(" · "),
        unitPrice: product.price,
        quantity,
        organizerId: product.organizerId,
        brandName: product.organizerBrandName,
        stallId: stallId || null,
        cartItemId: params.get("cartItem") ?? undefined,
      },
    ]);
    navigate("/checkout");
  };

  const onSave = async () => {
    if (!user) return toLogin();
    setBusy("cart");
    setNotice(null);
    try {
      await addProduct(product.id, stallId || null);
      setNotice({ type: "success", message: "Đã lưu sản phẩm vào giỏ hàng." });
    } catch (e) {
      setNotice({ type: "error", message: friendlyError(e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Container className="py-8">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-primary">
        <ChevronLeft size={16} /> Sản phẩm
      </Link>

      <div className="mt-4 grid gap-8 rounded-2xl border border-line bg-white p-6 shadow-sm md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:p-8">
        <CakeImage src={product.imageUrl} alt={product.name} className="aspect-square w-full self-start rounded-xl" iconClassName="size-24" />

        <div className="space-y-4">
          <div>
            {product.categories.length > 0 && (
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {product.categories.map((c) => c.name).join(", ")}
              </p>
            )}
            <h1 className="mt-1 font-serif text-3xl font-black text-primary-dark">{product.name}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Gian hàng{" "}
              <Link
                to={`/products?organizerId=${product.organizerId}&brand=${encodeURIComponent(product.organizerBrandName)}`}
                className="font-semibold text-primary hover:underline"
              >
                {product.organizerBrandName}
              </Link>
            </p>
            <p className="mt-3 text-2xl font-bold text-primary">{formatVnd(product.price)}</p>
            <p className="mt-1 text-sm text-ink-soft">
              <span className="text-ink-muted">Tình trạng: </span>
              {outOfStock ? "Hết hàng" : `Còn ${product.stockQuantity} sản phẩm`}
            </p>
            {product.description && (
              <p className="mt-3 line-clamp-3 rounded-lg bg-cream px-3.5 py-2.5 text-sm leading-relaxed text-ink-soft">
                {product.description}{" "}
                <a href="#description-title" className="font-semibold text-primary hover:underline">
                  Xem mô tả
                </a>
              </p>
            )}
          </div>

          {outOfStock && <p className="rounded-lg bg-cream px-4 py-3 text-sm font-semibold text-ink-soft">Sản phẩm tạm hết hàng.</p>}
          {!outOfStock && unorderable && (
            <p className="rounded-lg bg-cream px-4 py-3 text-sm text-ink-soft">
              Sản phẩm này chưa có đủ loại bánh và nhân bánh nên chưa thể đặt hàng.
            </p>
          )}

          {!outOfStock && !unorderable && (
            <>
              {product.categories.length > 1 ? (
                <OptionChips label="Loại bánh" value={categoryId} options={product.categories} onChange={setCategoryId} />
              ) : (
                <p className="text-sm text-ink-soft">
                  <span className="text-ink-muted">Loại bánh: </span>
                  {product.categories[0].name}
                </p>
              )}
              {product.fillings.length > 1 ? (
                <OptionChips label="Nhân bánh" value={fillingId} options={product.fillings} onChange={setFillingId} />
              ) : (
                <p className="text-sm text-ink-soft">
                  <span className="text-ink-muted">Nhân bánh: </span>
                  {product.fillings[0].name}
                </p>
              )}
              {needsStall && <OptionChips label="Mua tại gian hàng" value={stallId} options={stalls} onChange={setStallId} />}
              {stalls.length === 1 && (
                <p className="text-sm text-ink-soft">
                  <span className="text-ink-muted">Gian hàng: </span>
                  {stalls[0].name}
                </p>
              )}
              {stalls.length === 0 && <p className="text-sm text-ink-muted">Sản phẩm bán online.</p>}

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center overflow-hidden rounded-lg border border-line text-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    aria-label="Giảm số lượng"
                    className="grid size-10 place-items-center hover:bg-cream disabled:opacity-40"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                    disabled={quantity >= product.stockQuantity}
                    aria-label="Tăng số lượng"
                    className="grid size-10 place-items-center hover:bg-cream disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-sm text-ink-soft">
                  Thành tiền <span className="font-bold text-primary">{formatVnd(product.price * quantity)}</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onBuy}
                  disabled={busy !== null || !ready}
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Mua ngay
                </button>
                <button
                  onClick={onSave}
                  disabled={busy !== null || (needsStall && !stallId) || Boolean(savedLine)}
                  className="rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === "cart" ? "Đang lưu..." : savedLine ? "Đã có trong giỏ" : "Thêm vào giỏ hàng"}
                </button>
              </div>
              {!ready && <p className="text-xs text-ink-muted">Hãy chọn đủ loại bánh, nhân bánh và gian hàng.</p>}
            </>
          )}

          {notice && (
            <FormAlert type={notice.type}>
              {notice.message}
              {notice.type === "success" && savedLine && (
                <>
                  {" "}
                  <Link to="/cart" className="font-semibold underline">
                    Xem giỏ hàng
                  </Link>
                </>
              )}
            </FormAlert>
          )}
          {notice?.type === "error" && profileGaps.length > 0 && (
            <Link to="/account/profile" className="text-sm font-semibold text-primary hover:underline">
              Cập nhật hồ sơ
            </Link>
          )}
          {savedLine && !notice && (
            <p className="inline-flex items-center gap-2 text-sm text-ink-soft">
              <Check size={14} className="text-primary" /> Sản phẩm đã có trong giỏ.{" "}
              <Link to="/cart" className="font-semibold text-primary hover:underline">
                Xem giỏ hàng
              </Link>
            </p>
          )}
        </div>
      </div>

      <SellerCard product={product} />
      <DescriptionCard product={product} />
      <CommitmentBar />
      <RelatedProducts title="Sản phẩm khác của gian hàng" product={product} by="shop" />
      <RelatedProducts title="Có thể bạn cũng thích" product={product} by="similar" />
    </Container>
  );
}
