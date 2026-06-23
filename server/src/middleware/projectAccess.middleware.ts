import type { Response, NextFunction } from "express";
import { Types } from "mongoose";
import Project from "../models/Project.ts";
import type { AuthRequest } from "../types/auth.types.ts";

const validateProjectAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const project = await Project.findById(req.params.id).select("createdBy members teamMembers");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (userRole === "admin") {
      // Admins can access any project in their workspace
    } else {
      const uid = new Types.ObjectId(userId);
      const isMember = 
        project.members?.some((m) => m.equals(uid)) || 
        project.teamMembers?.some((m) => m.equals(uid));
      if (!isMember) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    next();
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};

export default validateProjectAccess;
