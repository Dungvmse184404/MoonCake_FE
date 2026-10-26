import { useEffect, useRef, useState } from "react";
import { useEffectSettings } from "@/lib/appearance";
import { FluidSolver } from "@/lib/asciiFluid";

// Drifting clouds (CSS) plus an ASCII fluid drawn on a canvas, ported from FengDesk's AsciiFluidBackground.
// The knobs (FPS, drift, rail mode, clouds, rail surface) come from the effect settings in the header.

const CLOUD_LAYERS = [1, 2, 3, 4, 5, 6];

const CELL_SIZE = 15;
const RAMP = ["-", "·", "+", "*"] as const;
const RAMP_STOPS = [0.05, 0.14, 0.32, 0.6] as const;
const ALPHA_STEPS = 5;
const MIN_ALPHA = 0.6;
const MAX_ALPHA = 0.3;

// Share of velocity / density left after one second (raised to dt)
const VELOCITY_RETENTION = 0.5;
const DENSITY_RETENTION_FAINT = 0.52;
const DENSITY_RETENTION_DENSE = 0.1;

const POINTER_MAX_SPEED = 55; // cells per second
const SPLAT_RADIUS = 1.3;
const BURST_ARMS = 26;
const BURST_SPEED = 56;

const DRIFT_RADIUS = [2.8, 4] as const; // cells
const DRIFT_ATTACK = [0.8, 1.8] as const; // seconds
const DRIFT_RELEASE = [2.8, 3.4] as const; // seconds
const DRIFT_SPEED = 13; // cells per second
const DRIFT_FEED = 6.2;
const DRIFT_PUFFS_PER_LEVEL = 4;

type Rgb = [number, number, number];

interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  age: number;
  attack: number;
  release: number;
}

const FALLBACK_INK: Rgb = [122, 20, 24];
const FALLBACK_TINT: Rgb = [212, 167, 44];

function readThemeColor(variable: string, fallback: Rgb): Rgb {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) {
    return [parseInt(raw.slice(1, 3), 16), parseInt(raw.slice(3, 5), 16), parseInt(raw.slice(5, 7), 16)];
  }
  return fallback;
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
}

const between = (range: readonly [number, number]) => range[0] + Math.random() * (range[1] - range[0]);

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const railRef = useRef<HTMLSpanElement | null>(null);
  const [fluidEnabled, setFluidEnabled] = useState(false);
  const { fluidFps, fluidDrift, fluidRail, cloudMode, railSurface } = useEffectSettings();

  // Read through a ref so changing a knob does not rebuild the simulation
  const knobs = useRef({ fluidFps, fluidDrift });
  useEffect(() => {
    knobs.current = { fluidFps, fluidDrift };
  }, [fluidFps, fluidDrift]);

  // Only with a real mouse and when the user does not ask for reduced motion
  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setFluidEnabled(finePointer.matches && !reduceMotion.matches);
    sync();
    finePointer.addEventListener("change", sync);
    reduceMotion.addEventListener("change", sync);
    return () => {
      finePointer.removeEventListener("change", sync);
      reduceMotion.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!fluidEnabled || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let solver = new FluidSolver(1, 1);
    let cellPx = CELL_SIZE;
    let cssWidth = window.innerWidth;
    let cssHeight = window.innerHeight;
    let inkColors: string[][] = [];
    const buckets: number[][] = Array.from({ length: RAMP.length * ALPHA_STEPS }, () => []);

    const pointer = { x: 0, y: 0, prevX: 0, prevY: 0, seen: false };
    // Trail behind the cursor: toggled by clicking in the margins beside the rail
    let trailActive = false;

    const puffs: Puff[] = [];
    let spawnTimer = 0.3;
    let painted = 0;
    let idle = false;

    // Grid shape (set by layoutGrid)
    let leftCols = 0; // "stitch": columns of the left margin
    let rightOriginX = 0; // "stitch": screen x of the first right-margin column
    let hiddenFrom = Number.POSITIVE_INFINITY; // "clip": columns covered by the rail
    let hiddenTo = Number.NEGATIVE_INFINITY;
    let bands: Array<[number, number]> = [[0, cssWidth]];

    const buildPalette = () => {
      const ink = readThemeColor("--color-primary-dark", FALLBACK_INK);
      const tint = readThemeColor("--color-gold", FALLBACK_TINT);
      inkColors = RAMP.map((_, tier) => {
        const [r, g, b] = mix(tint, ink, tier / (RAMP.length - 1));
        return Array.from({ length: ALPHA_STEPS }, (_, level) => {
          const alpha = MIN_ALPHA + ((MAX_ALPHA - MIN_ALPHA) * (level + 1)) / ALPHA_STEPS;
          return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
        });
      });
    };

    const setBands = (width: number, leftEdge: number, rightEdge: number) => {
      bands = [
        [0, leftEdge],
        [rightEdge, width - rightEdge],
      ];
    };

    const layoutGrid = (width: number, height: number) => {
      const rows = Math.max(8, Math.ceil(height / cellPx) + 2);
      const rail = railRef.current?.getBoundingClientRect();
      const usableRail = rail && rail.left >= cellPx * 3 && width - rail.right >= cellPx * 3;

      if (!usableRail || fluidRail === "full") {
        leftCols = 0;
        hiddenFrom = Number.POSITIVE_INFINITY;
        hiddenTo = Number.NEGATIVE_INFINITY;
        bands = [[0, width]];
        solver = new FluidSolver(Math.max(8, Math.ceil(width / cellPx) + 2), rows);
        return;
      }

      rightOriginX = rail.right;

      if (fluidRail === "stitch") {
        leftCols = Math.max(1, Math.ceil(rail.left / cellPx));
        hiddenFrom = Number.POSITIVE_INFINITY;
        hiddenTo = Number.NEGATIVE_INFINITY;
        setBands(width, rail.left + cellPx, rail.right - cellPx);
        solver = new FluidSolver(leftCols + Math.max(1, Math.ceil((width - rail.right) / cellPx)) + 2, rows);
        return;
      }

      leftCols = 0;
      hiddenFrom = Math.ceil(rail.left / cellPx + 0.5);
      hiddenTo = Math.floor(rail.right / cellPx + 0.5);
      setBands(width, rail.left + cellPx, rail.right - cellPx);
      solver = new FluidSolver(Math.max(8, Math.ceil(width / cellPx) + 2), rows);
    };

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cssWidth = width;
      cssHeight = height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      cellPx = width < 768 ? CELL_SIZE * 1.25 : CELL_SIZE;

      layoutGrid(width, height);
      painted = 0;
      idle = false;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${Math.round(cellPx)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    };

    const colToX = (col: number) => (leftCols > 0 && col > leftCols ? rightOriginX + (col - leftCols - 0.5) * cellPx : (col - 0.5) * cellPx);
    const xToCol = (px: number) => (leftCols > 0 && px >= rightOriginX ? (px - rightOriginX) / cellPx + leftCols + 0.5 : px / cellPx + 0.5);

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = xToCol(event.clientX);
      pointer.y = event.clientY / cellPx + 0.5;
      if (!pointer.seen) {
        pointer.prevX = pointer.x;
        pointer.prevY = pointer.y;
        pointer.seen = true;
      }
    };

    // Ring of force spreading out in every direction
    const burst = (cx: number, cy: number, power: number) => {
      const offset = Math.random() * Math.PI * 2;
      solver.splat(cx, cy, 0, 0, 0.5 * power, SPLAT_RADIUS * 1.5 * power);
      for (let k = 0; k < BURST_ARMS; k++) {
        const angle = offset + (k / BURST_ARMS) * Math.PI * 2;
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        const reach = SPLAT_RADIUS * 1.1 * power;
        solver.splat(cx + dirX * reach, cy + dirY * reach, dirX * BURST_SPEED * power, dirY * BURST_SPEED * power, 0.34 * power, SPLAT_RADIUS * power);
      }
    };

    const isOutsideRail = (clientX: number) => {
      const rect = railRef.current?.getBoundingClientRect();
      return Boolean(rect) && (clientX < rect!.left || clientX > rect!.right);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!isOutsideRail(event.clientX)) return;
      onPointerMove(event);
      trailActive = !trailActive;
      if (trailActive) burst(pointer.x, pointer.y, 1.35);
    };

    // Ink along the path the cursor travelled this frame; true when something was fed
    const emitFromPointer = (dt: number) => {
      if (!pointer.seen) return false;
      const dx = pointer.x - pointer.prevX;
      const dy = pointer.y - pointer.prevY;
      const distance = Math.hypot(dx, dy);
      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;
      if (!trailActive || distance < 0.02) return false;

      const speed = Math.min(distance / dt, POINTER_MAX_SPEED);
      const steps = Math.min(10, Math.ceil(distance / 0.7));
      const fx = (dx / distance) * speed;
      const fy = (dy / distance) * speed;
      const amount = Math.min(0.34, 0.14 + speed * 0.004);
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        solver.splat(pointer.prevX - dx * (1 - t), pointer.prevY - dy * (1 - t), fx, fy, amount, SPLAT_RADIUS);
      }
      return true;
    };

    // New puffs avoid the clipped rail: ink there costs work and nobody sees it
    const spawnCol = () => {
      for (let attempt = 0; attempt < 4; attempt++) {
        const col = 2 + Math.random() * (solver.cols - 5);
        if (col < hiddenFrom || col > hiddenTo) return col;
      }
      return 2 + Math.random() * (solver.cols - 5);
    };

    const spawnPuff = (): Puff => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * DRIFT_SPEED;
      return {
        x: spawnCol(),
        y: 2 + Math.random() * (solver.rows - 5),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: between(DRIFT_RADIUS),
        age: 0,
        attack: between(DRIFT_ATTACK),
        release: between(DRIFT_RELEASE),
      };
    };

    const envelopeOf = (puff: Puff) => {
      if (puff.age < puff.attack) {
        const t = puff.age / puff.attack;
        return t * t * (3 - 2 * t);
      }
      const t = (puff.age - puff.attack) / puff.release;
      return t >= 1 ? 0 : 1 - t * t * (3 - 2 * t);
    };

    const updateDrift = (dt: number) => {
      const level = knobs.current.fluidDrift;
      if (level <= 0) {
        puffs.length = 0;
        return false;
      }
      const maxPuffs = Math.max(1, Math.round(level * DRIFT_PUFFS_PER_LEVEL));
      spawnTimer -= dt;
      if (spawnTimer <= 0 && puffs.length < maxPuffs) {
        puffs.push(spawnPuff());
        spawnTimer = (0.4 + Math.random()) / level;
      }
      for (let i = puffs.length - 1; i >= 0; i--) {
        const puff = puffs[i];
        puff.age += dt;
        if (puff.age >= puff.attack + puff.release) {
          puffs.splice(i, 1);
          continue;
        }
        puff.x += puff.vx * dt;
        puff.y += puff.vy * dt;
        solver.splat(puff.x, puff.y, puff.vx, puff.vy, DRIFT_FEED * envelopeOf(puff) * dt, puff.radius);
      }
      return puffs.length > 0;
    };

    const render = () => {
      const { cols, rows, density } = solver;
      for (const [x, w] of bands) ctx.clearRect(x, 0, w, cssHeight);
      for (const bucket of buckets) bucket.length = 0;
      painted = 0;

      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          if (x >= hiddenFrom && x <= hiddenTo) continue;
          const i = x + y * cols;
          const d = density[i];
          if (d < RAMP_STOPS[0]) continue;
          let tier = 0;
          while (tier < RAMP.length - 1 && d >= RAMP_STOPS[tier + 1]) tier++;
          const level = Math.min(ALPHA_STEPS - 1, Math.floor(d * ALPHA_STEPS));
          buckets[tier * ALPHA_STEPS + level].push(i);
          painted++;
        }
      }

      for (let tier = 0; tier < RAMP.length; tier++) {
        for (let level = 0; level < ALPHA_STEPS; level++) {
          const bucket = buckets[tier * ALPHA_STEPS + level];
          if (bucket.length === 0) continue;
          ctx.fillStyle = inkColors[tier][level];
          for (const i of bucket) {
            const x = i % cols;
            const y = (i - x) / cols;
            ctx.fillText(RAMP[tier], colToX(x), (y - 0.5) * cellPx);
          }
        }
      }
    };

    let raf = 0;
    let last = performance.now();
    let accum = 0; // time not simulated yet, for the FPS cap

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const elapsed = (now - last) / 1000;
      last = now;
      if (document.hidden || elapsed <= 0) return;

      // At 60 and above skip the gate: comparing 1/60 with a 60 Hz frame would drop frames by rounding
      const fps = knobs.current.fluidFps;
      accum += elapsed;
      if (fps > 0 && fps < 60 && accum < 1 / fps) return;
      const dt = Math.min(accum, 1 / 30);
      accum = 0;

      const feeding = fps > 0;
      const drifted = feeding && updateDrift(dt);
      const trailed = feeding && emitFromPointer(dt);

      // Nothing fed and nothing left on screen: sleep until new ink (the clearRect is the costly part)
      if (!drifted && !trailed && painted === 0) {
        if (!idle) {
          solver.reset();
          ctx.clearRect(0, 0, cssWidth, cssHeight);
          idle = true;
        }
        return;
      }

      idle = false;
      solver.step(dt, VELOCITY_RETENTION ** dt, DENSITY_RETENTION_FAINT ** dt, DENSITY_RETENTION_DENSE ** dt);
      render();
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    };

    buildPalette();
    resize();
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [fluidEnabled, fluidRail]);

  return (
    <div aria-hidden className={`mc-ambient pointer-events-none fixed inset-0 -z-10 ${cloudMode === "paused" ? "mc-clouds-paused" : ""}`}>
      {cloudMode !== "hidden" && CLOUD_LAYERS.map((layer) => <span key={layer} className={`mc-cloud mc-cloud-${layer}`} />)}

      {fluidEnabled && <canvas ref={canvasRef} className="absolute inset-0" />}

      <span ref={railRef} className={`mc-rail ${railSurface === "blur" ? "mc-rail-blur" : "mc-rail-tint"}`} />
    </div>
  );
}
