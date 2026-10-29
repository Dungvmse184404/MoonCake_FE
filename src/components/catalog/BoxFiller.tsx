import { Minus, Plus, Trash2 } from "lucide-react";
import { ChipDrawer } from "@/components/catalog/ChipDrawer";
import { CakeImage } from "@/components/ui/CakeImage";
import type { BoxProduct } from "@/lib/boxApi";
import type { BoxSelectionPayload } from "@/lib/cartApi";

// One cake choice inside a box; the same product may appear on several rows with different fillings.
export interface BoxRow {
  productId: string;
  categoryId: string;
  fillingId: string;
  quantity: number;
}

interface Props {
  products: BoxProduct[];
  capacity: number;
  rows: BoxRow[];
  onChange: (rows: BoxRow[]) => void;
}

const filledOf = (rows: BoxRow[]) => rows.reduce((n, r) => n + r.quantity, 0);

export const isBoxComplete = (rows: BoxRow[], capacity: number) =>
  filledOf(rows) === capacity && rows.every((r) => r.categoryId && r.fillingId);

// Rows with the same product, category and filling become one selection for the API.
export function boxSelections(rows: BoxRow[]): BoxSelectionPayload[] {
  const merged = new Map<string, BoxSelectionPayload>();
  for (const r of rows) {
    const key = `${r.productId}|${r.categoryId}|${r.fillingId}`;
    const existing = merged.get(key);
    if (existing) existing.quantity += r.quantity;
    else merged.set(key, { ...r });
  }
  return [...merged.values()];
}

export function boxDetail(rows: BoxRow[], products: BoxProduct[]): string {
  return boxSelections(rows)
    .map((s) => {
      const p = products.find((x) => x.id === s.productId);
      const filling = p?.fillings.find((f) => f.id === s.fillingId)?.name;
      return `${s.quantity} × ${p?.name ?? "Bánh"}${filling ? ` (${filling})` : ""}`;
    })
    .join(", ");
}

// Fills a combo box: one block per allowed cake, each with as many filling rows as the buyer wants
// ("+ nhân khác"), until the quantities add up to the box capacity.
export function BoxFiller({ products, capacity, rows, onChange }: Props) {
  const filled = filledOf(rows);
  const room = capacity - filled;
  const full = filled === capacity;

  const add = (p: BoxProduct) => {
    const used = new Set(rows.filter((r) => r.productId === p.id).map((r) => r.fillingId));
    const filling = p.fillings.find((f) => !used.has(f.id)) ?? p.fillings[0];
    onChange([...rows, { productId: p.id, categoryId: p.categories.length === 1 ? p.categories[0].id : "", fillingId: filling?.id ?? "", quantity: 1 }]);
  };
  const patch = (index: number, change: Partial<BoxRow>) => onChange(rows.map((r, i) => (i === index ? { ...r, ...change } : r)));
  const drop = (index: number) => onChange(rows.filter((_, i) => i !== index));

  return (
    <div className="rounded-xl border border-line bg-cream/60 p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-ink">Chọn bánh cho hộp</span>
        <span className={`font-semibold tabular-nums ${full ? "text-[#6b5416]" : "text-primary"}`} aria-live="polite">
          {filled}/{capacity} bánh
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white" aria-hidden="true">
        <div className={`h-full rounded-full transition-all ${full ? "bg-gold" : "bg-primary"}`} style={{ width: `${Math.min(100, (filled / capacity) * 100)}%` }} />
      </div>

      <ul className="space-y-2">
        {products.map((p) => {
          const mine = rows.map((r, index) => ({ r, index })).filter(({ r }) => r.productId === p.id);
          const usedFillings = new Set(mine.map(({ r }) => r.fillingId));
          const canAddFilling = p.fillings.some((f) => !usedFillings.has(f.id));
          return (
            <li key={p.id} className="rounded-lg bg-white p-2.5">
              <div className="flex items-center gap-2.5">
                <CakeImage src={p.imageUrl} alt="" kind="product" className="size-10 shrink-0 rounded-md" iconClassName="size-4" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{p.name}</span>
                {mine.length === 0 && (
                  <button
                    type="button"
                    onClick={() => add(p)}
                    disabled={room <= 0}
                    className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:border-primary hover:text-primary disabled:opacity-40"
                  >
                    <Plus size={12} /> Thêm
                  </button>
                )}
              </div>

              {mine.length > 0 && (
                <div className="mt-2 space-y-2 pl-12">
                  {mine.map(({ r, index }) => (
                    <div key={index} className="flex flex-wrap items-end gap-x-4 gap-y-2">
                      {p.categories.length > 1 && (
                        <ChipDrawer label="Loại bánh" options={p.categories} value={r.categoryId} onChange={(categoryId) => patch(index, { categoryId })} />
                      )}
                      <ChipDrawer
                        label="Nhân bánh"
                        options={p.fillings.filter((f) => f.id === r.fillingId || !usedFillings.has(f.id))}
                        value={r.fillingId}
                        onChange={(fillingId) => patch(index, { fillingId })}
                      />
                      <div className="ml-auto inline-flex items-center overflow-hidden rounded-lg border border-line text-sm">
                        <button
                          type="button"
                          onClick={() => (r.quantity <= 1 ? drop(index) : patch(index, { quantity: r.quantity - 1 }))}
                          aria-label={r.quantity <= 1 ? `Bỏ ${p.name}` : `Giảm ${p.name}`}
                          className="grid size-8 place-items-center hover:bg-cream"
                        >
                          {r.quantity <= 1 ? <Trash2 size={13} /> : <Minus size={14} />}
                        </button>
                        <span className="w-9 text-center font-semibold tabular-nums">{r.quantity}</span>
                        <button
                          type="button"
                          onClick={() => patch(index, { quantity: r.quantity + 1 })}
                          disabled={room <= 0}
                          aria-label={`Thêm ${p.name}`}
                          className="grid size-8 place-items-center hover:bg-cream disabled:opacity-40"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {canAddFilling && (
                    <button
                      type="button"
                      onClick={() => add(p)}
                      disabled={room <= 0}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                      <Plus size={12} /> Nhân khác
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {!full && <p className="mt-2 text-xs text-ink-muted">Còn thiếu {room} bánh để đủ hộp.</p>}
    </div>
  );
}
