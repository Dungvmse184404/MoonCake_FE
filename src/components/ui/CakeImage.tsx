import { useState } from "react";
import { Gift, Moon } from "lucide-react";

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
  iconClassName?: string;
  kind?: "product" | "box";
}

// Product or box picture with a placeholder when there is no link or the link is broken.
export function CakeImage({ src, alt, className = "", iconClassName = "size-14", kind = "product" }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const Icon = kind === "box" ? Gift : Moon;

  return (
    <div className={`grid place-items-center overflow-hidden bg-gradient-to-br from-primary-soft to-cream-dark ${className}`}>
      {src && failedSrc !== src ? (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} className="size-full object-cover" />
      ) : (
        <Icon className={`${iconClassName} text-primary/40`} strokeWidth={1.25} />
      )}
    </div>
  );
}
