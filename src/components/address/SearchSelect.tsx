import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { normalizeVietnamese } from "@/lib/vietmap";

export interface SearchOption {
  id: string;
  name: string;
  // Name without the administrative prefix ("An Giang" for "Tỉnh An Giang"); matched first
  shortName?: string;
}

interface Props {
  label: string;
  placeholder: string;
  options: SearchOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

const MAX_RESULTS = 50;

// Fuzzy score of an option for the typed text (accents and case ignored); 0 = no match
function scoreOf(option: SearchOption, query: string): number {
  const full = normalizeVietnamese(option.name);
  const short = normalizeVietnamese(option.shortName ?? option.name);
  if (short === query || full === query) return 1000;
  if (short.startsWith(query)) return 900 - short.length;
  if (full.startsWith(query)) return 800 - full.length;
  if (short.split(" ").some((w) => w.startsWith(query))) return 700 - short.length;
  if (short.includes(query) || full.includes(query)) return 600 - short.length;

  // Letters in order with gaps ("vnhuan" -> "vinh nhuan"); fewer gaps scores higher
  let pos = -1;
  let gaps = 0;
  for (const ch of query.replace(/ /g, "")) {
    const next = short.indexOf(ch, pos + 1);
    if (next === -1) return 0;
    if (pos !== -1) gaps += next - pos - 1;
    pos = next;
  }
  return Math.max(1, 400 - gaps * 10 - short.length);
}

// Text still missing from the best match when the typed text is its beginning (IntelliSense-style hint)
function completionOf(option: SearchOption | undefined, typed: string): string {
  if (!option || !typed) return "";
  const query = normalizeVietnamese(typed);
  for (const name of [option.shortName ?? option.name, option.name]) {
    if (normalizeVietnamese(name).startsWith(query) && name.length > typed.length) return name.slice(typed.length);
  }
  return "";
}

// Searchable dropdown: type to filter (no accents needed), Tab/Enter takes the highlighted match.
export function SearchSelect({ label, placeholder, options, value, onChange, disabled = false }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = options.find((o) => o.id === value);

  const results = useMemo(() => {
    const q = normalizeVietnamese(query);
    if (!q) return options.slice(0, MAX_RESULTS);
    return options
      .map((o) => ({ o, score: scoreOf(o, q) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map((r) => r.o);
  }, [options, query]);

  const ghost = open ? completionOf(results[active], query) : "";

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  });

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const choose = (option: SearchOption | undefined) => {
    if (option && option.id !== value) onChange(option.id);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (results.length ? (i + step + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Tab") {
      // Tab accepts the suggestion like an editor, then moves on as usual
      if (open && query && results[active]) choose(results[active]);
    } else if (e.key === "Escape") {
      close();
    }
  };

  const inputClass =
    "w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 pr-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed";

  return (
    <div ref={rootRef} className="relative">
      <div className={`relative rounded-lg ${disabled ? "bg-cream-dark/40" : "bg-white"}`}>
        {/* Hint layer: the typed text (invisible) followed by the faded completion */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre px-3.5 py-2.5 text-sm">
          <span className="invisible">{query}</span>
          <span className="text-ink-muted/60">{ghost}</span>
        </div>
        <input
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="both"
          disabled={disabled}
          value={open ? query : (selected?.name ?? "")}
          placeholder={open && selected ? selected.name : placeholder}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className={`relative ${inputClass}`}
        />
        <ChevronDown
          size={16}
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-line bg-white py-1 shadow-lg"
        >
          {results.length === 0 && <li className="px-3.5 py-2 text-sm text-ink-muted">Không tìm thấy.</li>}
          {results.map((o, i) => (
            <li
              key={o.id}
              role="option"
              aria-selected={o.id === value}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => choose(o)}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3.5 py-2 text-sm ${i === active ? "bg-primary-soft text-primary-dark" : "text-ink-soft"} ${
                o.id === value ? "font-semibold" : ""
              }`}
            >
              {o.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
