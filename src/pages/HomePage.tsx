import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Moon, Star } from "lucide-react";
import { AmbientBackground } from "@/components/ambient/AmbientBackground";
import { Container } from "@/components/layout/Container";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { FeatureTiles } from "@/components/home/FeatureTiles";
import { categories, featuredProducts, featuredStores, formatVnd } from "@/data/mock";

export function HomePage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  return (
    <div className="relative isolate">
      <AmbientBackground />
      <Container className="space-y-12 py-6">
        <HeroCarousel />
        <FeatureTiles />

        <section aria-labelledby="cat-title">
          <h2 id="cat-title" className="font-serif text-2xl font-black text-primary-dark">
            Danh mục bánh
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c.id}
                to="/san-pham"
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

        <section id="gian-hang" aria-labelledby="store-title" className="scroll-mt-32">
          <h2 id="store-title" className="font-serif text-2xl font-black text-primary-dark">
            Gian hàng nổi bật
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredStores.map((s) => (
              <Link
                key={s.id}
                to="/san-pham"
                className="rounded-xl border border-line bg-white p-5 transition hover:shadow-md"
              >
                <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-dark font-serif text-xl font-black text-primary-soft">
                  {s.name[0]}
                </div>
                <h3 className="mt-3 font-semibold text-ink">{s.name}</h3>
                <p className="text-xs text-ink-muted">{s.location}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-ink-soft">
                  <span className="flex items-center gap-1">
                    <Star size={13} className="fill-gold text-gold" /> {s.rating}
                  </span>
                  <span>{s.products} sản phẩm</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="prod-title">
          <div className="flex items-end justify-between">
            <h2 id="prod-title" className="font-serif text-2xl font-black text-primary-dark">
              Sản phẩm nổi bật
            </h2>
            <Link to="/san-pham" className="text-sm font-semibold text-primary hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featuredProducts.map((p) => (
              <Link
                key={p.id}
                to="/san-pham"
                className="overflow-hidden rounded-xl border border-line bg-white transition hover:shadow-md"
              >
                <div className="grid aspect-[4/3] place-items-center bg-gradient-to-br from-primary-soft to-cream-dark">
                  <Moon className="size-14 text-primary/40" strokeWidth={1.25} />
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold text-ink">{p.name}</h3>
                  <p className="mt-0.5 text-xs text-ink-muted">{p.store}</p>
                  <p className="mt-2 font-bold text-primary">{formatVnd(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}
