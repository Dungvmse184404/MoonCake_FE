import giftbox from "@/assets/home/banner-giftbox.jpg";
import giftbox1 from "@/assets/home/banner-giftbox1.png";
import giftbox2 from "@/assets/home/banner-giftbox2.jpg";
import toProducts from "@/assets/home/banner-to-products.webp";

// Box photos reuse the shop's own banner images.
export const BOX_IMAGES = [giftbox, giftbox1, giftbox2, toProducts];

interface CakeLook {
  // crust, darker rim/shadow, motif colour, plate background
  crust: string;
  rim: string;
  motif: string;
  plate: string;
}

export const CAKE_LOOKS = {
  baked: { crust: "#d39a4a", rim: "#a86a26", motif: "#8a5419", plate: "#f6e2c8" },
  bakedDark: { crust: "#b7742e", rim: "#82501b", motif: "#5f3910", plate: "#f1e9d8" },
  pandan: { crust: "#9cc98a", rim: "#6f9e5d", motif: "#4f7d40", plate: "#eef5e6" },
  rose: { crust: "#eeb3bf", rim: "#cc8595", motif: "#a95e70", plate: "#fbeef1" },
  snow: { crust: "#f4efe6", rim: "#d6ccb8", motif: "#b3a68b", plate: "#ece5d6" },
  charcoal: { crust: "#3b3633", rim: "#1f1b19", motif: "#8a7f6a", plate: "#e8e1d3" },
  matcha: { crust: "#7f9c4b", rim: "#5b7531", motif: "#3f5520", plate: "#eef2e2" },
  taro: { crust: "#b9a2d4", rim: "#8f76ae", motif: "#6c5590", plate: "#f2edf8" },
} satisfies Record<string, CakeLook>;

export type CakeLookName = keyof typeof CAKE_LOOKS;

// A fluted round mooncake seen from above, drawn as SVG so the mock needs no image files.
export function cakeImage(look: CakeLookName): string {
  const { crust, rim, motif, plate } = CAKE_LOOKS[look];
  const scallops = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return `<circle cx="${(200 + Math.cos(a) * 128).toFixed(1)}" cy="${(200 + Math.sin(a) * 128).toFixed(1)}" r="26" fill="${crust}"/>`;
  }).join("");
  const rays = Array.from({ length: 8 }, (_, i) =>
    `<path d="M200 118 Q214 160 200 200 Q186 160 200 118Z" fill="${motif}" opacity=".55" transform="rotate(${i * 45} 200 200)"/>`,
  ).join("");
  const petals = Array.from({ length: 4 }, (_, i) =>
    `<ellipse cx="200" cy="184" rx="9" ry="16" fill="${motif}" transform="rotate(${i * 90} 200 200)"/>`,
  ).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
<rect width="400" height="400" fill="${plate}"/>
<ellipse cx="206" cy="214" rx="160" ry="156" fill="${rim}" opacity=".35"/>
${scallops}
<circle cx="200" cy="200" r="128" fill="${crust}"/>
<circle cx="200" cy="200" r="104" fill="none" stroke="${rim}" stroke-width="6"/>
<circle cx="200" cy="200" r="90" fill="none" stroke="${motif}" stroke-width="2" stroke-dasharray="4 7"/>
${rays}
<circle cx="200" cy="200" r="40" fill="${crust}" stroke="${motif}" stroke-width="4"/>
${petals}
<circle cx="200" cy="200" r="6" fill="${crust}"/>
<ellipse cx="150" cy="140" rx="46" ry="22" fill="#ffffff" opacity=".18" transform="rotate(-30 150 140)"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
