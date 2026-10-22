import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, ShoppingBag, Store } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import giftbox from "@/assets/home/banner-giftbox.jpg";
import giftboxDark from "@/assets/home/banner-giftbox1.png";
import becomeSeller from "@/assets/home/banner-become-a-seller.webp";
import toProducts from "@/assets/home/banner-to-products.webp";

// Ảnh nền mờ nhẹ; khi rê chuột vào thì mờ thêm và phóng nhẹ để chữ nổi rõ hơn.
function TileImage({ src, restOpacity }: { src: string; restOpacity: string }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      className={`absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-[0.12] ${restOpacity}`}
    />
  );
}

const TILE = "group relative flex overflow-hidden rounded-[var(--radius-card)] shadow-md h-[220px] lg:h-auto";

interface LightTileProps {
  to: string;
  image: string;
  icon: ReactNode;
  title: string;
  description: string;
  cta: string;
  /** "light": nền kem, chữ đỏ đậm. "red": cùng bố cục nhưng nền đỏ chủ đạo, chữ sáng. */
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

// Hai ô giữa dùng chung bố cục này: ảnh nền mờ, chữ nằm dưới trái, icon chỉ hiện khi rê chuột.
function LightTile({ to, image, icon, title, description, cta, tone = "light" }: LightTileProps) {
  const t = TONE[tone];
  return (
    <Link to={to} className={`${TILE} flex-col justify-end bg-gradient-to-br ${t.surface} p-6`}>
      <TileImage src={image} restOpacity={t.imageOpacity} />
      <div className={`absolute inset-0 bg-gradient-to-t ${t.wash}`} />
      {/* Icon nằm trong chip trắng để nổi rõ trên ảnh nền */}
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

// Hai ô giữa phụ thuộc vai trò: chủ gian hàng vào trang quản lý, còn khách và User vào danh sách sản phẩm.
export function FeatureTiles() {
  const { role } = useAuth();
  const isSeller = role === "organizer" || role === "manager";

  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-[240px_230px]">
      {/* Ô lớn: đi tới trang chọn bánh và hộp bánh Trung thu */}
      <Link
        to="/banh-trung-thu"
        className={`${TILE} flex-col justify-end bg-gradient-to-br from-[#2b1214] via-[#4a1a1d] to-[#7a1418] p-6 text-white lg:col-span-2`}
      >
        <TileImage src={giftbox} restOpacity="opacity-45" />
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

      {/* Ô cao bên phải: sản phẩm mới ra mắt */}
      <Link
        to="/san-pham"
        className={`${TILE} flex-col justify-between bg-gradient-to-b from-primary-soft to-cream-dark p-5 lg:row-span-2`}
      >
        <TileImage src={giftboxDark} restOpacity="opacity-40" />
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

      <LightTile
        to={isSeller ? "/quan-ly-cua-hang" : "/san-pham"}
        image={becomeSeller}
        icon={<Store size={28} strokeWidth={1.75} />}
        title={isSeller ? "Quản Lý Cửa Hàng" : "Trở thành đối tác"}
        description={isSeller ? "Sản phẩm, hộp combo, voucher của bạn" : "Khám phá bánh từ nhiều gian hàng uy tín"}
        cta={isSeller ? "Vào trang quản lý" : "Xem sản phẩm"}
      />

      <LightTile
        tone="red"
        to={isSeller ? "/quan-ly-cua-hang" : "/san-pham"}
        image={toProducts}
        icon={isSeller ? <BarChart3 size={28} strokeWidth={1.75} /> : <ShoppingBag size={28} strokeWidth={1.75} />}
        title={isSeller ? "Đơn Hàng Và Hoa Hồng" : "Mua Sắm Ngay"}
        description={
          isSeller
            ? "Theo dõi đơn hàng, xử lý nhanh và xem hoa hồng sàn."
            : "Tìm bánh theo vị, giá và gian hàng. Áp voucher khi thanh toán."
        }
        cta={isSeller ? "Bắt đầu" : "Xem danh sách"}
      />
    </div>
  );
}
