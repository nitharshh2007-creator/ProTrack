import type { Request } from "express";

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}