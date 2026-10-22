import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Moon } from "lucide-react";
import background from "@/assets/home/banner-giftbox2.jpg";

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Khung rộng hơn cho form nhiều cột (đăng ký) */
  wide?: boolean;
}

// Khung chung cho các trang đăng nhập, đăng ký, xác thực OTP:
// ảnh phủ toàn trang, khung form nổi lên trên với nền kính mờ (blur).
export function AuthShell({ title, subtitle, children, footer, wide = false }: Props) {
  return (
    <div className="relative isolate flex min-h-[calc(100vh-130px)] items-center justify-center overflow-hidden px-4 py-12">
      <img src={background} alt="" aria-hidden className="absolute inset-0 -z-20 size-full object-cover object-center" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black/55 via-black/30 to-primary-dark/50" />

      <div
        className={`w-full rounded-[var(--radius-card)] border border-white/40 bg-cream/70 p-6 shadow-2xl backdrop-blur-xl sm:p-10 ${
          wide ? "max-w-xl" : "max-w-md"
        }`}
      >
        <Link to="/" className="mb-6 inline-flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-soft shadow-primary">
            <Moon size={18} />
          </span>
          <span className="font-serif text-xl font-black text-primary">MoonCake</span>
        </Link>
        <h1 className="font-serif text-2xl font-black text-primary-dark">{title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div>}
      </div>
    </div>
  );
}
