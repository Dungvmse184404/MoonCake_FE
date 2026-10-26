import { useState } from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Check, MapPin } from "lucide-react";
import { Pager } from "@/components/ui/Pager";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatVnd, STALL_STATUS_LABEL } from "@/lib/labels";
import { organizerApi, type StallStatus } from "@/lib/organizerApi";
import { useAsync } from "@/lib/useAsync";

interface Props {
  selected: string[];
  /** Called with the clicked stall id; the parent decides between single and multiple selection */
  onToggle: (stallId: string) => void;
  label?: string;
  error?: string;
}

const PAGE_SIZE = 6;

// A rented stall can still be booked for a later period (the backend rejects overlapping dates), so every stall is listed.
export function StallPicker({ selected, onToggle, label = "Chọn gian hàng muốn thuê", error }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StallStatus | "">("");
  const [page, setPage] = useState(1);

  const { data, loading, error: loadError } = useAsync(
    () => organizerApi.listStalls({ search: query, status: status || undefined, page, pageSize: PAGE_SIZE }),
    [query, status, page],
  );

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-ink">{label}</p>

      <div className="mb-3 flex flex-wrap gap-2">
        <SearchInput
          value={query}
          onSearch={(q) => {
            setPage(1);
            setQuery(q);
          }}
          placeholder="Tìm theo mã, tên hoặc vị trí"
          className="min-w-0 flex-1"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StallStatus | "");
            setPage(1);
          }}
          aria-label="Lọc theo trạng thái"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">Tất cả gian hàng</option>
          {(Object.keys(STALL_STATUS_LABEL) as StallStatus[]).map((s) => (
            <option key={s} value={s}>
              {STALL_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {loadError && <p className="text-sm text-primary">{loadError}</p>}
      {loading && !data && <p className="text-sm text-ink-muted">Đang tải danh sách gian hàng...</p>}

      {data && data.items.length === 0 && (
        <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">
          Không có gian hàng phù hợp.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {data?.items.map((stall) => {
          const isSelected = selected.includes(stall.id);
          return (
            <button
              type="button"
              key={stall.id}
              onClick={() => onToggle(stall.id)}
              aria-pressed={isSelected}
              className={`relative rounded-xl border p-4 text-left transition ${
                isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-line bg-white hover:border-primary/50"
              }`}
            >
              {isSelected && (
                <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-primary text-white">
                  <Check size={12} />
                </span>
              )}
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-primary">{stall.code}</p>
                <StatusBadge tone={stall.status === "Available" ? "success" : "info"}>{STALL_STATUS_LABEL[stall.status]}</StatusBadge>
              </div>
              <p className="mt-0.5 font-semibold text-ink">{stall.name}</p>
              {stall.location && (
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                  <MapPin size={12} /> {stall.location}
                </p>
              )}
              <p className="mt-3 text-xs text-ink-soft">Giá thuê: {formatVnd(stall.rentalPrice)}</p>
            </button>
          );
        })}
      </div>

      {data && <Pager page={data.currentPage} totalPages={data.totalPages} onChange={setPage} />}
      {error && <p className="mt-2 text-xs text-primary">{error}</p>}
    </div>
  );
}
