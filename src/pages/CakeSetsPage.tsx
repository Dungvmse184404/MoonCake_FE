import { Link } from "react-router-dom";
import { Moon } from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Container } from "@/components/layout/Container";
import { catalogApi } from "@/lib/catalog";
import { useAsync } from "@/lib/useAsync";

// Curated entry to the catalogue: browse by category, then the newest products. Combo boxes need backend support first.
export function CakeSetsPage() {
  const { data: categories } = useAsync(() => catalogApi.listCategories(), []);
  const { data: products } = useAsync(() => catalogApi.listFeaturedProducts(8), []);

  return (
    <Container className="py-8">
      <h1 className="font-serif text-2xl font-black text-primary-dark">Bánh và hộp bánh Trung thu</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Chọn theo loại bánh bạn thích, hoặc xem những sản phẩm mới nhất từ các gian hàng.
      </p>

      {!!categories?.length && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/products?categoryId=${c.id}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-line bg-white p-4 text-sm font-medium text-ink-soft transition hover:border-primary hover:text-primary"
            >
              <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
                <Moon size={22} />
              </span>
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {!!products?.length && (
        <section className="mt-10" aria-labelledby="new-products-title">
          <div className="flex items-end justify-between">
            <h2 id="new-products-title" className="font-serif text-xl font-black text-primary-dark">
              Sản phẩm mới
            </h2>
            <Link to="/products" className="text-sm font-semibold text-primary hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {!categories?.length && !products?.length && (
        <p className="mt-8 rounded-xl border border-dashed border-line px-6 py-12 text-center text-sm text-ink-muted">
          Chưa có sản phẩm nào. Hãy quay lại sau nhé.
        </p>
      )}
    </Container>
  );
}
