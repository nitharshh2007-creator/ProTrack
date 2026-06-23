import express from "express";
import authMiddleware from "../middleware/auth.middleware.ts";
import authorize from "../middleware/authorize.middleware.ts";
import {
  getMembers,
  getStats,
  inviteMember,
  generateInviteLink,
  joinWorkspace,
  blockMember,
  removeMember,
  getPendingInvites,
} from "../controllers/teamController.ts";

const router = express.Router();

// All team routes require authentication and admin role
router.use(authMiddleware);

// Public join endpoint (no admin check)
router.post("/join/:token", joinWorkspace);

// Admin-only routes
router.get("/members", getMembers);
router.get("/stats", authorize("admin"), getStats);
router.get("/invites/pending", authorize("admin"), getPendingInvites);
router.post("/invite", authorize("admin"), inviteMember);
router.post("/generate-link", authorize("admin"), generateInviteLink);
router.patch("/block/:userId", authorize("admin"), blockMember);
router.delete("/remove/:userId", authorize("admin"), removeMember);

export default router;
