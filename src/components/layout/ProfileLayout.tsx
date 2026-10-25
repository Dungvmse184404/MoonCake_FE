import { Bell, ClipboardList, Package, UserRound } from "lucide-react";
import { SideNavLayout, type SideNavItem } from "./SideNavLayout";

const ITEMS: SideNavItem[] = [
  { name: "Thông tin cá nhân", path: "/account/profile", icon: UserRound },
  { name: "Đơn đăng ký đối tác", path: "/account/registrations", icon: ClipboardList },
  { name: "Đơn hàng của tôi", icon: Package },
  { name: "Thông báo", path: "/account/notifications", icon: Bell },
];

export function ProfileLayout() {
  return <SideNavLayout title="Tài khoản" items={ITEMS} />;
}
