// VietMap geocoding (https://maps.vietmap.vn), ported from FengDesk. Results are cached in memory and
// sessionStorage because the API key has a daily quota.

const VIETMAP_BASE = "https://maps.vietmap.vn/api";
const API_KEY = import.meta.env.VITE_VIETMAP_API_KEY as string | undefined;
export const TILEMAP_KEY = import.meta.env.VITE_VIETMAP_TILEMAP_KEY as string | undefined;
export const vietmapEnabled = Boolean(API_KEY && TILEMAP_KEY);

const CACHE_PREFIX = "vm-cache:";
const memoryCache = new Map<string, unknown>();

function cacheGet<T>(key: string): T | undefined {
  if (memoryCache.has(key)) return memoryCache.get(key) as T;
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (raw !== null) {
      const value = JSON.parse(raw) as T;
      memoryCache.set(key, value);
      return value;
    }
  } catch {
    // sessionStorage unavailable: memory only
  }
  return undefined;
}

function cacheSet(key: string, value: unknown) {
  memoryCache.set(key, value);
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full: ignore
  }
}

const ADMINISTRATIVE_PREFIXES = ["tinh ", "thanh pho ", "tp ", "quan ", "huyen ", "phuong ", "xa ", "thi tran ", "thi xa "];

export function normalizeVietnamese(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\./g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeWithoutPrefix(value: string): string {
  const normalized = normalizeVietnamese(value);
  for (const prefix of ADMINISTRATIVE_PREFIXES) {
    if (normalized.startsWith(prefix)) return normalized.slice(prefix.length).trim();
  }
  return normalized;
}

// boundaries[].type: 0 = province, 1 = district, 2 = ward
interface VietMapBoundary {
  type: 0 | 1 | 2;
  id: number;
  name: string;
  prefix: string;
  full_name: string;
}

export interface VietMapSearchResult {
  ref_id: string;
  address: string;
  name: string;
  display: string;
  boundaries: VietMapBoundary[];
}

interface VietMapPlace {
  lat: number;
  lng: number;
  display: string;
  name: string;
}

export interface ReverseGeocodeResult {
  province: string;
  district: string;
  ward: string;
  street: string;
}

function boundaryByType(boundaries: VietMapBoundary[] | undefined, type: 0 | 1 | 2): string {
  const boundary = boundaries?.find((b) => b.type === type);
  if (!boundary) return "";
  return boundary.full_name || `${boundary.prefix ?? ""} ${boundary.name ?? ""}`.trim();
}

// The nearest result may miss a level; take it from a later result whose higher levels agree
function pickBoundary(results: VietMapSearchResult[], type: 0 | 1 | 2, higher: Array<{ type: 0 | 1; value: string }>): string {
  for (const result of results) {
    const value = boundaryByType(result.boundaries, type);
    if (!value) continue;
    const consistent = higher.every(
      (level) => !level.value || normalizeVietnamese(boundaryByType(result.boundaries, level.type)) === normalizeVietnamese(level.value),
    );
    if (consistent) return value;
  }
  return "";
}

async function getJson<T>(url: string): Promise<T | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function vietmapAutocomplete(query: string, focus?: { lat: number; lng: number }): Promise<VietMapSearchResult[]> {
  let url = `${VIETMAP_BASE}/autocomplete/v3?apikey=${API_KEY}&text=${encodeURIComponent(query)}`;
  if (focus) url += `&focus=${focus.lat},${focus.lng}`;
  const data = await getJson<VietMapSearchResult[]>(url);
  return Array.isArray(data) ? data : [];
}

async function vietmapSearch(query: string): Promise<VietMapSearchResult[]> {
  const data = await getJson<VietMapSearchResult[]>(`${VIETMAP_BASE}/search/v3?apikey=${API_KEY}&text=${encodeURIComponent(query)}`);
  return Array.isArray(data) ? data : [];
}

async function vietmapPlace(refId: string): Promise<VietMapPlace | null> {
  const key = `place:${refId}`;
  const cached = cacheGet<VietMapPlace>(key);
  if (cached !== undefined) return cached;
  const data = await getJson<VietMapPlace>(`${VIETMAP_BASE}/place/v3?apikey=${API_KEY}&refid=${encodeURIComponent(refId)}`);
  if (data) cacheSet(key, data);
  return data;
}

export async function getPlaceCoordinates(refId: string): Promise<{ lat: number; lng: number } | null> {
  const place = await vietmapPlace(refId);
  return place ? { lat: place.lat, lng: place.lng } : null;
}

// Text to coordinates; failures are not cached so a later call can retry
export async function geocodeLocation(query: string): Promise<{ lat: number; lng: number } | null> {
  const key = `geo:${query}`;
  const cached = cacheGet<{ lat: number; lng: number } | null>(key);
  if (cached !== undefined) return cached;

  const results = await vietmapSearch(query);
  if (!results.length) return null;
  const place = await vietmapPlace(results[0].ref_id);
  if (!place) return null;

  const coords = { lat: place.lat, lng: place.lng };
  cacheSet(key, coords);
  return coords;
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const key = `rev:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = cacheGet<ReverseGeocodeResult>(key);
  if (cached !== undefined) return cached;

  const data = await getJson<VietMapSearchResult[]>(`${VIETMAP_BASE}/reverse/v3?apikey=${API_KEY}&lat=${lat}&lng=${lng}`);
  if (!Array.isArray(data) || !data.length) return null;

  const province = pickBoundary(data, 0, []);
  const district = pickBoundary(data, 1, [{ type: 0, value: province }]);
  const ward = pickBoundary(data, 2, [
    { type: 0, value: province },
    { type: 1, value: district },
  ]);
  if (!province && !district && !ward) return null;

  const street = data.find((r) => r.name?.trim())?.name?.trim() ?? "";
  const result = { province, district, ward, street };
  cacheSet(key, result);
  return result;
}

// Best match by name: exact, then without the administrative prefix, then partial (never for numbered units)
export function findBestMatch<T extends { id: string; name: string }>(items: T[], target: string): string {
  if (!target || !items.length) return "";

  const normalizedTarget = normalizeVietnamese(target);
  const exact = items.find((item) => normalizeVietnamese(item.name) === normalizedTarget);
  if (exact) return exact.id;

  const strippedTarget = normalizeWithoutPrefix(target);
  const stripped = items.find((item) => normalizeWithoutPrefix(item.name) === strippedTarget);
  if (stripped) return stripped.id;

  const isNumeric = (value: string) => /^\d+$/.test(value);
  if (isNumeric(strippedTarget)) return "";

  const included = items.find((item) => {
    const name = normalizeWithoutPrefix(item.name);
    if (!name || isNumeric(name)) return false;
    return name.includes(strippedTarget) || strippedTarget.includes(name);
  });
  return included?.id ?? "";
}

// Geocodes a stored address; long street parts (stall lots, landmarks) are dropped step by step until a match
export async function geocodeAddress(text: string): Promise<{ lat: number; lng: number } | null> {
  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  const attempts = [parts, parts.slice(-4), parts.slice(-3)].map((p) => p.join(", "));
  for (const query of [...new Set(attempts)]) {
    if (!query) continue;
    const point = await geocodeLocation(`${query}, Việt Nam`);
    if (point) return point;
  }
  return null;
}
