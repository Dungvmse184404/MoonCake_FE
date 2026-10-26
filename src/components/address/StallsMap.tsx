import { useEffect, useState } from "react";
import { LazyVietMap } from "@/components/address/LazyVietMap";
import type { MapMarker } from "@/components/address/VietMap";
import { parseAddress } from "@/lib/adminUnits";
import { geocodeAddress, vietmapEnabled } from "@/lib/vietmap";

interface StallLike {
  id: string;
  code: string;
  name: string;
  location?: string | null;
}

// Only addresses entered with the address picker (ending in ward, district, province) are placed on the map;
// free text such as "Khu A, tầng 1" would land somewhere random.
export const isMappable = (location?: string | null) => Boolean(location && parseAddress(location).province);

interface Props {
  stalls: StallLike[];
  title?: string;
  height?: number;
  linkToStall?: boolean;
  onSelect?: (id: string) => void;
}

export function StallsMap({ stalls, title, height = 280, linkToStall = true, onSelect }: Props) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const key = stalls.map((s) => `${s.id}:${s.location ?? ""}`).join("|");

  useEffect(() => {
    if (!vietmapEnabled) return;
    let stale = false;
    const mappable = stalls.filter((s) => isMappable(s.location));
    Promise.all(
      mappable.map(async (s): Promise<MapMarker | null> => {
        const point = await geocodeAddress(s.location!);
        return point ? { id: s.id, ...point, label: `${s.code} · ${s.name}`, href: linkToStall ? `/stalls/${s.id}` : undefined } : null;
      }),
    ).then((found) => {
      if (!stale) setMarkers(found.filter((m): m is MapMarker => m !== null));
    });
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, linkToStall]);

  if (!markers.length) return null;

  return (
    <section aria-label={title ?? "Bản đồ gian hàng"}>
      {title && <h2 className="mb-2 font-semibold text-ink">{title}</h2>}
      <LazyVietMap markers={markers} height={height} onMarkerClick={onSelect} />
    </section>
  );
}
