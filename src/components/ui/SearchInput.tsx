import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

interface Props {
  value: string;
  // Called with the trimmed text once typing pauses
  onSearch: (value: string) => void;
  placeholder: string;
  className?: string;
  delay?: number;
  ariaLabel?: string;
}

// Search box that searches while typing (debounced); no submit button needed.
export function SearchInput({ value, onSearch, placeholder, className = "", delay = 350, ariaLabel }: Props) {
  const [draft, setDraft] = useState(value);
  const lastSent = useRef(value);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  // Follow outside changes (back/forward, links that set ?q=) without clobbering what is being typed
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value;
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    const next = draft.trim();
    if (next === lastSent.current) return;
    const timer = window.setTimeout(() => {
      lastSent.current = next;
      onSearchRef.current(next);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [draft, delay]);

  const clear = () => {
    setDraft("");
    lastSent.current = "";
    onSearchRef.current("");
  };

  return (
    <div className={`relative flex items-center rounded-lg border border-line bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 ${className}`}>
      <Search size={16} className="pointer-events-none absolute left-3 text-ink-muted" />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          // Enter searches at once instead of waiting for the pause
          if (e.key === "Enter") {
            const next = draft.trim();
            lastSent.current = next;
            onSearchRef.current(next);
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="min-w-0 flex-1 bg-transparent py-2 pl-9 pr-8 text-sm outline-none placeholder:text-ink-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button type="button" onClick={clear} aria-label="Xóa tìm kiếm" className="absolute right-2 grid size-6 place-items-center rounded text-ink-muted hover:text-primary">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
