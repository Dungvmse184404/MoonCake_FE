// Dữ liệu mẫu cho trang chủ; sẽ thay bằng API của MoonCake_BE.
export interface Banner {
  id: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  store: string;
  gradient: string;
}

export const banners: Banner[] = [
  {
    id: "b1",
    badge: "GIAN HÀNG NỔI BẬT",
    title: "Bánh Nướng Truyền Thống",
    highlight: "GIẢM 20%",
    description: "Nhân thập cẩm, trứng muối, đậu xanh",
    store: "Gian hàng Hương Nguyệt",
    gradient: "from-[#7a1418] via-[#a91e22] to-[#c9602a]",
  },
  {
    id: "b2",
    badge: "HỘP QUÀ TRUNG THU",
    title: "Hộp Quà Cao Cấp",
    highlight: "TỰ CHỌN VỊ",
    description: "Chọn bánh yêu thích cho từng hộp 4 hoặc 6 bánh",
    store: "Gian hàng Trăng Vàng",
    gradient: "from-[#5c1013] via-[#8f1a1f] to-[#b3781c]",
  },
  {
    id: "b3",
    badge: "MỚI KHAI TRƯƠNG",
    title: "Bánh Dẻo Nhân Sen",
    highlight: "MIỄN PHÍ GIAO",
    description: "Thanh mát, ít ngọt, hợp người ăn kiêng",
    store: "Gian hàng Sen Việt",
    gradient: "from-[#8a1a1f] via-[#a91e22] to-[#d4a72c]",
  },
];

export const categories = [
  { id: "nuong", name: "Bánh nướng" },
  { id: "deo", name: "Bánh dẻo" },
  { id: "hop-qua", name: "Hộp quà" },
  { id: "chay", name: "Bánh chay" },
  { id: "mini", name: "Bánh mini" },
  { id: "combo", name: "Combo tự chọn" },
];

export const featuredStores = [
  { id: "s1", name: "Hương Nguyệt", location: "Gian A-01", rating: 4.9, products: 24 },
  { id: "s2", name: "Trăng Vàng", location: "Gian A-05", rating: 4.8, products: 18 },
  { id: "s3", name: "Sen Việt", location: "Gian B-02", rating: 4.7, products: 15 },
  { id: "s4", name: "Bánh Quê Nhà", location: "Online", rating: 4.8, products: 12 },
];

export const featuredProducts = [
  { id: "p1", name: "Bánh nướng thập cẩm", store: "Hương Nguyệt", price: 85000 },
  { id: "p2", name: "Bánh dẻo nhân sen", store: "Sen Việt", price: 65000 },
  { id: "p3", name: "Hộp quà Trăng Vàng (4 bánh)", store: "Trăng Vàng", price: 320000 },
  { id: "p4", name: "Bánh nướng trứng muối", store: "Bánh Quê Nhà", price: 90000 },
];

export const formatVnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
