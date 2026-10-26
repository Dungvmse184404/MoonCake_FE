import { useState } from "react";

interface Option {
  id: string;
  name: string;
}

interface Props {
  label: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
}

const chipClass = (selected: boolean) =>
  `rounded-full border px-2.5 py-1 text-xs transition-colors ${
    selected ? "border-primary bg-primary/10 font-medium text-primary" : "border-line text-ink-soft hover:border-primary/60 hover:text-primary"
  }`;

// Single-choice chips that stay folded to the picked one and open on hover (FengDesk's "Hiện trạng không gian"
// drawer). Tap or keyboard focus opens it too, for touch screens.
export function ChipDrawer({ label, options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const picked = options.find((o) => o.id === value);
  const single = options.length <= 1;
  const expanded = open && !single;

  return (
    <div
      className="min-w-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>

      {/* Full list, opened smoothly with the grid-rows trick */}
      <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5 pb-0.5">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={o.id === value}
                tabIndex={expanded ? 0 : -1}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className={chipClass(o.id === value)}
              >
                {o.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary, shown while folded */}
      <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: expanded ? "0fr" : "1fr" }}>
        <div className="overflow-hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            disabled={single}
            aria-label={`${label}: ${picked?.name ?? "chưa chọn"}`}
            className="disabled:cursor-default"
          >
            {picked ? (
              <span className={chipClass(true)}>{picked.name}</span>
            ) : (
              <span className="text-xs italic text-primary">Di chuột vào để chọn...</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
