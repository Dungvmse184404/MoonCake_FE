import type { ReactNode } from "react";

// Chiều ngang rộng hơn bản mẫu: tối đa --page-max (90rem), lề nhỏ để nội dung không bị bó hẹp.
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[var(--page-max)] px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}
