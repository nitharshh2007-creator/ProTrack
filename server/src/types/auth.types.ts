import type { Request } from "express";

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: string;
  workspaceId?: string;
  iat?: number;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}
