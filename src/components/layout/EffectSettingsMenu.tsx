import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import {
  EFFECT_PRESET_LABELS,
  FLUID_DRIFT_MAX,
  FPS_STEPS,
  applyEffectPreset,
  getActivePreset,
  setEffects,
  useEffectSettings,
  type EffectSettings,
} from "@/lib/appearance";

type Choice<T> = { value: T; label: string };

const CLOUD_MODES: ReadonlyArray<Choice<EffectSettings["cloudMode"]>> = [
  { value: "playing", label: "Chạy" },
  { value: "paused", label: "Đứng im" },
  { value: "hidden", label: "Ẩn" },
];

const RAIL_SURFACES: ReadonlyArray<Choice<EffectSettings["railSurface"]>> = [
  { value: "blur", label: "Kính mờ" },
  { value: "tint", label: "Đục màu" },
];

const FLUID_RAILS: ReadonlyArray<Choice<EffectSettings["fluidRail"]>> = [
  { value: "full", label: "Kín màn" },
  { value: "clip", label: "Chừa dải" },
  { value: "stitch", label: "Nối mép" },
];

// One-of-many buttons; value is null when nothing matches (custom settings)
function Segmented<T extends string>({
  label,
  value,
  choices,
  onChange,
  highlight = false,
}: {
  label: string;
  value: T | null;
  choices: ReadonlyArray<Choice<T>>;
  onChange: (next: T) => void;
  highlight?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={`flex gap-1 rounded-lg bg-cream p-1 ${highlight ? "ring-2 ring-primary" : ""}`}>
      {choices.map((choice) => {
        const selected = value === choice.value;
        return (
          <button
            key={choice.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(choice.value)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
              selected ? "bg-primary text-white" : "text-ink-soft hover:bg-cream-dark hover:text-ink"
            }`}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="px-1 py-2">
      <div className="mb-1.5 text-sm font-medium text-ink-soft">{label}</div>
      {children}
    </div>
  );
}

// Background effect settings (ported from FengDesk): two presets on top, every knob under "Nâng cao".
// Tuning a knob by hand leaves both presets unselected and outlines the group.
export function EffectSettingsMenu() {
  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const effects = useEffectSettings();
  const preset = getActivePreset(effects);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Cài đặt hiệu ứng"
        className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-ink-soft hover:text-primary"
      >
        <Sparkles size={20} />
        <span className="hidden text-[11px] sm:block">Hiệu ứng</span>
      </button>

      {open && (
        <div role="dialog" aria-label="Cài đặt hiệu ứng" className="absolute right-0 top-full z-50 mt-2 flex w-72 flex-col gap-1 rounded-xl border border-line bg-white p-3 shadow-lg">
          <Field label="Hiệu ứng nền">
            <Segmented label="Mức hiệu ứng nền" value={preset} choices={EFFECT_PRESET_LABELS} onChange={applyEffectPreset} highlight={preset === null} />
          </Field>

          {/* <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            aria-expanded={advanced}
            className="flex w-full items-center gap-2 rounded-lg px-1 py-2 text-sm font-medium text-ink-soft hover:text-ink"
          >
            <span className="flex-1 text-left">Nâng cao</span>
            <ChevronDown size={16} className={`transition-transform duration-300 ${advanced ? "rotate-180" : ""}`} />
          </button> */}

          <div inert={!advanced} className={`grid transition-[grid-template-rows] duration-300 ease-out ${advanced ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
              <div className="flex flex-col divide-y divide-line border-t border-line pt-1">
                <Field label={effects.fluidFps === 0 ? "Fluid: Tắt" : `Fluid: ${effects.fluidFps} FPS`}>
                  <input
                    type="range"
                    min={0}
                    max={FPS_STEPS.length - 1}
                    step={1}
                    value={Math.max(0, FPS_STEPS.indexOf(effects.fluidFps as (typeof FPS_STEPS)[number]))}
                    onChange={(e) => setEffects({ fluidFps: FPS_STEPS[Number(e.target.value)] })}
                    aria-label="Khung hình mỗi giây của lớp fluid"
                    className="w-full accent-[var(--color-primary)]"
                  />
                </Field>

                <Field label={effects.fluidDrift === 0 ? "Fluid frequency: Tắt" : `Fluid frequency: ${effects.fluidDrift}/${FLUID_DRIFT_MAX}`}>
                  <input
                    type="range"
                    min={0}
                    max={FLUID_DRIFT_MAX}
                    step={1}
                    value={effects.fluidDrift}
                    onChange={(e) => setEffects({ fluidDrift: Number(e.target.value) })}
                    aria-label="Cường độ fluid trôi nổi ngẫu nhiên"
                    className="w-full accent-[var(--color-primary)]"
                  />
                </Field>

                <Field label="Fluid sau dải nội dung">
                  <Segmented label="Fluid sau dải nội dung" value={effects.fluidRail} choices={FLUID_RAILS} onChange={(fluidRail) => setEffects({ fluidRail })} />
                </Field>

                <Field label="Mảng mây">
                  <Segmented label="Mảng mây" value={effects.cloudMode} choices={CLOUD_MODES} onChange={(cloudMode) => setEffects({ cloudMode })} />
                </Field>

                <Field label="Dải nội dung">
                  <Segmented label="Chất liệu dải nội dung" value={effects.railSurface} choices={RAIL_SURFACES} onChange={(railSurface) => setEffects({ railSurface })} />
                </Field>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
