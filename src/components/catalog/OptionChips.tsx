interface Props {
  label: string;
  value: string;
  options: Array<{ id: string; name: string }>;
  onChange: (id: string) => void;
}

// Single choice shown as chips (category, filling or stall of an item).
export function OptionChips({ label, value, options, onChange }: Props) {
  return (
    <div>
      <p className="mb-1.5 text-sm text-ink-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              value === o.id
                ? "border-primary bg-primary text-white"
                : "border-line bg-white text-ink-soft hover:border-primary hover:text-primary"
            }`}
          >
            {o.name}
          </button>
        ))}
      </div>
    </div>
  );
}
