import api from "@/lib/axios";
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload, User } from "@/types";

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>("/auth/register", payload).then((r) => r.data),

  getProfile: () =>
    api.get<{ user: User }>("/auth/profile").then((r) => r.data.user),

  getMe: () =>
    api.get<AuthUser>("/auth/me").then((r) => r.data),
};
