export type UserRole = "admin" | "manager" | "member" | "employee";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  workspaceId?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Admin-only self-registration. Employees register via invite link.
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "admin";
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

// ── Invite types ─────────────────────────────────────────────────────────────

export interface InviteInfo {
  email: string;
  workspace: { _id: string; name: string };
  invitedBy: { name: string; email: string };
  expiresAt: string;
}

export interface InviteRecord {
  _id: string;
  email: string;
  token: string;
  accepted: boolean;
  expiresAt: string;
  invitedBy: { name: string; email: string };
}

export interface AcceptInvitePayload {
  name: string;
  password: string;
}
