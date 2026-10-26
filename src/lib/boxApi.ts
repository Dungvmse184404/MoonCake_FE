import { request } from "./api";
import type { ProductStatus } from "./catalog";
import type { Paged } from "./organizerApi";

export interface BoxProduct {
  id: string;
  name: string;
  imageUrl?: string | null;
  status: ProductStatus;
  categories: Array<{ id: string; name: string }>;
  fillings: Array<{ id: string; name: string }>;
}

export interface BoxItem {
  id: string;
  stallIds: string[];
  organizerId: string;
  organizerBrandName: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  capacity: number;
  price: number;
  status: ProductStatus;
  products: BoxProduct[];
  createdAt: string;
}

export interface BoxPayload {
  name: string;
  description: string;
  imageUrl: string;
  capacity: number;
  price: number;
  productIds: string[];
}

const toImages = (imageUrl: string) => (imageUrl ? [{ imageUrl, sortOrder: 0, isPrimary: true }] : []);

export const boxApi = {
  list: async (params: { status?: ProductStatus; stallId?: string; search?: string; page?: number; pageSize?: number }) => {
    const { data } = await request<Paged<BoxItem>>("/box-items", { query: { status: "Active", ...params } });
    return data!;
  },

  mine: async (params: { status?: ProductStatus; search?: string; page?: number; pageSize?: number }) => {
    const { data } = await request<Paged<BoxItem>>("/box-items/me", { auth: true, query: params });
    return data!;
  },

  get: async (id: string) => {
    const { data } = await request<BoxItem>(`/box-items/${id}`);
    return data!;
  },

  create: async ({ imageUrl, ...rest }: BoxPayload) => {
    const { data } = await request<BoxItem>("/box-items", {
      method: "POST",
      body: { ...rest, images: toImages(imageUrl) },
      auth: true,
    });
    return data!;
  },

  update: async (id: string, { imageUrl, ...rest }: BoxPayload) => {
    const { data } = await request<BoxItem>(`/box-items/${id}`, {
      method: "PUT",
      body: { ...rest, images: toImages(imageUrl) },
      auth: true,
    });
    return data!;
  },

  assignStalls: async (id: string, stallIds: string[]) => {
    const { data } = await request<BoxItem>(`/box-items/${id}/stalls`, { method: "PUT", body: { stallIds }, auth: true });
    return data!;
  },

  setStatus: async (id: string, status: ProductStatus) => {
    const { data } = await request<BoxItem>(`/box-items/${id}/status`, { method: "PUT", body: { status }, auth: true });
    return data!;
  },

  remove: (id: string) => request(`/box-items/${id}`, { method: "DELETE", auth: true }),
};
