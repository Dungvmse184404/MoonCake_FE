import { Star } from "lucide-react";

export function RatingStars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(value) ? "fill-gold text-gold" : "text-line"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}
