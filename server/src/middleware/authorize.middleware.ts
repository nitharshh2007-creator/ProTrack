import type { NextFunction, Response, RequestHandler } from "express";
import type { AuthRequest } from "../types/auth.types.ts";

const authorize = (...allowedRoles: string[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };
};

export default authorize;