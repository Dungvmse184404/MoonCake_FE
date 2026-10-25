import { request, type Tokens } from "./api";

export type ApiUserRole = "User" | "Manager" | "Organization";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  role: ApiUserRole;
  status: "Active" | "Locked";
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface UpdateProfilePayload {
  fullName: string;
  phone: string | null;
  address: string | null;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
}

export const authApi = {
  register: (payload: RegisterPayload) => request("/auth/register", { method: "POST", body: payload }),

  verifyOtp: (email: string, otpCode: string) =>
    request("/auth/verify-otp", { method: "POST", body: { email, otpCode } }),

  resendOtp: (email: string) => request("/auth/resend-otp", { method: "POST", body: { email } }),

  login: async (email: string, password: string) => {
    const { data } = await request<Tokens>("/auth/login", { method: "POST", body: { email, password } });
    return data!;
  },

  forgotPassword: (email: string) => request("/auth/forgot-password", { method: "POST", body: { email } }),

  resetPassword: (payload: { email: string; otpCode: string; newPassword: string; confirmNewPassword: string }) =>
    request("/auth/reset-password", { method: "POST", body: payload }),

  logout: () => request("/auth/logout", { method: "POST", auth: true }),

  updateProfile: async (payload: UpdateProfilePayload) => {
    const { data } = await request<CurrentUser>("/users/me", { method: "PUT", body: payload, auth: true });
    return data!;
  },

  me: async () => {
    const { data } = await request<CurrentUser>("/users/me", { auth: true });
    return data!;
  },
};
