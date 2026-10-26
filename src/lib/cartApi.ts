import { request } from "./api";

export type OrderItemType = "Product" | "Box";

export interface BoxSelectionPayload {
  productId: string;
  categoryId: string;
  fillingId: string;
  quantity: number;
}

export interface BoxSelectionItem extends BoxSelectionPayload {
  productName: string;
  imageUrl?: string | null;
  categoryName: string;
  fillingName: string;
}

// The cart is a saved list: one line per product or box and stall, without quantity or options.
// Quantity, category, filling and box contents are chosen when the order is placed.
export interface CartItem {
  id: string;
  itemType: OrderItemType;
  productId?: string | null;
  boxItemId?: string | null;
  name: string;
  imageUrl?: string | null;
  unitPrice: number;
}

export interface CartGroup {
  organizerId: string;
  organizerBrandName: string;
  // Stall every line of the group is bought from; null for online sellers
  stallId?: string | null;
  items: CartItem[];
  subtotalAmount: number;
}

export interface Cart {
  id: string;
  groups: CartGroup[];
  totalAmount: number;
  totalItemCount: number;
}

export const cartApi = {
  get: async () => {
    const { data } = await request<Cart>("/carts/me", { auth: true });
    return data!;
  },

  addProduct: async (productId: string, stallId?: string | null) => {
    const { data } = await request<Cart>("/carts/items/product", {
      method: "POST",
      body: { productId, stallId: stallId || null },
      auth: true,
    });
    return data!;
  },

  addBox: async (boxItemId: string, stallId?: string | null) => {
    const { data } = await request<Cart>("/carts/items/box", {
      method: "POST",
      body: { boxItemId, stallId: stallId || null },
      auth: true,
    });
    return data!;
  },

  remove: async (itemId: string) => {
    const { data } = await request<Cart>(`/carts/items/${itemId}`, { method: "DELETE", auth: true });
    return data!;
  },
};
