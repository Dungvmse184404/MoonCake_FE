import { SearchInput } from "@/components/ui/SearchInput";
import { useSearchParams } from "react-router-dom";
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
  // Set from a product page ("more from this shop"); the name only labels the filter
  const organizerId = params.get("organizerId") ?? "";
  const brand = params.get("brand") ?? "";

  const { data: categories } = useAsync(() => catalogApi.listCategories(), []);
  const { data, loading, error } = useAsync(
    () => catalogApi.listProducts({ categoryId: category || undefined, organizerId: organizerId || undefined, search, page }),
    [category, organizerId, search, page],
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
      <h1 className="font-serif text-2xl font-black text-primary-dark">{organizerId && brand ? `Sản phẩm của ${brand}` : "Sản phẩm"}</h1>
      {organizerId && (
        <button onClick={() => update({ organizerId: "", brand: "" })} className="mt-1 text-sm font-semibold text-primary hover:underline">
          Xem sản phẩm của mọi gian hàng
        </button>
      )}

      <SearchInput value={search} onSearch={(q) => update({ q })} placeholder="Tìm theo tên bánh hoặc gian hàng" className="mt-4 max-w-xl" />

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
