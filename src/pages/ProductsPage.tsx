import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { FormAlert } from "@/components/auth/FormField";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Container } from "@/components/layout/Container";
import { Pager } from "@/components/ui/Pager";
import { catalogApi } from "@/lib/catalog";
import { useAsync } from "@/lib/useAsync";

export function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get("categoryId") ?? "";
  const search = params.get("q") ?? "";
  const page = Number(params.get("page") ?? 1) || 1;
  const [draft, setDraft] = useState(search);

  const { data: categories } = useAsync(() => catalogApi.listCategories(), []);
  const { data, loading, error } = useAsync(
    () => catalogApi.listProducts({ categoryId: category || undefined, search, page }),
    [category, search, page],
  );

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries({ page: "1", ...changes })) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  };

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-medium transition ${
      active ? "border-primary bg-primary text-white" : "border-line bg-white text-ink-soft hover:border-primary hover:text-primary"
    }`;

  return (
    <Container className="py-8">
      <h1 className="font-serif text-2xl font-black text-primary-dark">Sản phẩm</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: draft.trim() });
        }}
        className="mt-4 flex max-w-xl overflow-hidden rounded-lg border border-line bg-white"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Tìm theo tên bánh hoặc gian hàng"
          className="min-w-0 flex-1 px-4 py-2.5 text-sm outline-none placeholder:text-ink-muted"
        />
        <button type="submit" className="bg-primary px-4 text-white hover:bg-primary-dark" aria-label="Tìm kiếm">
          <Search size={18} />
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className={chip(!category)} onClick={() => update({ categoryId: "" })}>
          Tất cả
        </button>
        {categories?.map((c) => (
          <button key={c.id} className={chip(category === c.id)} onClick={() => update({ categoryId: c.id })}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {error && <FormAlert type="error">{error}</FormAlert>}
        {loading && !data && <p className="text-sm text-ink-muted">Đang tải...</p>}
        {data && data.items.length === 0 && (
          <p className="rounded-xl border border-dashed border-line px-6 py-12 text-center text-sm text-ink-muted">
            Không tìm thấy sản phẩm phù hợp.
          </p>
        )}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {data?.items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {data && (
          <Pager page={data.currentPage} totalPages={data.totalPages} onChange={(n) => update({ page: String(n) })} />
        )}
      </div>
    </Container>
  );
}
