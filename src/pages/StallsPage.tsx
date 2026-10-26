import { useEffect, useRef, useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { StallsMap } from "@/components/address/StallsMap";
import { useSearchParams } from "react-router-dom";
import { FormAlert } from "@/components/auth/FormField";
import { Container } from "@/components/layout/Container";
import { StallCard } from "@/components/stalls/StallCard";
import { Pager } from "@/components/ui/Pager";
import { STALL_STATUS_LABEL } from "@/lib/labels";
import { organizerApi, type StallStatus } from "@/lib/organizerApi";
import { useAsync } from "@/lib/useAsync";

const PAGE_SIZE = 8;

export function StallsPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const status = (params.get("status") ?? "") as StallStatus | "";
  const page = Number(params.get("page") ?? 1) || 1;

  const { data, loading, error } = useAsync(
    () => organizerApi.listStalls({ search, status: status || undefined, page, pageSize: PAGE_SIZE }),
    [search, status, page],
  );
  // Every stall matching the filters, for the map (same sort as the list, so the page of a stall can be worked out)
  const { data: all } = useAsync(
    () => organizerApi.listStalls({ search, status: status || undefined, page: 1, pageSize: 100 }),
    [search, status],
  );
  const [flashId, setFlashId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries({ page: "1", ...changes })) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  };

  // Map click: go to the page that lists the stall, then bring its card into view and flash it
  const onSelectStall = (id: string) => {
    const index = all?.items.findIndex((s) => s.id === id) ?? -1;
    if (index < 0) return;
    const target = Math.floor(index / PAGE_SIZE) + 1;
    setFlashId(null);
    window.setTimeout(() => setFlashId(id), 0);
    if (target !== page) update({ page: String(target) });
  };

  useEffect(() => {
    if (!flashId || !data?.items.some((s) => s.id === flashId)) return;
    // Always the same stop: the top of the list, just under the sticky header
    const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
    const top = (listRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - headerHeight - 16;
    window.scrollTo({ top, behavior: "smooth" });
    const timer = window.setTimeout(() => setFlashId(null), 2000);
    return () => window.clearTimeout(timer);
  }, [flashId, data]);

  return (
    <Container className="py-8">
      <h1 className="font-serif text-2xl font-black text-primary-dark">Gian hàng</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onSearch={(q) => update({ q })} placeholder="Tìm theo mã, tên hoặc vị trí" className="w-full max-w-xl" />
        <select
          value={status}
          onChange={(e) => update({ status: e.target.value })}
          aria-label="Lọc theo trạng thái"
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="">Tất cả trạng thái</option>
          {(Object.keys(STALL_STATUS_LABEL) as StallStatus[]).map((s) => (
            <option key={s} value={s}>
              {STALL_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {error && <FormAlert type="error">{error}</FormAlert>}
        {loading && !data && <p className="text-sm text-ink-muted">Đang tải...</p>}
        {data && data.items.length === 0 && (
          <p className="rounded-xl border border-dashed border-line px-6 py-12 text-center text-sm text-ink-muted">
            Chưa có gian hàng nào phù hợp.
          </p>
        )}
        {!!all?.items.length && (
          <div className="mb-6">
            <StallsMap stalls={all.items} linkToStall={false} onSelect={onSelectStall} />
          </div>
        )}
        <div ref={listRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data?.items.map((s) => (
            <div key={s.id} data-stall-id={s.id} className={`h-full rounded-xl ${flashId === s.id ? "mc-flash" : ""}`}>
              <StallCard stall={s} />
            </div>
          ))}
        </div>
        {data && (
          <Pager page={data.currentPage} totalPages={data.totalPages} onChange={(n) => update({ page: String(n) })} />
        )}
      </div>
    </Container>
  );
}
