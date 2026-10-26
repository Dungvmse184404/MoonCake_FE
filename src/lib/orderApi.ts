import { request } from "./api";
import type { BoxSelectionItem, BoxSelectionPayload, OrderItemType } from "./cartApi";
import type { Paged } from "./organizerApi";

export type OrderStatus = "Pending" | "Confirmed" | "Delivering" | "Delivered" | "Cancelled";

export interface OrderItem {
  id: string;
  itemType: OrderItemType;
  productId?: string | null;
  boxItemId?: string | null;
  categoryName?: string | null;
  fillingName?: string | null;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  boxSelections: BoxSelectionItem[];
}

export interface Order {
  id: string;
  orderCode: string;
  stallId?: string | null;
  organizerId: string;
  organizerBrandName: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  note?: string | null;
  subtotalAmount: number;
  platformDiscount: number;
  organizerDiscount: number;
  totalAmount: number;
  status: OrderStatus;
  confirmedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  items: OrderItem[];
  createdAt: string;
}

// One line of a direct order: a product (category, filling, quantity) or a box (its cakes). Orders are split by
// organizer and stall on the server.
export type OrderLine =
  | {
      itemType: "Product";
      productId: string;
      stallId?: string | null;
      categoryId: string;
      fillingId: string;
      quantity: number;
    }
  | {
      itemType: "Box";
      boxItemId: string;
      stallId?: string | null;
      selections: BoxSelectionPayload[];
    };

type ListParams = {
  status?: OrderStatus;
  search?: string;
  page?: number;
  pageSize?: number;
};

export const orderApi = {
  myOrders: async (params: ListParams) => {
    const { data } = await request<Paged<Order>>("/orders/me", { auth: true, query: params });
    return data!;
  },

  // Orders of the current organizer's own shop (Organization role)
  organizerOrders: async (params: ListParams) => {
    const { data } = await request<Paged<Order>>("/orders/organizer/me", { auth: true, query: params });
    return data!;
  },

  get: async (id: string) => {
    const { data } = await request<Order>(`/orders/${id}`, { auth: true });
    return data!;
  },

  // Orders straight from products and boxes; one order per organizer and stall comes back
  create: async (items: OrderLine[], note: string) => {
    const { data } = await request<Order[]>("/orders", {
      method: "POST",
      body: { note: note || null, items },
      auth: true,
    });
    return data ?? [];
  },

  confirm: async (id: string) => (await request<Order>(`/orders/${id}/confirm`, { method: "POST", auth: true })).data!,

  cancel: async (id: string, reason: string) =>
    (await request<Order>(`/orders/${id}/cancel`, { method: "POST", body: { reason }, auth: true })).data!,
};
