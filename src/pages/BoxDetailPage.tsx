import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Check, ChevronLeft } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { BoxFiller, boxDetail, boxSelections, isBoxComplete, type BoxRow } from "@/components/catalog/BoxFiller";
import { OptionChips } from "@/components/catalog/OptionChips";
import { Container } from "@/components/layout/Container";
import { CakeImage } from "@/components/ui/CakeImage";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { boxApi } from "@/lib/boxApi";
import { friendlyError } from "@/lib/errors";
import { formatVnd } from "@/lib/labels";
import { saveCheckout } from "@/lib/checkout";
import { loadStallNames } from "@/lib/stallNames";
import { useAsync } from "@/lib/useAsync";
import { useProfileGaps } from "@/lib/useProfileGaps";

// The buyer fills the box (quantities add up to its capacity) and buys it straight away.
// The cart only keeps the box and stall; its cakes are chosen here when ordering.
export function BoxDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const profileGaps = useProfileGaps();
  const { cart, addBox } = useCart();
  const { data: box, loading, error } = useAsync(() => boxApi.get(id), [id]);
  const { data: stallNames } = useAsync(() => loadStallNames(), []);

  const [rows, setRows] = useState<BoxRow[]>([]);
  const [stallId, setStallId] = useState("");
  const [busy, setBusy] = useState<"buy" | "cart" | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!box) return;
    const preferred = params.get("stallId");
    setStallId(box.stallIds.find((s) => s === preferred) ?? (box.stallIds.length === 1 ? box.stallIds[0] : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box?.id]);

  if (loading && !box) return <Container className="py-16 text-center text-ink-muted">Đang tải...</Container>;
  if (error || !box) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-lg space-y-4 text-center">
          <FormAlert type="error">{error || "Không tìm thấy hộp bánh."}</FormAlert>
          <Link to="/cake-sets" className="inline-block text-sm font-semibold text-primary hover:underline">
            Quay lại danh sách hộp bánh
          </Link>
        </div>
      </Container>
    );
  }

  const products = box.products.filter((p) => p.status === "Active");
  const remaining = box.capacity - rows.reduce((n, r) => n + r.quantity, 0);
  const complete = isBoxComplete(rows, box.capacity);
  const stalls = box.stallIds.map((sid) => ({ id: sid, name: stallNames?.[sid] ?? "Gian hàng" }));
  const needsStall = stalls.length > 1;
  const savedLine = cart?.groups
    .filter((g) => !needsStall || g.stallId === stallId)
    .flatMap((g) => g.items)
    .find((i) => i.boxItemId === box.id);

  const toLogin = () =>
    navigate("/login", { state: { from: location.pathname + location.search, notice: "Vui lòng đăng nhập để tiếp tục." } });

  const onBuy = () => {
    if (!user) return toLogin();
    const detail = boxDetail(rows, products);
    saveCheckout([
      {
        key: box.id,
        line: { itemType: "Box", boxItemId: box.id, stallId: stallId || null, selections: boxSelections(rows) },
        name: box.name,
        imageUrl: box.imageUrl,
        kind: "box",
        detail,
        unitPrice: box.price,
        quantity: 1,
        organizerId: box.organizerId,
        brandName: box.organizerBrandName,
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
      await addBox(box.id, stallId || null);
      setNotice({ type: "success", message: "Đã lưu hộp vào giỏ hàng." });
    } catch (e) {
      setNotice({ type: "error", message: friendlyError(e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Container className="py-8">
      <Link to="/cake-sets" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-primary">
        <ChevronLeft size={16} /> Bánh và hộp bánh
      </Link>

      <div className="mt-4 grid gap-8 rounded-2xl border border-line bg-white p-6 shadow-sm md:grid-cols-2">
        <CakeImage src={box.imageUrl} alt={box.name} kind="box" className="aspect-square rounded-xl" iconClassName="size-24" />

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Hộp {box.capacity} bánh</p>
            <h1 className="mt-1 font-serif text-3xl font-black text-primary-dark">{box.name}</h1>
            <p className="mt-1 text-sm text-ink-muted">Gian hàng {box.organizerBrandName}</p>
            <p className="mt-3 text-2xl font-bold text-primary">{formatVnd(box.price)}</p>
            {box.description && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{box.description}</p>}
          </div>

          {needsStall && <OptionChips label="Mua tại gian hàng" value={stallId} options={stalls} onChange={setStallId} />}
          {stalls.length === 1 && (
            <p className="text-sm text-ink-soft">
              <span className="text-ink-muted">Gian hàng: </span>
              {stalls[0].name}
            </p>
          )}

          {products.length === 0 ? (
            <p className="rounded-lg bg-cream px-4 py-3 text-sm font-semibold text-ink-soft">Hộp này chưa có bánh để chọn.</p>
          ) : (
            <div className="space-y-3">
              <BoxFiller products={products} capacity={box.capacity} rows={rows} onChange={setRows} />

              <div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={onBuy}
                    disabled={busy !== null || !complete || (needsStall && !stallId)}
                    className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Mua ngay
                  </button>
                  <button
                    onClick={onSave}
                    disabled={busy !== null || (needsStall && !stallId) || Boolean(savedLine)}
                    className="rounded-lg border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy === "cart" ? "Đang lưu..." : savedLine ? "Đã có trong giỏ" : "Lưu vào giỏ hàng"}
                  </button>
                </div>
                {!complete && remaining === 0 && (
                  <p className="mt-1.5 text-xs text-ink-muted">Hãy chọn đủ loại bánh và nhân bánh.</p>
                )}
              </div>
            </div>
          )}

          {notice && <FormAlert type={notice.type}>{notice.message}</FormAlert>}
          {notice?.type === "error" && profileGaps.length > 0 && (
            <Link to="/account/profile" className="text-sm font-semibold text-primary hover:underline">
              Cập nhật hồ sơ
            </Link>
          )}
          {savedLine && notice?.type !== "error" && (
            <p className="inline-flex items-center gap-2 text-sm text-ink-soft">
              <Check size={14} className="text-primary" /> Hộp đã có trong giỏ.{" "}
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
