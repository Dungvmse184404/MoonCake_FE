import { BarChart3, Boxes, FileText, Gift, LayoutDashboard, Package, Store, Tags, Ticket } from "lucide-react";
import { SideNavLayout, type SideNavItem } from "./SideNavLayout";

const ITEMS: SideNavItem[] = [
  { name: "Tổng quan", path: "/store", icon: LayoutDashboard, end: true },
  { name: "Hồ sơ thương hiệu", path: "/store/profile", icon: Store },
  { name: "Hợp đồng thuê", path: "/store/rentals", icon: FileText },
  { name: "Sản phẩm", path: "/store/products", icon: Package },
  { name: "Danh mục & nhân bánh", path: "/store/catalog", icon: Tags },
  { name: "Hộp combo", icon: Gift },
  { name: "Voucher", icon: Ticket },
  { name: "Đơn hàng", icon: Boxes },
  { name: "Hoa hồng", icon: BarChart3 },
];

export function StoreLayout() {
  return <SideNavLayout title="Quản lý cửa hàng" items={ITEMS} />;
}
