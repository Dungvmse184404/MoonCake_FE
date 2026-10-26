import type { OrderLine } from "./orderApi";

// What the checkout page needs for one line: the order data plus what to show
export interface CheckoutItem {
  key: string;
  line: OrderLine;
  name: string;
  imageUrl?: string | null;
  kind: "product" | "box";
  detail: string;
  unitPrice: number;
  quantity: number;
  organizerId: string;
  brandName: string;
  stallId: string | null;
  // Set when the line comes from the cart, so it can leave the cart once ordered
  cartItemId?: string;
}

// Kept in sessionStorage so a reload of the checkout page does not lose the selection
const STORAGE_KEY = "mooncake.checkout";

export function saveCheckout(items: CheckoutItem[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage blocked: the page still works until it is reloaded
  }
}

export function loadCheckout(): CheckoutItem[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearCheckout() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// The backend has no payment API yet: only cash on delivery can be used, the rest are shown as coming soon
export const PAYMENT_METHODS = [
  { value: "cod", label: "Thanh toán khi nhận hàng (COD)", desc: "Trả tiền mặt khi nhận bánh.", available: true },
  { value: "bank", label: "Chuyển khoản ngân hàng (VietQR)", desc: "Quét mã QR để chuyển khoản.", available: false },
  { value: "momo", label: "Ví MoMo", desc: "Thanh toán qua ví điện tử MoMo.", available: false },
  { value: "vnpay", label: "VNPay", desc: "Thẻ ATM, thẻ quốc tế, QR ngân hàng.", available: false },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];
