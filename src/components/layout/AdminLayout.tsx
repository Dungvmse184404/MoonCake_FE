import { ClipboardCheck, FileText, Store, UserCog, Users } from "lucide-react";
import { SideNavLayout, type SideNavItem } from "./SideNavLayout";

const ITEMS: SideNavItem[] = [
  { name: "Đơn đăng ký", path: "/admin/registrations", icon: ClipboardCheck },
  { name: "Gian hàng", path: "/admin/stalls", icon: Store },
  { name: "Organizer", path: "/admin/organizers", icon: Users },
  { name: "Người dùng", path: "/admin/users", icon: UserCog },
  { name: "Hợp đồng thuê", path: "/admin/rentals", icon: FileText },
];

export function AdminLayout() {
  return <SideNavLayout title="Quản trị sàn" items={ITEMS} />;
}
