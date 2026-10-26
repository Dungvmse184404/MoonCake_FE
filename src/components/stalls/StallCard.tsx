import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STALL_STATUS_LABEL } from "@/lib/labels";
import type { Stall } from "@/lib/organizerApi";

export function StallCard({ stall }: { stall: Stall }) {
  return (
    <Link to={`/stalls/${stall.id}`} className="block h-full rounded-xl border border-line bg-white p-5 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-dark font-serif text-xl font-black text-primary-soft">
          {stall.name.trim()[0]?.toUpperCase()}
        </div>
        <StatusBadge tone={stall.status === "Available" ? "success" : "info"}>
          {STALL_STATUS_LABEL[stall.status]}
        </StatusBadge>
      </div>
      <h3 className="mt-3 font-semibold text-ink">{stall.name}</h3>
      <p className="text-xs font-semibold text-primary">{stall.code}</p>
      {stall.location && (
        <p className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
          <MapPin size={12} /> {stall.location}
        </p>
      )}
    </Link>
  );
}
