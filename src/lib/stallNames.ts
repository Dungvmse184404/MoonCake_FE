import { organizerApi, type Stall } from "./organizerApi";

// Stall ids in cart, product and order responses carry no names, so look them up once and reuse the result.
let cached: Promise<Record<string, Stall>> | null = null;

export function loadStalls(): Promise<Record<string, Stall>> {
  cached ??= organizerApi
    .listStalls({ pageSize: 100 })
    .then((page) => Object.fromEntries(page.items.map((s) => [s.id, s])))
    .catch(() => {
      cached = null;
      return {};
    });
  return cached;
}

export async function loadStallNames(): Promise<Record<string, string>> {
  const stalls = await loadStalls();
  return Object.fromEntries(Object.values(stalls).map((s) => [s.id, `${s.code} · ${s.name}`]));
}
