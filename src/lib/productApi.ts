import { request } from "./api";
import type { Category, Filling, Product, ProductStatus } from "./catalog";
import type { Paged } from "./organizerApi";

export interface ProductPayload {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  categoryIds: string[];
  fillingIds: string[];
}

export interface CreateProductPayload extends ProductPayload {
  stockQuantity: number;
}

export interface OwnedFilling extends Filling {
  organizerId: string;
}

// Organizer-side product, category and filling management (all endpoints need the Organization role).
export const productApi = {
  myProducts: async (params: { status?: ProductStatus; search?: string; page?: number; pageSize?: number }) => {
    const { data } = await request<Paged<Product>>("/products/me", { auth: true, query: params });
    return data!;
  },

  create: async (payload: CreateProductPayload) => {
    const { data } = await request<Product>("/products", { method: "POST", body: payload, auth: true });
    return data!;
  },

  update: async (id: string, payload: ProductPayload) => {
    const { data } = await request<Product>(`/products/${id}`, { method: "PUT", body: payload, auth: true });
    return data!;
  },

  setStatus: async (id: string, status: ProductStatus) => {
    const { data } = await request<Product>(`/products/${id}/status`, { method: "PUT", body: { status }, auth: true });
    return data!;
  },

  // Positive to restock, negative to reduce
  adjustStock: async (id: string, quantityDelta: number) => {
    const { data } = await request<Product>(`/products/${id}/stock`, { method: "PUT", body: { quantityDelta }, auth: true });
    return data!;
  },

  remove: (id: string) => request(`/products/${id}`, { method: "DELETE", auth: true }),

  myCategories: async () => {
    const { data } = await request<Paged<Category>>("/cake-categories/me", {
      auth: true,
      query: { pageSize: 50, sortBy: "name", isDescending: false },
    });
    return data?.items ?? [];
  },

  createCategory: async (name: string) => {
    const { data } = await request<Category>("/cake-categories", { method: "POST", body: { name }, auth: true });
    return data!;
  },

  updateCategory: async (id: string, payload: { name: string; description: string | null }) => {
    const { data } = await request<Category>(`/cake-categories/${id}`, { method: "PUT", body: payload, auth: true });
    return data!;
  },

  deleteCategory: (id: string) => request(`/cake-categories/${id}`, { method: "DELETE", auth: true }),

  myFillings: async () => {
    const { data } = await request<Paged<OwnedFilling>>("/fillings/me", {
      auth: true,
      query: { pageSize: 50, sortBy: "name", isDescending: false },
    });
    return data?.items ?? [];
  },

  createFilling: async (name: string) => {
    const { data } = await request<OwnedFilling>("/fillings", { method: "POST", body: { name }, auth: true });
    return data!;
  },

  updateFilling: async (id: string, name: string) => {
    const { data } = await request<OwnedFilling>(`/fillings/${id}`, { method: "PUT", body: { name }, auth: true });
    return data!;
  },

  deleteFilling: (id: string) => request(`/fillings/${id}`, { method: "DELETE", auth: true }),
};
