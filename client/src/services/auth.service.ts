import api from "@/lib/axios";
import type { ActiveSession, AuthResponse, AuthUser, ChangePasswordPayload, LoginPayload, RegisterPayload, User } from "@/types";

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>("/auth/register", payload).then((r) => r.data),

  getProfile: () =>
    api.get<{ user: User }>("/auth/profile").then((r) => r.data.user),

  getMe: () =>
    api.get<AuthUser>("/auth/me").then((r) => r.data),

  getSessions: () =>
    api.get<{ sessions: ActiveSession[] }>("/auth/sessions").then((r) => r.data.sessions),

  changePassword: (payload: ChangePasswordPayload) =>
    api.post<{ message: string }>("/auth/change-password", payload).then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>(`/auth/reset-password/${token}`, { password }).then((r) => r.data),

  logout: () =>
    api.post<{ message: string }>("/auth/logout").then((r) => r.data),
};
