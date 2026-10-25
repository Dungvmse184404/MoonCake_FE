import type { Tone } from "@/lib/labels";

const TONE_STYLE: Record<Tone, string> = {
  neutral: "bg-cream-dark text-ink-soft",
  info: "bg-[#e6eef7] text-[#2b5d8a]",
  success: "bg-[#f3e6c4] text-[#6b5416]",
  warning: "bg-[#fbecc9] text-[#8a5a0a]",
  danger: "bg-primary/10 text-primary-dark",
};

export function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_STYLE[tone]}`}>
      {children}
    </span>
  );
}
