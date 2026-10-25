import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
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
  const [draft, setDraft] = useState(search);

  const { data, loading, error } = useAsync(
    () => organizerApi.listStalls({ search, status: status || undefined, page, pageSize: PAGE_SIZE }),
    [search, status, page],
  );

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries({ page: "1", ...changes })) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  };

  return (
    <Container className="py-8">
      <h1 className="font-serif text-2xl font-black text-primary-dark">Gian hàng</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: draft.trim() });
          }}
          className="flex w-full max-w-xl overflow-hidden rounded-lg border border-line bg-white"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Tìm theo mã, tên hoặc vị trí"
            className="min-w-0 flex-1 px-4 py-2.5 text-sm outline-none placeholder:text-ink-muted"
          />
          <button type="submit" className="bg-primary px-4 text-white hover:bg-primary-dark" aria-label="Tìm kiếm">
            <Search size={18} />
          </button>
        </form>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data?.items.map((s) => (
            <StallCard key={s.id} stall={s} />
          ))}
        </div>
        {data && (
          <Pager page={data.currentPage} totalPages={data.totalPages} onChange={(n) => update({ page: String(n) })} />
        )}
      </div>
    </Container>
  );
}
