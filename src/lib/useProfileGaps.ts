import { useAuth } from "@/context/AuthContext";

// The order takes the receiver from the profile, so these fields must be filled before buying.
export function useProfileGaps(): string[] {
  const { user } = useAuth();
  if (!user) return [];
  return [
    !user.fullName?.trim() && "họ tên",
    !user.phone?.trim() && "số điện thoại",
    !user.address?.trim() && "địa chỉ",
  ].filter(Boolean) as string[];
}
