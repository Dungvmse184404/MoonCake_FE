import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, ClipboardCheck, ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { StorageImage } from "@/components/ui/StorageImage";
import { useAuth } from "@/context/AuthContext";
import giftbox from "@/assets/home/banner-giftbox.jpg";
import giftboxDark from "@/assets/home/banner-giftbox1.png";
import becomeSeller from "@/assets/home/banner-become-a-seller.webp";
import toProducts from "@/assets/home/banner-to-products.webp";

function TileImage({ image, restOpacity }: { image: TileImageSource; restOpacity: string }) {
  return (
    <StorageImage
      path={image.path}
      fallback={image.fallback}
      aria-hidden
      loading="lazy"
      className={`absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-[0.12] ${restOpacity}`}
    />
  );
}

interface TileImageSource {
  path: string;
  fallback: string;
}

const IMAGES = {
  giftbox: { path: "home-page/banner-giftbox.jpg", fallback: giftbox },
  giftboxDark: { path: "home-page/banner-giftbox1.png", fallback: giftboxDark },
  becomeSeller: { path: "home-page/banner-become-a-seller.webp", fallback: becomeSeller },
  toProducts: { path: "home-page/banner-to-products.webp", fallback: toProducts },
} satisfies Record<string, TileImageSource>;

const TILE = "group relative flex overflow-hidden rounded-[var(--radius-card)] shadow-md h-[220px] lg:h-auto";

interface LightTileProps {
  to: string;
  image: TileImageSource;
  icon: ReactNode;
  title: string;
  description: string;
  cta: string;
  tone?: "light" | "red";
}

const TONE = {
  light: {
    surface: "from-cream-dark to-primary-soft",
    imageOpacity: "opacity-35",
    wash: "from-cream-dark/90 via-cream-dark/30 to-transparent",
    title: "text-primary-dark",
    description: "text-ink-soft",
    cta: "text-primary",
  },
  red: {
    surface: "from-primary to-primary-dark",
    imageOpacity: "opacity-30",
    wash: "from-primary-dark/90 via-primary-dark/40 to-transparent",
    title: "text-white",
    description: "text-white/85",
    cta: "text-primary-soft",
  },
} as const;

function LightTile({ to, image, icon, title, description, cta, tone = "light" }: LightTileProps) {
  const t = TONE[tone];
  return (
    <Link to={to} className={`${TILE} flex-col justify-end bg-gradient-to-br ${t.surface} p-6`}>
      <TileImage image={image} restOpacity={t.imageOpacity} />
      <div className={`absolute inset-0 bg-gradient-to-t ${t.wash}`} />
      <span
        aria-hidden
        className="absolute right-6 top-6 grid size-14 scale-90 place-items-center rounded-full bg-white/90 text-primary opacity-0 shadow-md transition duration-300 group-hover:scale-100 group-hover:opacity-100"
      >
        {icon}
      </span>
      <div className="relative">
        <h3 className={`font-serif text-xl font-black ${t.title}`}>{title}</h3>
        <p className={`mt-1 text-sm ${t.description}`}>{description}</p>
        <span className={`mt-3 flex items-center gap-1 text-sm font-semibold transition-all group-hover:gap-2 ${t.cta}`}>
          {cta} <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

export function FeatureTiles() {
  const { role } = useAuth();
  const isSeller = role === "organizer";
  const isManager = role === "manager";
  const iconProps = { size: 28, strokeWidth: 1.75 };

  const first = isManager
    ? { to: "/admin", icon: <ShieldCheck {...iconProps} />, title: "Quản Trị Sàn", description: "Duyệt đơn, gian hàng và Organizer", cta: "Vào trang quản trị" }
    : isSeller
      ? { to: "/store", icon: <Store {...iconProps} />, title: "Quản Lý Cửa Hàng", description: "Sản phẩm, hợp đồng thuê, hồ sơ của bạn", cta: "Vào trang quản lý" }
      : { to: "/become-partner", icon: <Store {...iconProps} />, title: "Trở thành đối tác", description: "Thuê gian hàng hoặc bán online cùng MoonCake", cta: "Đăng ký ngay" };

  const second = isManager
    ? { to: "/admin", icon: <ClipboardCheck {...iconProps} />, title: "Đơn Chờ Duyệt", description: "Xem và xử lý đơn đăng ký đối tác.", cta: "Xem đơn" }
    : isSeller
      ? { to: "/store/products", icon: <BarChart3 {...iconProps} />, title: "Sản Phẩm Của Bạn", description: "Thêm, sửa và quản lý tồn kho sản phẩm.", cta: "Quản lý sản phẩm" }
      : { to: "/products", icon: <ShoppingBag {...iconProps} />, title: "Mua Sắm Ngay", description: "Tìm bánh theo vị, giá và gian hàng. Áp voucher khi thanh toán.", cta: "Xem danh sách" };

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-[240px_230px]">
      <Link
        to="/cake-sets"
        className={`${TILE} flex-col justify-end bg-gradient-to-br from-[#2b1214] via-[#4a1a1d] to-[#7a1418] p-6 text-white lg:col-span-2`}
      >
        <TileImage image={IMAGES.giftbox} restOpacity="opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2b1214]/85 via-[#2b1214]/25 to-transparent" />
        <div className="relative">
          <h3 className="font-serif text-2xl font-black">Bộ Sưu Tập Trung Thu</h3>
          <p className="mt-2 max-w-lg text-sm text-white/85">
            Chọn từng chiếc bánh nướng, bánh dẻo hoặc tự phối hộp quà theo khẩu vị của gia đình bạn.
          </p>
          <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-semibold text-primary-dark transition-all group-hover:gap-3">
            Chọn bánh và hộp bánh <ArrowRight size={16} />
          </span>
        </div>
      </Link>

      <Link
        to="/products"
        className={`${TILE} flex-col justify-between bg-gradient-to-b from-primary-soft to-cream-dark p-5 lg:row-span-2`}
      >
        <TileImage image={IMAGES.giftboxDark} restOpacity="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-soft/95 via-primary-soft/20 to-transparent" />
        <span className="relative w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
          Mới ra mắt
        </span>
        <div className="relative">
          <h3 className="font-serif text-xl font-black text-primary-dark">Hộp quà Trung thu mới</h3>
          <p className="mt-1 text-sm text-ink-soft">Những bộ quà tặng vừa lên kệ mùa này.</p>
          <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-2">
            Xem ngay <ArrowRight size={14} />
          </span>
        </div>
      </Link>

      <LightTile {...first} image={IMAGES.becomeSeller} />
      <LightTile {...second} image={IMAGES.toProducts} tone="red" />
    </div>
  );
}
