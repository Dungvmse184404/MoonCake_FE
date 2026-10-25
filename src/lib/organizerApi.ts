import { request } from "./api";

export type RegistrationType = "Stall" | "Online";
export type RegistrationStatus = "Pending" | "AwaitingConfirmation" | "Approved" | "Rejected" | "Cancelled";
export type StallStatus = "Available" | "Rented";
export type OrganizerStatus = "Active" | "Suspended";

export interface Paged<T> {
  items: T[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface Stall {
  id: string;
  code: string;
  name: string;
  location?: string | null;
  rentalPrice: number;
  description?: string | null;
  status: StallStatus;
  createdAt: string;
}

export interface OrganizerRegistration {
  id: string;
  userFullName?: string;
  userEmail?: string;
  type: RegistrationType;
  stallId?: string | null;
  stallCode?: string | null;
  stallName?: string | null;
  organizerId?: string | null;
  brandName: string;
  contactPhone?: string | null;
  businessInfo?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  commissionRate?: number | null;
  status: RegistrationStatus;
  reviewedAt?: string | null;
  rejectReason?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
}

export interface Organizer {
  id: string;
  userFullName?: string;
  userEmail?: string;
  brandName: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  businessInfo?: string | null;
  status: OrganizerStatus;
  approvedAt?: string | null;
  suspendReason?: string | null;
  suspendedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export type RentalStatus = "Confirmed" | "Active" | "Expired" | "Terminated";

export interface StallRental {
  id: string;
  stallId: string;
  stallCode: string;
  stallName: string;
  stallLocation?: string | null;
  rentalPrice: number;
  organizerId: string;
  organizerBrandName: string;
  organizerUserFullName: string;
  organizerUserEmail: string;
  startDate: string;
  endDate?: string | null;
  status: RentalStatus;
  createdAt: string;
}

export interface AdditionalStallsPayload {
  stallIds: string[];
  startDate: string;
  endDate: string;
}

export interface CreateRegistrationPayload {
  type: RegistrationType;
  brandName: string;
  contactPhone: string;
  businessInfo: string;
  stallId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateOrganizerPayload {
  brandName: string;
  contactPhone: string;
  contactEmail: string;
  businessInfo: string;
}

export const organizerApi = {
  listStalls: async (params: { search?: string; status?: StallStatus; page?: number; pageSize?: number }) => {
    const { data } = await request<Paged<Stall>>("/stalls", {
      query: { ...params, sortBy: "code", isDescending: false },
    });
    return data!;
  },

  getStall: async (id: string) => {
    const { data } = await request<Stall>(`/stalls/${id}`);
    return data!;
  },

  createRegistration: async (payload: CreateRegistrationPayload) => {
    const form = new FormData();
    form.set("Type", payload.type);
    form.set("BrandName", payload.brandName);
    if (payload.contactPhone) form.set("ContactPhone", payload.contactPhone);
    if (payload.businessInfo) form.set("BusinessInfo", payload.businessInfo);
    if (payload.type === "Stall") {
      form.set("StallId", payload.stallId ?? "");
      form.set("StartDate", payload.startDate ?? "");
      form.set("EndDate", payload.endDate ?? "");
    }
    const { data } = await request<OrganizerRegistration>("/organizer-registrations", {
      method: "POST",
      body: form,
      auth: true,
    });
    return data!;
  },

  myRegistrations: async (params: {
    status?: RegistrationStatus;
    type?: RegistrationType;
    page?: number;
    pageSize?: number;
  }) => {
    const { data } = await request<Paged<OrganizerRegistration>>("/organizer-registrations/me", {
      auth: true,
      query: params,
    });
    return data!;
  },

  // Organizers (Organization role) apply for more stalls or for online selling
  createAdditionalStalls: async (payload: AdditionalStallsPayload) => {
    const { data } = await request<OrganizerRegistration[]>("/organizer-registrations/additional-stalls", {
      method: "POST",
      body: payload,
      auth: true,
    });
    return data!;
  },

  createAdditionalOnline: async () => {
    const { data } = await request<OrganizerRegistration>("/organizer-registrations/additional-online", {
      method: "POST",
      auth: true,
    });
    return data!;
  },

  myRentals: async (params: { status?: RentalStatus; page?: number; pageSize?: number }) => {
    const { data } = await request<Paged<StallRental>>("/stall-rentals/me", { auth: true, query: params });
    return data!;
  },

  cancelRegistration: async (id: string, cancelReason: string) => {
    const { data } = await request<OrganizerRegistration>(`/organizer-registrations/${id}/cancel`, {
      method: "PUT",
      body: { cancelReason: cancelReason || null },
      auth: true,
    });
    return data!;
  },

  confirmRegistration: async (id: string) => {
    const { data } = await request<OrganizerRegistration>(`/organizer-registrations/${id}/confirm`, {
      method: "PUT",
      auth: true,
    });
    return data!;
  },

  myOrganizer: async () => {
    const { data } = await request<Organizer>("/organizers/me", { auth: true });
    return data!;
  },

  updateMyOrganizer: async (payload: UpdateOrganizerPayload) => {
    const { data } = await request<Organizer>("/organizers/me", { method: "PUT", body: payload, auth: true });
    return data!;
  },
};
