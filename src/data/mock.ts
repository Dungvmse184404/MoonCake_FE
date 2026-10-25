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
