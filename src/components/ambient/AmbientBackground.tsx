import { useEffect, useRef, useState } from "react";
import { FluidSolver } from "@/lib/asciiFluid";

// Nền động của trang chủ (mô phỏng cách làm của FengDeskAI):
//  1. mảng mây màu trôi chậm (CSS thuần, chỉ animate transform);
//  2. lớp fluid vẽ bằng ký tự ASCII, các cụm mực tự nổi lên và tan ngẫu nhiên;
//  3. dải nội dung ở giữa giữa hai thanh rail dọc, phần nền phía sau được làm mờ.
// Fluid chỉ được vẽ ở hai lề ngoài rail, vì phần giữa bị rail che nên vẽ vào đó là phí.

/** "blur": kính mờ thật (đẹp, tốn GPU). "tint": nền đục nhẹ, không blur (rẻ). */
const RAIL_SURFACE: "blur" | "tint" = "blur";

const CLOUD_LAYERS = [1, 2, 3, 4, 5, 6];

const CELL_SIZE = 15;
const RAMP = ["-", "·", "+", "*"] as const;
const RAMP_STOPS = [0.05, 0.14, 0.32, 0.6] as const;
const ALPHA_STEPS = 5;
const MIN_ALPHA = 0.4;
const MAX_ALPHA = 0.62;

const VELOCITY_RETENTION = 0.5;
const DENSITY_RETENTION_FAINT = 0.52;
const DENSITY_RETENTION_DENSE = 0.1;

// Cụm mực trôi ngẫu nhiên: hiện dần, trôi lững lờ rồi tự tan
const DRIFT_RADIUS = [2.8, 4] as const; // ô lưới
const DRIFT_ATTACK = [0.8, 1.8] as const; // giây
const DRIFT_RELEASE = [2.8, 3.4] as const; // giây
const DRIFT_SPEED = 13; // ô/giây
const DRIFT_FEED = 6.2;
const MAX_PUFFS = 4;

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
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

const between = (range: readonly [number, number]) => range[0] + Math.random() * (range[1] - range[0]);

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const railRef = useRef<HTMLSpanElement | null>(null);
  const [fluidEnabled, setFluidEnabled] = useState(false);

  // Chỉ bật fluid khi có chuột thật và người dùng không yêu cầu giảm chuyển động
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
    // Cột bị rail che (không vẽ) và hai dải lề cần xoá mỗi khung hình
    let hiddenFrom = Number.POSITIVE_INFINITY;
    let hiddenTo = Number.NEGATIVE_INFINITY;
    let bands: Array<[number, number]> = [[0, cssWidth]];
    // Màn hình hẹp hơn rail: không còn lề nào thấy được fluid, nên khỏi mô phỏng
    let nothingVisible = false;

    const puffs: Puff[] = [];
    let spawnTimer = 0.3;
    let painted = 0;
    let idle = false;

    const buckets: number[][] = Array.from({ length: RAMP.length * ALPHA_STEPS }, () => []);

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

    const layoutGrid = (width: number, height: number) => {
      const rows = Math.max(8, Math.ceil(height / cellPx) + 2);
      const cols = Math.max(8, Math.ceil(width / cellPx) + 2);
      const rail = railRef.current?.getBoundingClientRect();
      const usable = rail && rail.left >= cellPx * 3 && width - rail.right >= cellPx * 3;

      nothingVisible = !usable;
      solver = new FluidSolver(cols, rows);

      if (!usable) {
        hiddenFrom = Number.POSITIVE_INFINITY;
        hiddenTo = Number.NEGATIVE_INFINITY;
        bands = [];
        return;
      }

      // Ô thứ `col` vẽ ở tâm (col - 0.5) * cellPx; ô đầu tiên nằm trọn trong rail là ô có tâm vượt mép
      hiddenFrom = Math.ceil(rail.left / cellPx + 0.5) + 1;
      hiddenTo = Math.floor(rail.right / cellPx + 0.5) - 1;
      bands = [
        [0, rail.left + cellPx * 2],
        [rail.right - cellPx * 2, width - rail.right + cellPx * 2],
      ];
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

    // Hiện dần rồi ngừng bơm để cụm tự tan
    const envelopeOf = (puff: Puff) => {
      if (puff.age < puff.attack) {
        const t = puff.age / puff.attack;
        return t * t * (3 - 2 * t);
      }
      const t = (puff.age - puff.attack) / puff.release;
      return t >= 1 ? 0 : 1 - t * t * (3 - 2 * t);
    };

    const updateDrift = (dt: number) => {
      spawnTimer -= dt;
      if (spawnTimer <= 0 && puffs.length < MAX_PUFFS) {
        puffs.push(spawnPuff());
        spawnTimer = 0.4 + Math.random();
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

    const colToX = (col: number) => (col - 0.5) * cellPx;

    const render = () => {
      const { cols, rows, density } = solver;

      for (const [x, w] of bands) ctx.clearRect(x, 0, w, cssHeight);
      for (const bucket of buckets) bucket.length = 0;
      painted = 0;

      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          if (x >= hiddenFrom && x <= hiddenTo) continue;
          const d = density[x + y * cols];
          if (d < RAMP_STOPS[0]) continue;

          let tier = 0;
          while (tier < RAMP.length - 1 && d >= RAMP_STOPS[tier + 1]) tier++;
          const level = Math.min(ALPHA_STEPS - 1, Math.floor(d * ALPHA_STEPS));
          buckets[tier * ALPHA_STEPS + level].push(x + y * cols);
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

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);

      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (document.hidden || dt <= 0 || nothingVisible) return;

      const drifted = updateDrift(dt);

      // Không còn nguồn mực và không còn ô nào để vẽ thì ngủ: bỏ cả mô phỏng lẫn clearRect
      if (!drifted && painted === 0) {
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
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [fluidEnabled]);

  return (
    <div aria-hidden className="mc-ambient pointer-events-none fixed inset-0 -z-10">
      {CLOUD_LAYERS.map((layer) => (
        <span key={layer} className={`mc-cloud mc-cloud-${layer}`} />
      ))}

      {fluidEnabled && <canvas ref={canvasRef} className="absolute inset-0" />}

      {/* Dải nội dung: hai thanh rail dọc ở hai mép (::before/::after) và nền mờ ở giữa.
          Bề rộng lấy từ --page-max nên trùng với Container của trang. */}
      <span ref={railRef} className={`mc-rail ${RAIL_SURFACE === "blur" ? "mc-rail-blur" : "mc-rail-tint"}`} />
    </div>
  );
}
