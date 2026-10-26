import { normalizeVietnamese } from "./vietmap";

// Vietnamese administrative units (province > district > ward) from the public provinces.open-api.vn API.
// The backend stores addresses as plain text, so only names are needed; codes are just for the dropdowns.
const BASE = "https://provinces.open-api.vn/api/v1";

export interface AdminUnit {
  id: string;
  name: string;
  divisionType: string;
}

interface RawUnit {
  code: number;
  name: string;
  division_type: string;
  districts?: RawUnit[];
  wards?: RawUnit[];
}

const toUnit = (u: RawUnit): AdminUnit => ({ id: String(u.code), name: u.name, divisionType: u.division_type });

let provinceCache: Promise<AdminUnit[]> | null = null;
const districtCache = new Map<string, Promise<AdminUnit[]>>();
const wardCache = new Map<string, Promise<AdminUnit[]>>();

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Administrative units request failed (${res.status})`);
  return (await res.json()) as T;
}

export function getProvinces(): Promise<AdminUnit[]> {
  provinceCache ??= fetchJson<RawUnit[]>(`${BASE}/p/`)
    .then((list) => list.map(toUnit))
    .catch((e) => {
      provinceCache = null;
      throw e;
    });
  return provinceCache;
}

export function getDistricts(provinceId: string): Promise<AdminUnit[]> {
  let request = districtCache.get(provinceId);
  if (!request) {
    request = fetchJson<RawUnit>(`${BASE}/p/${provinceId}?depth=2`)
      .then((p) => (p.districts ?? []).map(toUnit))
      .catch((e) => {
        districtCache.delete(provinceId);
        throw e;
      });
    districtCache.set(provinceId, request);
  }
  return request;
}

export function getWards(districtId: string): Promise<AdminUnit[]> {
  let request = wardCache.get(districtId);
  if (!request) {
    request = fetchJson<RawUnit>(`${BASE}/d/${districtId}?depth=2`)
      .then((d) => (d.wards ?? []).map(toUnit))
      .catch((e) => {
        wardCache.delete(districtId);
        throw e;
      });
    wardCache.set(districtId, request);
  }
  return request;
}

// "Xã Vĩnh Nhuận" (xã) -> "x.Vĩnh Nhuận"; the address string is "street, x.Ward, h.District, t.Province"
const SHORT_PREFIX: Record<string, string> = {
  "tỉnh": "t.",
  "thành phố trung ương": "tp.",
  "thành phố": "tp.",
  "quận": "q.",
  "huyện": "h.",
  "thị xã": "tx.",
  "phường": "p.",
  "xã": "x.",
  "thị trấn": "tt.",
};

const LONG_PREFIXES = ["thành phố", "thị trấn", "thị xã", "tỉnh", "quận", "huyện", "phường", "xã"];

export function bareName(unit: AdminUnit): string {
  const lower = unit.name.toLowerCase();
  for (const prefix of LONG_PREFIXES) {
    if (lower.startsWith(`${prefix} `)) return unit.name.slice(prefix.length + 1).trim();
  }
  return unit.name;
}

export function shortName(unit: AdminUnit): string {
  return `${SHORT_PREFIX[unit.divisionType] ?? ""}${bareName(unit)}`;
}

export function formatAddress(street: string, ward?: AdminUnit, district?: AdminUnit, province?: AdminUnit): string {
  return [street.trim(), ward && shortName(ward), district && shortName(district), province && shortName(province)]
    .filter(Boolean)
    .join(", ");
}

const SHORT_PATTERN = /^(tp|tt|tx|t|q|h|p|x)\.\s*(.+)$/i;

// Splits a stored address back into the street and the three unit names (without prefixes).
// Text that does not follow the format is returned as the street only.
export function parseAddress(value: string): { street: string; ward: string; district: string; province: string } {
  const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
  const tail = parts.slice(-3);
  if (parts.length >= 3 && tail.every((p) => SHORT_PATTERN.test(p))) {
    const [ward, district, province] = tail.map((p) => p.match(SHORT_PATTERN)![2].trim());
    return { street: parts.slice(0, -3).join(", "), ward, district, province };
  }
  return { street: value.trim(), ward: "", district: "", province: "" };
}

export function findUnit(units: AdminUnit[], name: string): AdminUnit | undefined {
  if (!name) return undefined;
  const target = normalizeVietnamese(name);
  return units.find((u) => normalizeVietnamese(bareName(u)) === target) ?? units.find((u) => normalizeVietnamese(u.name) === target);
}
