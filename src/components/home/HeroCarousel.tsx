import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Moon } from "lucide-react";
import { banners } from "@/data/mock";

const AUTO_PLAY_MS = 5000;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % banners.length), AUTO_PLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused]);

  const go = (delta: number) => setIndex((i) => (i + delta + banners.length) % banners.length);
  const banner = banners[index];

  return (
    <section
      className="relative h-[300px] overflow-hidden rounded-[var(--radius-card)] shadow-md sm:h-[340px] lg:h-[380px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Banner gian hàng"
    >
      <div
        key={banner.id}
        className={`relative flex h-full items-center bg-gradient-to-r ${banner.gradient} px-8 text-white sm:px-14 lg:px-20`}
      >
        <Moon
          aria-hidden
          className="absolute -right-10 top-1/2 size-[420px] -translate-y-1/2 text-white/10 sm:-right-4 lg:right-20"
          strokeWidth={1}
        />
        <div className="relative max-w-xl">
          <span className="inline-block rounded-full bg-gold px-3 py-1 text-xs font-bold tracking-wide text-primary-dark">
            {banner.badge}
          </span>
          <h2 className="mt-4 font-serif text-2xl font-black leading-tight sm:text-4xl lg:text-5xl">{banner.title}</h2>
          <p className="mt-1 font-serif text-2xl font-black text-gold sm:text-4xl lg:text-5xl">{banner.highlight}</p>
          <p className="mt-4 text-sm text-white/85 sm:text-base">{banner.description}</p>
          <p className="mt-1 text-xs text-white/70">{banner.store}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary-soft"
            >
              Mua ngay
            </Link>
            <Link
              to="/products"
              className="rounded-lg border border-white/50 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Xem gian hàng
            </Link>
          </div>
        </div>
      </div>

      <button
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-ink hover:bg-white"
        aria-label="Banner trước"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-ink hover:bg-white"
        aria-label="Banner sau"
      >
        <ChevronRight size={18} />
      </button>

      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {banners.map((b, i) => (
          <button
            key={b.id}
            onClick={() => setIndex(i)}
            aria-label={`Chuyển tới banner ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
          />
        ))}
      </div>
    </section>
  );
}
