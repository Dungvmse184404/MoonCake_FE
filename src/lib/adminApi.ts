import { request } from "./api";
import type { ApiUserRole, CurrentUser } from "./authApi";
import type {
  Organizer,
  OrganizerRegistration,
  OrganizerStatus,
  Paged,
  RegistrationStatus,
  RegistrationType,
  RentalStatus,
  Stall,
  StallRental,
  StallStatus,
} from "./organizerApi";

export interface StallPayload {
  code: string;
  name: string;
  location: string;
  rentalPrice: number;
  description: string;
}

// Manager-only endpoints.
export const adminApi = {
  listRegistrations: async (params: {
    search?: string;
    type?: RegistrationType;
    status?: RegistrationStatus;
    page?: number;
    pageSize?: number;
  }) => {
    const { data } = await request<Paged<OrganizerRegistration>>("/organizer-registrations", { auth: true, query: params });
    return data!;
  },

  // commissionRate is required for Online registrations and ignored for Stall ones
  approveRegistration: async (id: string, commissionRate?: number) => {
    const { data } = await request<OrganizerRegistration>(`/organizer-registrations/${id}/approve`, {
      method: "PUT",
      body: { commissionRate: commissionRate ?? null },
      auth: true,
    });
    return data!;
  },

  rejectRegistration: async (id: string, rejectReason: string) => {
    const { data } = await request<OrganizerRegistration>(`/organizer-registrations/${id}/reject`, {
      method: "PUT",
      body: { rejectReason },
      auth: true,
    });
    return data!;
  },

  listStalls: async (params: { search?: string; status?: StallStatus; page?: number; pageSize?: number }) => {
    const { data } = await request<Paged<Stall>>("/stalls", { query: { ...params, sortBy: "code", isDescending: false } });
    return data!;
  },

  createStall: async (payload: StallPayload) => {
    const { data } = await request<Stall>("/stalls", { method: "POST", body: payload, auth: true });
    return data!;
  },

  updateStall: async (id: string, payload: StallPayload) => {
    const { data } = await request<Stall>(`/stalls/${id}`, { method: "PUT", body: payload, auth: true });
    return data!;
  },

  deleteStall: (id: string) => request(`/stalls/${id}`, { method: "DELETE", auth: true }),

  listUsers: async (params: {
    search?: string;
    role?: ApiUserRole;
    status?: CurrentUser["status"];
    page?: number;
    pageSize?: number;
  }) => {
    const { data } = await request<Paged<CurrentUser>>("/users", { auth: true, query: params });
    return data!;
  },

  listOrganizers: async (params: { search?: string; status?: OrganizerStatus; page?: number; pageSize?: number }) => {
    const { data } = await request<Paged<Organizer>>("/organizers", { auth: true, query: params });
    return data!;
  },

  setOrganizerStatus: async (id: string, status: OrganizerStatus, reason?: string) => {
    const { data } = await request<Organizer>(`/organizers/${id}/status`, {
      method: "PUT",
      body: { status, reason: reason || null },
      auth: true,
    });
    return data!;
  },

  listRentals: async (params: { search?: string; status?: RentalStatus; page?: number; pageSize?: number }) => {
    const { data } = await request<Paged<StallRental>>("/stall-rentals", { auth: true, query: params });
    return data!;
  },

  terminateRental: async (id: string) => {
    const { data } = await request<StallRental>(`/stall-rentals/${id}/terminate`, { method: "PUT", auth: true });
    return data!;
  },
};
