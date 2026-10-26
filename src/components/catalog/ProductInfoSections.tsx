import { Link } from "react-router-dom";
import { BadgeCheck, MapPin, PackageCheck, Store, Truck, Wallet } from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { catalogApi, type Product } from "@/lib/catalog";
import { loadStalls } from "@/lib/stallNames";
import { useAsync } from "@/lib/useAsync";

const cardClass = "mt-6 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6";

// Seller card: brand, the stalls the product is sold in and a link to the rest of the shop
export function SellerCard({ product }: { product: Product }) {
  const { data: stalls } = useAsync(() => loadStalls(), []);
  const sellerStalls = (product.stallIds ?? []).map((id) => stalls?.[id]).filter((s) => s !== undefined);
  const shopLink = `/products?organizerId=${product.organizerId}&brand=${encodeURIComponent(product.organizerBrandName)}`;

  return (
    <section className={`${cardClass} flex flex-col gap-5 md:flex-row md:items-start`} aria-label="Thông tin gian hàng">
      <div className="flex min-w-0 items-center gap-4 md:w-80 md:shrink-0">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <Store size={26} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{product.organizerBrandName}</p>
          <p className="text-xs text-ink-muted">{sellerStalls.length ? `Bán tại ${sellerStalls.length} gian hàng` : "Bán online"}</p>
          <Link
            to={shopLink}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-primary hover:text-primary"
          >
            <Store size={13} /> Xem sản phẩm của gian hàng
          </Link>
        </div>
      </div>

      {sellerStalls.length > 0 && (
        <ul className="grid flex-1 gap-3 text-sm sm:grid-cols-2">
          {sellerStalls.map((s) => (
            <li key={s.id}>
              <Link to={`/stalls/${s.id}`} className="block rounded-xl bg-cream px-4 py-3 transition hover:bg-primary-soft">
                <p className="font-semibold text-ink">
                  {s.code} · {s.name}
                </p>
                {s.location && (
                  <p className="mt-0.5 flex items-start gap-1 text-xs text-ink-muted">
                    <MapPin size={12} className="mt-0.5 shrink-0" /> {s.location}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Description in its own card, with the product facts as a table underneath
export function DescriptionCard({ product }: { product: Product }) {
  const rows: Array<[string, string]> = [
    ["Loại bánh", product.categories.map((c) => c.name).join(", ")],
    ["Nhân bánh", product.fillings.map((f) => f.name).join(", ")],
    ["Thương hiệu", product.organizerBrandName],
    ["Tình trạng", product.status === "OutOfStock" || product.stockQuantity <= 0 ? "Hết hàng" : `Còn ${product.stockQuantity} sản phẩm`],
  ];

  return (
    <section className={`${cardClass} scroll-mt-32`} aria-labelledby="description-title">
      <h2 id="description-title" className="scroll-mt-32 mb-4 border-b border-line pb-4 font-serif text-xl font-black text-primary-dark">
        Mô tả sản phẩm
      </h2>
      {product.description ? (
        <p className="whitespace-pre-line text-sm leading-7 text-ink-soft">{product.description}</p>
      ) : (
        <p className="text-sm text-ink-muted">Gian hàng chưa thêm mô tả cho sản phẩm này.</p>
      )}

      <h3 className="mt-6 text-sm font-semibold text-ink">Thông tin sản phẩm</h3>
      <dl className="mt-2 overflow-hidden rounded-xl border border-line text-sm">
        {rows
          .filter(([, v]) => v)
          .map(([label, value], i) => (
            <div key={label} className={`grid grid-cols-[9rem_1fr] ${i % 2 === 0 ? "bg-cream/70" : "bg-white"}`}>
              <dt className="px-4 py-2.5 text-ink-muted">{label}</dt>
              <dd className="px-4 py-2.5 text-ink">{value}</dd>
            </div>
          ))}
      </dl>
    </section>
  );
}

const COMMITMENTS = [
  { icon: BadgeCheck, title: "Gian hàng được duyệt", desc: "Mọi đối tác đều qua xét duyệt của MoonCake" },
  { icon: Truck, title: "Giao tận nơi", desc: "Giao tới địa chỉ trong hồ sơ của bạn" },
  { icon: Wallet, title: "Thanh toán khi nhận", desc: "Trả tiền khi bánh tới tay" },
  { icon: PackageCheck, title: "Đổi trả trong 7 ngày", desc: "Nếu bánh lỗi hoặc giao sai" },
] as const;

export function CommitmentBar() {
  return (
    <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Cam kết của MoonCake">
      {COMMITMENTS.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
          <Icon size={22} className="shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{desc}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

// "shop": other products of the same brand. "similar": products of other brands, those sharing a category name
// first (categories belong to each brand, so ids never match across brands), then the newest ones.
export function RelatedProducts({ title, product, by }: { title: string; product: Product; by: "shop" | "similar" }) {
  const { data } = useAsync(
    () =>
      by === "shop"
        ? catalogApi.listProducts({ organizerId: product.organizerId, pageSize: 5 }).then((page) => page.items)
        : catalogApi.listFeaturedProducts(24),
    [product.id, by],
  );

  const names = new Set(product.categories.map((c) => c.name.trim().toLowerCase()));
  const shares = (p: Product) => p.categories.some((c) => names.has(c.name.trim().toLowerCase()));
  const candidates = (data ?? []).filter((p) => p.id !== product.id && (by === "shop" || p.organizerId !== product.organizerId));
  const items = (by === "shop" ? candidates : [...candidates.filter(shares), ...candidates.filter((p) => !shares(p))]).slice(0, 4);
  if (!items.length) return null;

  return (
    <section className="mt-8" aria-label={title}>
      <h2 className="font-serif text-xl font-black text-primary-dark">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
