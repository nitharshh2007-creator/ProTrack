import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import User from "../models/User.ts";
import type { AuthRequest, AuthUserPayload } from "../types/auth.types.ts";

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: "Server Error" });

    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "string") return res.status(401).json({ message: "Unauthorized" });

    const payload = decoded as JwtPayload & AuthUserPayload;
    const user = await User.findById(payload.userId).select("passwordChangedAt");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.passwordChangedAt && payload.iat) {
      const tokenIssuedAtMs = payload.iat * 1000;
      if (tokenIssuedAtMs < user.passwordChangedAt.getTime()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      workspaceId: payload.workspaceId,
    } as AuthUserPayload;

    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default authMiddleware;
