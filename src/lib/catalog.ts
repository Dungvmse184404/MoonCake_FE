import { request } from "./api";
import type { Paged } from "./organizerApi";

export type ProductStatus = "Draft" | "Active" | "OutOfStock" | "Inactive";

export interface Category {
  id: string;
  organizerId: string;
  organizerBrandName: string;
  name: string;
  description?: string | null;
}

export interface Filling {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  stallId?: string | null;
  organizerId: string;
  organizerBrandName: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  stockQuantity: number;
  status: ProductStatus;
  categories: Array<{ id: string; name: string; description?: string | null }>;
  fillings: Filling[];
  createdAt: string;
}

export interface ProductQuery {
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const catalogApi = {
  // Categories belong to individual organizers, so the same name can appear several times; keep the first of each.
  listCategories: async (): Promise<Category[]> => {
    const { data } = await request<Paged<Category>>("/cake-categories", {
      query: { pageSize: 50, sortBy: "name", isDescending: false },
    });
    const seen = new Set<string>();
    return (data?.items ?? []).filter((c) => {
      const key = c.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  listProducts: async ({ categoryId, search, page = 1, pageSize = 8 }: ProductQuery) => {
    const { data } = await request<Paged<Product>>("/products", {
      query: { status: "Active", categoryId, search, page, pageSize },
    });
    return data!;
  },

  // No "featured" flag in the backend yet, so this is simply the newest active products.
  listFeaturedProducts: async (limit = 4) => {
    const { data } = await request<Paged<Product>>("/products", {
      query: { status: "Active", sortBy: "createdAt", isDescending: true, pageSize: limit },
    });
    return data?.items ?? [];
  },

  getProduct: async (id: string) => {
    const { data } = await request<Product>(`/products/${id}`);
    return data!;
  },
};
