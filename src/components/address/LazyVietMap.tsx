import { lazy, Suspense, type ComponentProps } from "react";

// The map library is about 1 MB, so it is only downloaded by pages that show a map
const VietMap = lazy(() => import("./VietMap").then((m) => ({ default: m.VietMap })));

export function LazyVietMap(props: ComponentProps<typeof VietMap>) {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center rounded-xl border border-line bg-cream text-sm text-ink-muted" style={{ height: props.height ?? 300 }}>
          Đang tải bản đồ...
        </div>
      }
    >
      <VietMap {...props} />
    </Suspense>
  );
}
