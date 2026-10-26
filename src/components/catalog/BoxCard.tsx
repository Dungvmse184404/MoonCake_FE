import { Link } from "react-router-dom";
import { CakeImage } from "@/components/ui/CakeImage";
import type { BoxItem } from "@/lib/boxApi";
import { formatVnd } from "@/lib/labels";

export function BoxCard({ box }: { box: BoxItem }) {
  return (
    <Link
      to={`/boxes/${box.id}`}
      className="overflow-hidden rounded-xl border border-line bg-white transition hover:shadow-md"
    >
      <CakeImage src={box.imageUrl} alt={box.name} kind="box" className="aspect-[4/3]" />
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-ink">{box.name}</h3>
        <p className="mt-0.5 text-xs text-ink-muted">
          {box.organizerBrandName} · Hộp {box.capacity} bánh
        </p>
        <p className="mt-2 font-bold text-primary">{formatVnd(box.price)}</p>
      </div>
    </Link>
  );
}
