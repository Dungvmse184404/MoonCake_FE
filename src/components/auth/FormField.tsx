import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormField({ label, error, id, ...input }: Props) {
  const inputId = id ?? input.name;
  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...input}
        className={`w-full rounded-lg border bg-white/70 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-ink-muted focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 ${
          error ? "border-primary" : "border-line"
        }`}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-primary">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormAlert({ type, children }: { type: "error" | "success"; children: React.ReactNode }) {
  const style =
    type === "error"
      ? "border-primary/30 bg-primary/5 text-primary-dark"
      : "border-[#8a6d1f]/30 bg-[#f3e6c4] text-[#6b5416]";
  return (
    <p role={type === "error" ? "alert" : "status"} className={`rounded-lg border px-3.5 py-2.5 text-sm ${style}`}>
      {children}
    </p>
  );
}

export function SubmitButton({
  loading,
  disabled = false,
  children,
}: {
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-primary transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Đang xử lý..." : children}
    </button>
  );
}
