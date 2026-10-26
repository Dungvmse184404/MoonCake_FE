import { useAsync } from "@/lib/useAsync";
import { organizerApi } from "@/lib/organizerApi";

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
}

// Stalls the organizer currently rents (Active contracts); items are sold only in the ticked stalls.
export function StallCheckboxes({ selected, onChange }: Props) {
  const { data, loading } = useAsync(() => organizerApi.myRentals({ status: "Active", pageSize: 50 }), []);
  const stalls = data?.items ?? [];

  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-ink">Bán tại gian hàng</legend>
      {loading && !data && <p className="text-sm text-ink-muted">Đang tải...</p>}
      {data && stalls.length === 0 && (
        <p className="text-sm text-ink-muted">Bạn chưa thuê gian hàng nào đang hoạt động, sản phẩm chỉ bán online.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {stalls.map((r) => (
          <label
            key={r.stallId}
            className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              selected.includes(r.stallId)
                ? "border-primary bg-primary text-white"
                : "border-line bg-white text-ink-soft hover:border-primary hover:text-primary"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(r.stallId)}
              onChange={() => toggle(r.stallId)}
              className="sr-only"
            />
            {r.stallCode} · {r.stallName}
          </label>
        ))}
      </div>
      {stalls.length > 0 && <p className="mt-1.5 text-xs text-ink-muted">Không chọn gian nào thì chỉ bán online.</p>}
    </fieldset>
  );
}
