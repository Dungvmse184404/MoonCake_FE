import { useSyncExternalStore } from "react";

// Background effect settings (ported from FengDesk): one object saved under one localStorage key and read
// through useSyncExternalStore, so the settings panel and the background always agree.

const EFFECTS_KEY = "mc-effects";

export type CloudMode = "playing" | "paused" | "hidden";

// "blur" (frosted glass) looks best but redraws behind every animated frame; "tint" is a static layer.
export type RailSurface = "blur" | "tint";

// How the fluid treats the content rail: "full" draws everywhere, "clip" simulates everywhere but skips
// drawing under the rail, "stitch" drops the middle from the grid (cheapest, waves jump across the rail).
export type FluidRail = "full" | "clip" | "stitch";

export interface EffectSettings {
  // Frames per second of the ASCII fluid; 0 stops feeding it
  fluidFps: number;
  // Random drifting puffs, 0..FLUID_DRIFT_MAX
  fluidDrift: number;
  fluidRail: FluidRail;
  cloudMode: CloudMode;
  railSurface: RailSurface;
}

export const FLUID_DRIFT_MAX = 5;

// No 24: on a 60 Hz screen it does not divide evenly and looks choppier than 20
export const FPS_STEPS = [0, 15, 20, 30, 60] as const;

export type EffectPreset = "full" | "reduced";

export const EFFECT_PRESETS: Record<EffectPreset, EffectSettings> = {
  full: { fluidFps: 30, fluidDrift: 3, fluidRail: "clip", cloudMode: "playing", railSurface: "blur" },
  reduced: { fluidFps: 0, fluidDrift: 3, fluidRail: "clip", cloudMode: "playing", railSurface: "blur" },
};

export const EFFECT_PRESET_LABELS: ReadonlyArray<{ value: EffectPreset; label: string }> = [
  { value: "full", label: "Đầy đủ" },
  { value: "reduced", label: "Rút gọn" },
];

const DEFAULTS = EFFECT_PRESETS.full;

// Integer in [0, max] or null; null/"" must be rejected first because Number(null) is 0
function clampInt(value: unknown, max: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}

function readEffects(): EffectSettings {
  let parsed: unknown;
  try {
    const raw = localStorage.getItem(EFFECTS_KEY);
    if (raw === null) return DEFAULTS;
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULTS;
  }
  if (typeof parsed !== "object" || parsed === null) return DEFAULTS;

  const v = parsed as Record<string, unknown>;
  return {
    fluidFps: clampInt(v.fluidFps, 60) ?? DEFAULTS.fluidFps,
    fluidDrift: clampInt(v.fluidDrift, FLUID_DRIFT_MAX) ?? DEFAULTS.fluidDrift,
    fluidRail: v.fluidRail === "full" || v.fluidRail === "clip" || v.fluidRail === "stitch" ? v.fluidRail : DEFAULTS.fluidRail,
    cloudMode: v.cloudMode === "playing" || v.cloudMode === "paused" || v.cloudMode === "hidden" ? v.cloudMode : DEFAULTS.cloudMode,
    railSurface: v.railSurface === "blur" || v.railSurface === "tint" ? v.railSurface : DEFAULTS.railSurface,
  };
}

let effects = readEffects();
let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getEffects() {
  return effects;
}

// Returns a new object: useSyncExternalStore compares by reference
export function setEffects(patch: Partial<EffectSettings>) {
  effects = { ...effects, ...patch };
  try {
    localStorage.setItem(EFFECTS_KEY, JSON.stringify(effects));
  } catch {
    // Storage blocked: the choice lasts for this page only
  }
  listeners.forEach((l) => l());
}

export function applyEffectPreset(preset: EffectPreset) {
  setEffects(EFFECT_PRESETS[preset]);
}

// The preset matching the current settings, or null when they were tuned by hand ("custom")
export function getActivePreset(current: EffectSettings): EffectPreset | null {
  const keys = Object.keys(DEFAULTS) as Array<keyof EffectSettings>;
  for (const [name, preset] of Object.entries(EFFECT_PRESETS)) {
    if (keys.every((k) => current[k] === preset[k])) return name as EffectPreset;
  }
  return null;
}

export function useEffectSettings() {
  return useSyncExternalStore(subscribe, getEffects);
}
