import { useEffect, useRef, useState } from "react";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl.js";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import { Crosshair, Loader2, Maximize2, Minimize2, Minus, Plus, Search } from "lucide-react";
import { getPlaceCoordinates, TILEMAP_KEY, vietmapAutocomplete, type VietMapSearchResult } from "@/lib/vietmap";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapMarker extends LatLng {
  id: string;
  label: string;
  href?: string;
}

interface Props {
  // The picked point (picker mode)
  pin?: LatLng | null;
  // Enables picking: clicking the map, searching or locating moves the pin
  onPick?: (point: LatLng) => void;
  zoomTo?: (LatLng & { zoom: number }) | null;
  // Extra read-only markers, e.g. stalls; the view fits them when there is no pin
  markers?: MapMarker[];
  // Clicking a marker calls this with its id (the popup still opens)
  onMarkerClick?: (id: string) => void;
  height?: number;
}

const DEFAULT_CENTER: [number, number] = [106.6297, 10.8231]; // [lng, lat], Ho Chi Minh City

const PIN_HTML = `
  <div style="position:relative;width:30px;height:42px;margin-top:-21px">
    <div style="position:absolute;width:44px;height:44px;top:-7px;left:-7px;border-radius:50%;background:rgba(160,24,30,.22);animation:mc-pin-pulse 1.8s ease-out infinite"></div>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="30" height="42" style="position:relative;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))">
      <path d="M15 0C7.27 0 1 6.27 1 14c0 10.5 14 28 14 28S29 24.5 29 14C29 6.27 22.73 0 15 0z" fill="#a0181e"/>
      <circle cx="15" cy="14" r="6" fill="white"/>
    </svg>
  </div>`;

const STALL_HTML = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32" style="margin-top:-16px;filter:drop-shadow(0 1px 3px rgba(0,0,0,.35));cursor:pointer">
    <path d="M12 0C5.6 0 .5 5.1.5 11.5 0 20 12 32 12 32s11.5-12 11.5-20.5C23.5 5.1 18.4 0 12 0z" fill="#c9962c"/>
    <circle cx="12" cy="11.5" r="4.5" fill="white"/>
  </svg>`;

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// VietMap map (ported from FengDesk's LocationPickerMap): pick a point and/or show markers.
export function VietMap({ pin, onPick, zoomTo, markers, onMarkerClick, height = 300 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const pinRef = useRef<vietmapgl.Marker | null>(null);
  const markerRefs = useRef<vietmapgl.Marker[]>([]);
  // The click handler is bound once, so read the latest callback through a ref
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

  const [fullscreen, setFullscreen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VietMapSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<number | undefined>(undefined);

  const placePin = (point: LatLng) => {
    const map = mapRef.current;
    if (!map) return;
    if (pinRef.current) {
      pinRef.current.setLngLat([point.lng, point.lat]);
      return;
    }
    const el = document.createElement("div");
    el.innerHTML = PIN_HTML;
    pinRef.current = new vietmapgl.Marker({ element: el }).setLngLat([point.lng, point.lat]).addTo(map);
  };

  const pick = (point: LatLng, zoom?: number) => {
    onPickRef.current?.(point);
    placePin(point);
    mapRef.current?.flyTo({ center: [point.lng, point.lat], ...(zoom ? { zoom } : {}), speed: 1.5 });
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new vietmapgl.Map({
      container: containerRef.current,
      style: `https://maps.vietmap.vn/api/maps/light/styles.json?apikey=${TILEMAP_KEY}`,
      center: pin ? [pin.lng, pin.lat] : DEFAULT_CENTER,
      zoom: pin ? 15 : 12,
      hash: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      if (pin) placePin(pin);
    });
    map.on("click", (e) => {
      if (!onPickRef.current) return;
      pick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      pinRef.current = null;
      markerRefs.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pin) placePin(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin?.lat, pin?.lng]);

  useEffect(() => {
    if (zoomTo) mapRef.current?.flyTo({ center: [zoomTo.lng, zoomTo.lat], zoom: zoomTo.zoom, speed: 1.5 });
  }, [zoomTo]);

  // Read-only markers; fit the view to them unless a pin is being edited
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const m of markerRefs.current) m.remove();
    markerRefs.current = [];
    if (!markers?.length) return;

    for (const m of markers) {
      const el = document.createElement("div");
      el.innerHTML = STALL_HTML;
      el.addEventListener("click", () => onMarkerClickRef.current?.(m.id));
      const label = escapeHtml(m.label);
      const html = m.href ? `<a href="${m.href}" style="font-weight:600;color:#a0181e">${label}</a>` : `<span style="font-weight:600">${label}</span>`;
      const marker = new vietmapgl.Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .setPopup(new vietmapgl.Popup({ offset: 18, closeButton: false }).setHTML(html))
        .addTo(map);
      markerRefs.current.push(marker);
    }

    if (!pin) {
      if (markers.length === 1) map.jumpTo({ center: [markers[0].lng, markers[0].lat], zoom: 15 });
      else {
        const bounds = new vietmapgl.LngLatBounds();
        for (const m of markers) bounds.extend([m.lng, m.lat]);
        map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 0 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  useEffect(() => {
    const timer = window.setTimeout(() => mapRef.current?.resize(), 100);
    return () => window.clearTimeout(timer);
  }, [fullscreen]);

  const onSearch = (value: string) => {
    setQuery(value);
    window.clearTimeout(searchTimer.current);
    if (!value.trim()) return setResults([]);
    setSearching(true);
    searchTimer.current = window.setTimeout(async () => {
      const center = mapRef.current?.getCenter();
      setResults(await vietmapAutocomplete(value, center ? { lat: center.lat, lng: center.lng } : undefined));
      setSearching(false);
    }, 500);
  };

  const onSelect = async (result: VietMapSearchResult) => {
    const coords = await getPlaceCoordinates(result.ref_id);
    if (!coords) return;
    setQuery(result.display);
    setResults([]);
    pick(coords, 15);
  };

  const onLocate = () =>
    navigator.geolocation?.getCurrentPosition((p) => pick({ lat: p.coords.latitude, lng: p.coords.longitude }, 15));

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const controlClass = "grid size-9 place-items-center bg-white text-ink-soft hover:text-primary";

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[9999] flex flex-col bg-cream"
          : "relative overflow-hidden rounded-xl border border-line"
      }
      style={fullscreen ? undefined : { height }}
    >
      <div ref={containerRef} className={`size-full flex-1 ${onPick ? "cursor-crosshair" : ""}`} />

      {onPick && (
        <div className="absolute left-3 right-16 top-3 z-[1000] max-w-xs" onMouseDown={stop} onClick={stop}>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </span>
            <input
              value={query}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Tìm kiếm địa điểm..."
              className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-primary"
            />
          </div>
          {results.length > 0 && (
            <div className="mt-1 max-h-60 divide-y divide-line overflow-y-auto rounded-lg border border-line bg-white shadow-lg">
              {results.map((r) => (
                <button
                  key={r.ref_id}
                  type="button"
                  onClick={() => onSelect(r)}
                  title={r.display}
                  className="block w-full truncate px-3 py-2 text-left text-sm text-ink-soft hover:bg-cream"
                >
                  {r.display}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {onPick && pin && (
        <div className="absolute bottom-7 left-1/2 z-[1000] -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-ink-soft shadow">
          {pin.lat.toFixed(5)}° N, {pin.lng.toFixed(5)}° E
        </div>
      )}

      <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2" onMouseDown={stop} onClick={stop}>
        <button
          type="button"
          onClick={() => setFullscreen((v) => !v)}
          title={fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          className={`${controlClass} rounded-lg shadow`}
        >
          {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <div className="overflow-hidden rounded-lg shadow">
          <button type="button" onClick={() => mapRef.current?.zoomIn()} title="Phóng to" className={controlClass}>
            <Plus size={16} />
          </button>
          <button type="button" onClick={() => mapRef.current?.zoomOut()} title="Thu nhỏ" className={`${controlClass} border-t border-line`}>
            <Minus size={16} />
          </button>
        </div>
        {onPick && (
          <button type="button" onClick={onLocate} title="Vị trí của tôi" className={`${controlClass} rounded-lg shadow`}>
            <Crosshair size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
