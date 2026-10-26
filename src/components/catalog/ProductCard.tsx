import { Link } from "react-router-dom";
import { CakeImage } from "@/components/ui/CakeImage";
import { formatVnd } from "@/lib/labels";
import type { Product } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="overflow-hidden rounded-xl border border-line bg-white transition hover:shadow-md"
    >
      <CakeImage src={product.imageUrl} alt={product.name} className="aspect-[4/3]" />
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-ink">{product.name}</h3>
        <p className="mt-0.5 text-xs text-ink-muted">{product.organizerBrandName}</p>
        <p className="mt-2 font-bold text-primary">{formatVnd(product.price)}</p>
      </div>
    </Link>
  );
}
