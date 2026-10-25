import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Moon } from "lucide-react";
import { AmbientBackground } from "@/components/ambient/AmbientBackground";
import { ProductCard } from "@/components/catalog/ProductCard";
import { AboutSection } from "@/components/home/AboutSection";
import { FeatureTiles } from "@/components/home/FeatureTiles";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { PartnerSection } from "@/components/home/PartnerSection";
import { Container } from "@/components/layout/Container";
import { StallCard } from "@/components/stalls/StallCard";
import { catalogApi } from "@/lib/catalog";
import { organizerApi } from "@/lib/organizerApi";
import { useAsync } from "@/lib/useAsync";

function SectionHeader({ id, title, to }: { id: string; title: string; to: string }) {
  return (
    <div className="flex items-end justify-between">
      <h2 id={id} className="font-serif text-2xl font-black text-primary-dark">
        {title}
      </h2>
      <Link to={to} className="text-sm font-semibold text-primary hover:underline">
        Xem tất cả
      </Link>
    </div>
  );
}

// Sections without data (empty, loading or failed) are not rendered at all
export function HomePage() {
  const { hash } = useLocation();
  const { data: categories } = useAsync(() => catalogApi.listCategories(), []);
  const { data: featuredProducts } = useAsync(() => catalogApi.listFeaturedProducts(4), []);
  const { data: stalls } = useAsync(() => organizerApi.listStalls({ pageSize: 4 }), []);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  return (
    <div className="relative isolate">
      <AmbientBackground />
      <Container className="space-y-12 py-6">
        <HeroCarousel />
        <FeatureTiles />

        {!!categories?.length && (
          <section aria-labelledby="categories-title">
            <SectionHeader id="categories-title" title="Danh mục bánh" to="/products" />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
          </section>
        )}

        {!!stalls?.items.length && (
          <section id="stores" aria-labelledby="stores-title" className="scroll-mt-32">
            <SectionHeader id="stores-title" title="Gian hàng nổi bật" to="/stalls" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stalls.items.map((s) => (
                <StallCard key={s.id} stall={s} />
              ))}
            </div>
          </section>
        )}

        <PartnerSection />

        {!!featuredProducts?.length && (
          <section aria-labelledby="featured-title">
            <SectionHeader id="featured-title" title="Sản phẩm nổi bật" to="/products" />
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        <AboutSection />
      </Container>
    </div>
  );
}
