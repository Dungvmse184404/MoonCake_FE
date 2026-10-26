import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { LazyVietMap } from "@/components/address/LazyVietMap";
import { SearchSelect } from "@/components/address/SearchSelect";
import type { LatLng } from "@/components/address/VietMap";
import {
  bareName,
  findUnit,
  formatAddress,
  getDistricts,
  getProvinces,
  getWards,
  parseAddress,
  type AdminUnit,
} from "@/lib/adminUnits";
import { findBestMatch, geocodeAddress, geocodeLocation, reverseGeocode, vietmapEnabled } from "@/lib/vietmap";

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  streetLabel?: string;
  streetPlaceholder?: string;
}

const toOptions = (units: AdminUnit[]) => units.map((u) => ({ id: u.id, name: u.name, shortName: bareName(u) }));

// Province > district > ward dropdowns, street and a VietMap picker (ported from FengDesk).
// Only the composed text is kept, e.g. "80 Ấp Vĩnh Thuận, x.Vĩnh Nhuận, h.Châu Thành, t.An Giang".
export function AddressField({
  label = "Địa chỉ",
  value,
  onChange,
  error,
  streetLabel = "Địa chỉ cụ thể",
  streetPlaceholder = "Số nhà, tên đường, ấp...",
}: Props) {
  const [provinces, setProvinces] = useState<AdminUnit[]>([]);
  const [districts, setDistricts] = useState<AdminUnit[]>([]);
  const [wards, setWards] = useState<AdminUnit[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [wardId, setWardId] = useState("");
  const [street, setStreet] = useState("");
  const [pin, setPin] = useState<LatLng | null>(null);
  const [zoomTo, setZoomTo] = useState<(LatLng & { zoom: number }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  // The text this field produced last; a different incoming value means it was set from outside
  const emitted = useRef<string | null>(null);

  const emit = (nextStreet: string, w?: AdminUnit, d?: AdminUnit, p?: AdminUnit) => {
    const text = formatAddress(nextStreet, w, d, p);
    emitted.current = text;
    onChange(text);
  };

  // Rebuild the dropdowns from a stored address (not from text this field just produced)
  useEffect(() => {
    if (emitted.current !== null && value === emitted.current) return;
    let stale = false;

    (async () => {
      try {
        const provinceList = await getProvinces();
        if (stale) return;
        setProvinces(provinceList);
        setLoadError("");

        const parsed = parseAddress(value);
        setStreet(parsed.street);
        const p = findUnit(provinceList, parsed.province);
        const districtList = p ? await getDistricts(p.id) : [];
        const d = findUnit(districtList, parsed.district);
        const wardList = d ? await getWards(d.id) : [];
        const w = findUnit(wardList, parsed.ward);
        if (stale) return;

        setDistricts(districtList);
        setWards(wardList);
        setProvinceId(p?.id ?? "");
        setDistrictId(d?.id ?? "");
        setWardId(w?.id ?? "");

        if (vietmapEnabled && value.trim() && p) {
          const point = await geocodeAddress(value);
          if (!stale && point) {
            setPin(point);
            setZoomTo({ ...point, zoom: 16 });
          }
        }
      } catch {
        if (!stale) setLoadError("Không tải được danh sách tỉnh/thành. Bạn vẫn có thể nhập địa chỉ cụ thể.");
      }
    })();

    return () => {
      stale = true;
    };
  }, [value]);

  const unitOf = (list: AdminUnit[], id: string) => list.find((u) => u.id === id);

  const zoomToArea = async (query: string, zoom: number) => {
    if (!vietmapEnabled) return;
    const point = await geocodeLocation(`${query}, Việt Nam`);
    if (point) setZoomTo({ ...point, zoom });
  };

  const onProvince = async (id: string) => {
    setProvinceId(id);
    setDistrictId("");
    setWardId("");
    setDistricts([]);
    setWards([]);
    const p = unitOf(provinces, id);
    emit(street, undefined, undefined, p);
    if (!p) return;
    setDistricts(await getDistricts(id).catch(() => []));
    void zoomToArea(p.name, 11);
  };

  const onDistrict = async (id: string) => {
    setDistrictId(id);
    setWardId("");
    setWards([]);
    const p = unitOf(provinces, provinceId);
    const d = unitOf(districts, id);
    emit(street, undefined, d, p);
    if (!d || !p) return;
    setWards(await getWards(id).catch(() => []));
    void zoomToArea(`${d.name}, ${p.name}`, 13);
  };

  const onWard = (id: string) => {
    setWardId(id);
    const p = unitOf(provinces, provinceId);
    const d = unitOf(districts, districtId);
    const w = unitOf(wards, id);
    emit(street, w, d, p);
    if (w && d && p) void zoomToArea(`${w.name}, ${d.name}, ${p.name}`, 15);
  };

  const onStreet = (next: string) => {
    setStreet(next);
    emit(next, unitOf(wards, wardId), unitOf(districts, districtId), unitOf(provinces, provinceId));
  };

  // Map -> dropdowns: reverse geocode the point and match each level by name
  const onPick = async (point: LatLng) => {
    setPin(point);
    setBusy(true);
    try {
      const found = await reverseGeocode(point.lat, point.lng);
      if (!found) return;
      const provinceList = provinces.length ? provinces : await getProvinces();
      const pId = findBestMatch(provinceList, found.province);
      const districtList = pId ? await getDistricts(pId) : [];
      const dId = findBestMatch(districtList, found.district);
      const wardList = dId ? await getWards(dId) : [];
      const wId = findBestMatch(wardList, found.ward);
      const nextStreet = found.street || street;

      setProvinces(provinceList);
      setDistricts(districtList);
      setWards(wardList);
      setProvinceId(pId);
      setDistrictId(dId);
      setWardId(wId);
      setStreet(nextStreet);
      emit(nextStreet, unitOf(wardList, wId), unitOf(districtList, dId), unitOf(provinceList, pId));
    } catch {
      // Keep the pin; the buyer can still pick the area by hand
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2.5 rounded-xl border border-line bg-cream/60 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink">{label}</p>
          {busy && (
            <span className="flex items-center gap-1.5 text-xs text-primary">
              <Loader2 size={12} className="animate-spin" /> Đang xác định địa chỉ...
            </span>
          )}
        </div>
        <SearchSelect
          label="Tỉnh/Thành"
          placeholder="Chọn hoặc gõ tên Tỉnh/Thành"
          options={toOptions(provinces)}
          value={provinceId}
          onChange={onProvince}
        />
        <SearchSelect
          label="Quận/Huyện"
          placeholder="Chọn hoặc gõ tên Quận/Huyện"
          options={toOptions(districts)}
          value={districtId}
          onChange={onDistrict}
          disabled={!provinceId}
        />
        <SearchSelect
          label="Phường/Xã"
          placeholder="Chọn hoặc gõ tên Phường/Xã"
          options={toOptions(wards)}
          value={wardId}
          onChange={onWard}
          disabled={!districtId}
        />
        {loadError && <p className="text-xs text-primary">{loadError}</p>}
      </div>

      <div>
        <label htmlFor="address-street" className="mb-1 block text-sm font-medium text-ink">
          {streetLabel}
        </label>
        <input
          id="address-street"
          value={street}
          onChange={(e) => onStreet(e.target.value)}
          placeholder={streetPlaceholder}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-lg border bg-white/70 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-ink-muted focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 ${
            error ? "border-primary" : "border-line"
          }`}
        />
        {error && <p className="mt-1 text-xs text-primary">{error}</p>}
      </div>

      {vietmapEnabled && (
        <div>
          <p className="mb-1 text-sm font-medium text-ink">Vị trí trên bản đồ</p>
          <LazyVietMap pin={pin} onPick={onPick} zoomTo={zoomTo} />
          <p className="mt-1 text-[11px] text-ink-muted">Chạm vào bản đồ để chọn vị trí, khu vực và địa chỉ sẽ tự điền.</p>
        </div>
      )}

      {value && (
        <p className="text-xs text-ink-muted">
          Sẽ lưu: <span className="text-ink-soft">{value}</span>
        </p>
      )}
    </div>
  );
}
