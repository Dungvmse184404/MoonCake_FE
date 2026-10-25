import { useState } from "react";
import { Plus } from "lucide-react";

interface Option {
  id: string;
  name: string;
}

interface Props {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Creates a new option and returns it; when omitted the "add" box is hidden */
  onCreate?: (name: string) => Promise<Option>;
  error?: string;
}

// Multi-select as toggle chips, with an inline box to add an option that does not exist yet.
export function ChipSelect({ label, options, selected, onChange, onCreate, error }: Props) {
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const create = async () => {
    const name = draft.trim();
    if (!name || !onCreate) return;
    setCreating(true);
    setCreateError("");
    try {
      const created = await onCreate(name);
      onChange([...selected, created.id]);
      setDraft("");
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Không thể tạo mới.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-ink">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.length === 0 && <span className="text-sm text-ink-muted">Chưa có lựa chọn nào, hãy thêm mới bên dưới.</span>}
        {options.map((o) => {
          const active = selected.includes(o.id);
          return (
            <button
              type="button"
              key={o.id}
              aria-pressed={active}
              onClick={() => toggle(o.id)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                active ? "border-primary bg-primary text-white" : "border-line bg-white text-ink-soft hover:border-primary hover:text-primary"
              }`}
            >
              {o.name}
            </button>
          );
        })}
      </div>

      {onCreate && (
        <div className="mt-2 flex max-w-sm gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void create();
              }
            }}
            placeholder="Thêm mới..."
            aria-label={`Thêm ${label.toLowerCase()}`}
            className="min-w-0 flex-1 rounded-lg border border-line bg-white/70 px-3 py-1.5 text-sm outline-none placeholder:text-ink-muted focus:border-primary"
          />
          <button
            type="button"
            onClick={create}
            disabled={creating || !draft.trim()}
            aria-label="Thêm"
            className="grid size-9 place-items-center rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
      {(createError || error) && <p className="mt-1 text-xs text-primary">{createError || error}</p>}
    </div>
  );
}
