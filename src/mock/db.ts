// In-memory seed data for `pnpm dev:mock`. Everything resets on page reload.
// Sign in with any of the accounts below; every mock password is "mooncake123".
import type { ApiUserRole, CurrentUser } from "@/lib/authApi";
import type { BoxItem } from "@/lib/boxApi";
import type { Cart } from "@/lib/cartApi";
import type { Category, Filling, Product } from "@/lib/catalog";
import type { Feedback } from "@/lib/feedbackApi";
import type { AppNotification } from "@/lib/notificationApi";
import type { Order } from "@/lib/orderApi";
import type { Organizer, OrganizerRegistration, Stall, StallRental } from "@/lib/organizerApi";
import { BOX_IMAGES, cakeImage, type CakeLookName } from "./images";

export const MOCK_PASSWORD = "mooncake123";

const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();
const date = (n: number) => days(n).slice(0, 10);

type MockUser = CurrentUser & { organizerId?: string };

const user = (id: string, email: string, fullName: string, role: ApiUserRole, extra: Partial<MockUser> = {}): MockUser => ({
  id,
  email,
  fullName,
  phone: "0900000000",
  address: "12 Hàng Mã, Hoàn Kiếm, Hà Nội",
  role,
  status: "Active",
  isEmailVerified: true,
  createdAt: days(-60),
  ...extra,
});

const users: MockUser[] = [
  user("u-buyer", "khach@mooncake.test", "Nguyễn Thu", "User"),
  user("u-buyer2", "minh@mooncake.test", "Trần Minh", "User", { phone: "0911111111", address: "45 Lê Lợi, Quận 1, TP.HCM" }),
  user("u-org1", "tramram@mooncake.test", "Lê Hằng", "Organization", { organizerId: "o1" }),
  user("u-org2", "huongnguyet@mooncake.test", "Phạm Nguyệt", "Organization", { organizerId: "o2" }),
  user("u-org3", "hathanh@mooncake.test", "Đỗ Thành", "Organization", { organizerId: "o3" }),
  user("u-admin", "admin@mooncake.test", "Quản trị MoonCake", "Manager"),
];

const organizer = (id: string, userId: string, brandName: string, businessInfo: string): Organizer => {
  const u = users.find((x) => x.id === userId)!;
  return {
    id,
    userFullName: u.fullName,
    userEmail: u.email,
    brandName,
    contactPhone: u.phone,
    contactEmail: u.email,
    businessInfo,
    status: "Active",
    approvedAt: days(-45),
    createdAt: days(-50),
  };
};

const organizers: Organizer[] = [
  organizer("o1", "u-org1", "Tiệm Trăng Rằm", "Bánh nướng, bánh dẻo thủ công từ năm 1998."),
  organizer("o2", "u-org2", "Hương Nguyệt", "Bánh Trung thu ít đường, nguyên liệu hữu cơ."),
  organizer("o3", "u-org3", "Bánh Cổ Truyền Hà Thành", "Hương vị Hà Nội xưa, bánh chay và bánh lạnh."),
];

const stall = (id: string, code: string, name: string, location: string, rentalPrice: number, rented: boolean): Stall => ({
  id,
  code,
  name,
  location,
  rentalPrice,
  description: "Gian 3x3m, có điện, bàn trưng bày và mái che.",
  status: rented ? "Rented" : "Available",
  createdAt: days(-90),
});

const stalls: Stall[] = [
  stall("s1", "A-01", "Cổng chính", "Khu A · cạnh cổng vào", 12_000_000, true),
  stall("s2", "A-02", "Cổng chính phải", "Khu A · bên phải cổng", 11_000_000, false),
  stall("s3", "B-03", "Khu ẩm thực", "Khu B · giữa sân", 9_500_000, true),
  stall("s4", "B-04", "Khu ẩm thực 2", "Khu B · gần quầy nước", 9_000_000, false),
  stall("s5", "C-01", "Sân khấu", "Khu C · gần sân khấu", 10_500_000, true),
  stall("s6", "C-02", "Lối ra", "Khu C · cạnh lối ra", 8_000_000, false),
];

const rental = (id: string, s: Stall, o: Organizer, start: number, end: number): StallRental => ({
  id,
  stallId: s.id,
  stallCode: s.code,
  stallName: s.name,
  stallLocation: s.location,
  rentalPrice: s.rentalPrice,
  organizerId: o.id,
  organizerBrandName: o.brandName,
  organizerUserFullName: o.userFullName ?? "",
  organizerUserEmail: o.userEmail ?? "",
  startDate: date(start),
  endDate: date(end),
  status: "Active",
  createdAt: days(start - 5),
});

const rentals: StallRental[] = [
  rental("r1", stalls[0], organizers[0], -20, 25),
  rental("r2", stalls[2], organizers[0], -20, 25),
  rental("r3", stalls[4], organizers[1], -10, 30),
];

const registrations: OrganizerRegistration[] = [
  {
    id: "reg1",
    userFullName: "Trần Minh",
    userEmail: "minh@mooncake.test",
    type: "Stall",
    stallId: "s2",
    stallCode: "A-02",
    stallName: "Cổng chính phải",
    brandName: "Bánh Nhà Minh",
    contactPhone: "0911111111",
    businessInfo: "Bánh nướng gia truyền 3 đời.",
    startDate: date(3),
    endDate: date(30),
    status: "Pending",
    createdAt: days(-1),
  },
  {
    id: "reg2",
    userFullName: "Phạm Nguyệt",
    userEmail: "huongnguyet@mooncake.test",
    type: "Online",
    organizerId: "o2",
    brandName: "Hương Nguyệt",
    contactPhone: "0900000000",
    businessInfo: "Bán online toàn quốc.",
    commissionRate: 8,
    status: "Approved",
    reviewedAt: days(-40),
    confirmedAt: days(-39),
    createdAt: days(-42),
  },
];

const ownedCategories = (o: Organizer, names: string[]): Category[] =>
  names.map((name, i) => ({ id: `${o.id}-c${i + 1}`, organizerId: o.id, organizerBrandName: o.brandName, name }));
const ownedFillings = (o: Organizer, names: string[]): Array<Filling & { organizerId: string }> =>
  names.map((name, i) => ({ id: `${o.id}-f${i + 1}`, organizerId: o.id, name }));

const categories: Category[] = [
  ...ownedCategories(organizers[0], ["Bánh nướng", "Bánh dẻo"]),
  ...ownedCategories(organizers[1], ["Bánh nướng", "Ít đường", "Bánh dẻo"]),
  ...ownedCategories(organizers[2], ["Bánh chay", "Bánh lạnh", "Bánh nướng"]),
];
const fillings: Array<Filling & { organizerId: string }> = [
  ...ownedFillings(organizers[0], ["Đậu xanh", "Thập cẩm", "Trứng muối", "Sen nhuyễn"]),
  ...ownedFillings(organizers[1], ["Hạt sen", "Khoai môn", "Trà xanh", "Dừa"]),
  ...ownedFillings(organizers[2], ["Đậu đỏ", "Sầu riêng", "Đậu xanh", "Matcha"]),
];

const pick = <T extends { id: string }>(list: T[], ids: string[]) => list.filter((x) => ids.includes(x.id));

let seq = 0;
const product = (
  o: Organizer,
  name: string,
  price: number,
  look: CakeLookName,
  categoryIds: string[],
  fillingIds: string[],
  extra: Partial<Product> = {},
): Product => ({
  id: `p${++seq}`,
  organizerId: o.id,
  organizerBrandName: o.brandName,
  name,
  description: `${name} của ${o.brandName}, làm thủ công trong ngày, đóng hộp giấy kraft.`,
  imageUrl: cakeImage(look),
  stallIds: [],
  price,
  stockQuantity: 40,
  status: "Active",
  categories: pick(categories, categoryIds).map(({ id, name: n }) => ({ id, name: n })),
  fillings: pick(fillings, fillingIds).map(({ id, name: n }) => ({ id, name: n })),
  createdAt: days(-seq),
  ...extra,
});

const [o1, o2, o3] = organizers;
const products: Product[] = [
  product(o1, "Bánh nướng trứng muối", 65_000, "baked", ["o1-c1"], ["o1-f3", "o1-f1"], { stallIds: ["s1"] }),
  product(o1, "Bánh nướng thập cẩm", 70_000, "bakedDark", ["o1-c1"], ["o1-f2"], { stallIds: ["s1", "s3"] }),
  product(o1, "Bánh dẻo lá dứa", 55_000, "pandan", ["o1-c2"], ["o1-f4", "o1-f1"], { stallIds: ["s1", "s3"], stockQuantity: 12 }),
  product(o1, "Bánh dẻo sen nhuyễn", 55_000, "snow", ["o1-c2"], ["o1-f4"]),
  product(o2, "Bánh nướng hạt sen ít đường", 72_000, "baked", ["o2-c1", "o2-c2"], ["o2-f1"]),
  product(o2, "Bánh dẻo khoai môn", 58_000, "taro", ["o2-c3"], ["o2-f2", "o2-f4"], { stallIds: ["s5"] }),
  product(o2, "Bánh nướng trà xanh", 68_000, "matcha", ["o2-c1"], ["o2-f3"]),
  product(o2, "Bánh dẻo hoa hồng", 60_000, "rose", ["o2-c3", "o2-c2"], ["o2-f4"], { status: "OutOfStock", stockQuantity: 0 }),
  product(o3, "Bánh chay đậu đỏ", 50_000, "snow", ["o3-c1"], ["o3-f1", "o3-f3"]),
  product(o3, "Bánh lạnh sầu riêng", 85_000, "rose", ["o3-c2"], ["o3-f2"]),
  product(o3, "Bánh nướng than tre", 75_000, "charcoal", ["o3-c3"], ["o3-f3", "o3-f4"]),
  product(o3, "Bánh lạnh matcha", 80_000, "matcha", ["o3-c2"], ["o3-f4"], { status: "Draft" }),
];

const boxProducts = (ids: string[]) =>
  products
    .filter((p) => ids.includes(p.id))
    .map(({ id, name, imageUrl, status, categories: c, fillings: f }) => ({ id, name, imageUrl, status, categories: c, fillings: f }));

const box = (
  id: string,
  o: Organizer,
  name: string,
  capacity: number,
  price: number,
  productIds: string[],
  image: number,
  stallIds: string[] = [],
): BoxItem => ({
  id,
  stallIds,
  organizerId: o.id,
  organizerBrandName: o.brandName,
  name,
  description: `Hộp quà ${capacity} bánh, bạn tự chọn loại bánh và nhân khi đặt hàng.`,
  imageUrl: BOX_IMAGES[image],
  capacity,
  price,
  status: "Active",
  products: boxProducts(productIds),
  createdAt: days(-3),
});

const boxes: BoxItem[] = [
  box("b1", o1, "Hộp Trăng Vàng", 4, 320_000, ["p1", "p2", "p3"], 0, ["s1"]),
  box("b2", o1, "Hộp Sum Vầy", 6, 450_000, ["p1", "p2", "p3", "p4"], 1),
  box("b3", o2, "Hộp Nguyệt Quế", 2, 150_000, ["p5", "p6", "p7"], 2),
  box("b4", o3, "Hộp Đoàn Viên", 4, 300_000, ["p9", "p10", "p11"], 3),
];

const orders: Order[] = [
  {
    id: "or1",
    orderCode: "MC-1024",
    stallId: "s1",
    organizerId: "o1",
    organizerBrandName: o1.brandName,
    receiverName: "Nguyễn Thu",
    receiverPhone: "0900000000",
    shippingAddress: "12 Hàng Mã, Hoàn Kiếm, Hà Nội",
    note: "Giao buổi sáng",
    subtotalAmount: 430_000,
    platformDiscount: 0,
    organizerDiscount: 20_000,
    totalAmount: 410_000,
    status: "Pending",
    items: [
      { id: "oi1", itemType: "Product", productId: "p3", categoryName: "Bánh dẻo", fillingName: "Sen nhuyễn", name: "Bánh dẻo lá dứa", imageUrl: products[2].imageUrl, quantity: 2, unitPrice: 55_000, subtotal: 110_000, boxSelections: [] },
      {
        id: "oi2", itemType: "Box", boxItemId: "b1", name: "Hộp Trăng Vàng", imageUrl: boxes[0].imageUrl, quantity: 1, unitPrice: 320_000, subtotal: 320_000,
        boxSelections: [
          { productId: "p1", productName: "Bánh nướng trứng muối", categoryId: "o1-c1", categoryName: "Bánh nướng", fillingId: "o1-f3", fillingName: "Trứng muối", quantity: 3 },
          { productId: "p3", productName: "Bánh dẻo lá dứa", categoryId: "o1-c2", categoryName: "Bánh dẻo", fillingId: "o1-f4", fillingName: "Sen nhuyễn", quantity: 1 },
        ],
      },
    ],
    createdAt: days(-1),
  },
  {
    id: "or2",
    orderCode: "MC-1019",
    stallId: null,
    organizerId: "o2",
    organizerBrandName: o2.brandName,
    receiverName: "Nguyễn Thu",
    receiverPhone: "0900000000",
    shippingAddress: "12 Hàng Mã, Hoàn Kiếm, Hà Nội",
    subtotalAmount: 216_000,
    platformDiscount: 0,
    organizerDiscount: 0,
    totalAmount: 216_000,
    status: "Delivered",
    confirmedAt: days(-6),
    deliveredAt: days(-4),
    items: [
      { id: "oi3", itemType: "Product", productId: "p5", categoryName: "Ít đường", fillingName: "Hạt sen", name: "Bánh nướng hạt sen ít đường", imageUrl: products[4].imageUrl, quantity: 3, unitPrice: 72_000, subtotal: 216_000, boxSelections: [] },
    ],
    createdAt: days(-7),
  },
  {
    id: "or3",
    orderCode: "MC-1002",
    stallId: null,
    organizerId: "o1",
    organizerBrandName: o1.brandName,
    receiverName: "Nguyễn Thu",
    receiverPhone: "0900000000",
    shippingAddress: "12 Hàng Mã, Hoàn Kiếm, Hà Nội",
    subtotalAmount: 65_000,
    platformDiscount: 0,
    organizerDiscount: 0,
    totalAmount: 65_000,
    status: "Cancelled",
    cancelledAt: days(-12),
    cancelReason: "Đặt nhầm nhân bánh",
    items: [
      { id: "oi4", itemType: "Product", productId: "p1", categoryName: "Bánh nướng", fillingName: "Đậu xanh", name: "Bánh nướng trứng muối", imageUrl: products[0].imageUrl, quantity: 1, unitPrice: 65_000, subtotal: 65_000, boxSelections: [] },
    ],
    createdAt: days(-13),
  },
];

// Order owners, kept apart because the Order DTO does not expose them
const orderOwners: Record<string, string> = { or1: "u-buyer", or2: "u-buyer", or3: "u-buyer" };

const feedbacks: Feedback[] = [
  { id: "fb1", orderItemId: "oi3", userName: "Nguyễn Thu", organizerBrandName: o2.brandName, productId: "p5", productName: "Bánh nướng hạt sen ít đường", rating: 5, comment: "Ngọt vừa, vỏ thơm, giao nhanh.", status: "Visible", imageUrls: [], createdAt: days(-3) },
  { id: "fb2", orderItemId: "x1", userName: "Trần Minh", organizerBrandName: o1.brandName, productId: "p1", productName: "Bánh nướng trứng muối", rating: 4, comment: "Trứng muối béo, hơi ngọt với mình.", replyContent: "Cảm ơn bạn, tiệm có bản ít đường nhé!", repliedAt: days(-2), status: "Visible", imageUrls: [products[0].imageUrl!], createdAt: days(-5) },
  { id: "fb3", orderItemId: "x2", userName: "Lê Mai", organizerBrandName: o1.brandName, boxItemId: "b1", boxItemName: "Hộp Trăng Vàng", rating: 5, comment: "Hộp đẹp, biếu sếp rất ổn.", status: "Visible", imageUrls: [boxes[0].imageUrl!], createdAt: days(-4) },
];

const notification = (id: string, userId: string, title: string, content: string, ago: number, isRead = false) => ({
  userId,
  value: { id, type: "Order", title, content, isRead, createdAt: days(-ago) } satisfies AppNotification,
});

const notifications = [
  notification("n1", "u-buyer", "Đơn #MC-1024 đang chờ xác nhận", "Tiệm Trăng Rằm sẽ xác nhận đơn sớm.", 0.02),
  notification("n2", "u-buyer", "Đơn #MC-1019 đã giao", "Hãy đánh giá sản phẩm để nhận ưu đãi lần sau.", 4, true),
  notification("n3", "u-org1", "Đơn mới #MC-1024", "Nguyễn Thu vừa đặt 2 bánh lẻ và 1 hộp combo.", 1),
  notification("n4", "u-admin", "Đơn đăng ký mới", "Bánh Nhà Minh muốn thuê gian A-02.", 1),
];

const emptyCart = (userId: string): Cart & { userId: string } => ({ id: `cart-${userId}`, userId, groups: [], totalAmount: 0, totalItemCount: 0 });

// The buyer starts with a few lines so the cart and checkout have something to show.
const cartLines: Record<string, Array<{ id: string; kind: "Product" | "Box"; refId: string; stallId: string | null }>> = {
  "u-buyer": [
    { id: "ci1", kind: "Product", refId: "p5", stallId: null },
    { id: "ci2", kind: "Box", refId: "b1", stallId: "s1" },
    { id: "ci3", kind: "Product", refId: "p3", stallId: "s1" },
  ],
};

export const db = {
  users,
  organizers,
  stalls,
  rentals,
  registrations,
  categories,
  fillings,
  products,
  boxes,
  orders,
  orderOwners,
  feedbacks,
  notifications,
  cartLines,
  emptyCart,
  nextId: (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`,
};

export type MockDb = typeof db;
export type { MockUser };
