import type { ProductStatus } from "./catalog";
import type { OrganizerStatus, RentalStatus, RegistrationStatus, RegistrationType, StallStatus } from "./organizerApi";

export const REGISTRATION_TYPE_LABEL: Record<RegistrationType, string> = {
  Stall: "Thuê gian hàng",
  Online: "Bán online",
};

export const REGISTRATION_STATUS_LABEL: Record<RegistrationStatus, string> = {
  Pending: "Chờ duyệt",
  AwaitingConfirmation: "Chờ bạn xác nhận",
  Approved: "Đã có hiệu lực",
  Rejected: "Bị từ chối",
  Cancelled: "Đã hủy",
};

export const STALL_STATUS_LABEL: Record<StallStatus, string> = {
  Available: "Còn trống",
  Rented: "Đã có người thuê",
};

export const ORGANIZER_STATUS_LABEL: Record<OrganizerStatus, string> = {
  Active: "Đang hoạt động",
  Suspended: "Bị đình chỉ",
};

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  Draft: "Bản nháp",
  Active: "Đang bán",
  OutOfStock: "Hết hàng",
  Inactive: "Ngừng bán",
};

export const PRODUCT_STATUS_TONE: Record<ProductStatus, Tone> = {
  Draft: "neutral",
  Active: "success",
  OutOfStock: "warning",
  Inactive: "danger",
};

export const RENTAL_STATUS_LABEL: Record<RentalStatus, string> = {
  Confirmed: "Sắp bắt đầu",
  Active: "Đang thuê",
  Expired: "Đã hết hạn",
  Terminated: "Đã chấm dứt",
};

export const RENTAL_STATUS_TONE: Record<RentalStatus, Tone> = {
  Confirmed: "info",
  Active: "success",
  Expired: "neutral",
  Terminated: "danger",
};

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const REGISTRATION_STATUS_TONE: Record<RegistrationStatus, Tone> = {
  Pending: "info",
  AwaitingConfirmation: "warning",
  Approved: "success",
  Rejected: "danger",
  Cancelled: "neutral",
};

export function formatDate(value?: string | null): string {
  if (!value) return "";
  const d = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
}

export const formatVnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
