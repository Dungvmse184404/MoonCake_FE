import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pager({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  const btn =
    "grid size-9 place-items-center rounded-lg border border-line text-ink-soft transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-soft";
  return (
    <nav aria-label="Phân trang" className="mt-6 flex items-center justify-center gap-3 text-sm text-ink-soft">
      <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Trang trước">
        <ChevronLeft size={16} />
      </button>
      <span>
        Trang {page}/{totalPages}
      </span>
      <button className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Trang sau">
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
