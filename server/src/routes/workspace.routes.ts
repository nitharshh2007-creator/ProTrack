import { Router } from "express";
import verifyToken from "../middleware/auth.middleware.ts";
import authorize from "../middleware/authorize.middleware.ts";
import Workspace from "../models/Workspace.ts";
import { resolveWorkspaceId } from "../middleware/workspace.middleware.ts";

const router = Router();

// GET /api/workspace
router.get("/", verifyToken, async (req: any, res: any) => {
  try {
    const userId = req.user?.userId;
    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const ws = await Workspace.findById(workspaceId).lean();
    if (!ws) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    return res.status(200).json({ id: ws._id, name: ws.name, ownerId: ws.ownerId });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
});

// PUT /api/workspace
router.put("/", verifyToken, authorize("admin"), async (req: any, res: any) => {
  try {
    const userId = req.user?.userId;
    const workspaceId = await resolveWorkspaceId(userId, req.user?.workspaceId);
    if (!workspaceId) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Workspace name is required" });
    }

    const ws = await Workspace.findByIdAndUpdate(
      workspaceId,
      { name: name.trim() },
      { new: true }
    );
    if (!ws) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    return res.status(200).json({ id: ws._id, name: ws.name, ownerId: ws.ownerId });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
});

export default router;
