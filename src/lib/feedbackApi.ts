import { request } from "./api";
import type { Paged } from "./organizerApi";

export type FeedbackStatus = "Visible" | "Hidden";

export interface Feedback {
  id: string;
  orderItemId: string;
  userName?: string | null;
  organizerBrandName: string;
  productId?: string | null;
  productName?: string | null;
  boxItemId?: string | null;
  boxItemName?: string | null;
  rating: number;
  comment?: string | null;
  replyContent?: string | null;
  repliedAt?: string | null;
  status: FeedbackStatus;
  imageUrls: string[];
  createdAt: string;
}

export interface FeedbackList {
  pagination: Paged<Feedback>;
  // Only the public and manager lists report an average
  averageRating: number | null;
}

type ListParams = {
  productId?: string;
  boxItemId?: string;
  rating?: number;
  status?: FeedbackStatus;
  page?: number;
  pageSize?: number;
};

export const feedbackApi = {
  list: async (params: ListParams) => {
    const { data } = await request<FeedbackList>("/feedbacks", { query: params });
    return data!;
  },

  // Manager view: sent with the token so hidden feedback is included
  adminList: async (params: ListParams) => {
    const { data } = await request<FeedbackList>("/feedbacks", { auth: true, query: params });
    return data!;
  },

  // Feedback about the current organizer's shop, including hidden ones
  organizerList: async (params: ListParams) => {
    const { data } = await request<Paged<Feedback>>("/feedbacks/organizer", { auth: true, query: params });
    return { pagination: data!, averageRating: null } satisfies FeedbackList;
  },

  create: async (orderItemId: string, rating: number, comment: string) => {
    const { data } = await request<Feedback>("/feedbacks", {
      method: "POST",
      body: { orderItemId, rating, comment: comment || null },
      auth: true,
    });
    return data!;
  },

  reply: async (id: string, replyContent: string) => {
    const { data } = await request<Feedback>(`/feedbacks/${id}/reply`, { method: "PUT", body: { replyContent }, auth: true });
    return data!;
  },

  setStatus: async (id: string, status: FeedbackStatus) => {
    const { data } = await request<Feedback>(`/feedbacks/${id}/status`, { method: "PUT", body: { status }, auth: true });
    return data!;
  },
};
