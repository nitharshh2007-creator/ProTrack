import express from "express";
import {
  createInvite,
  listInvites,
  getInviteByToken,
  acceptInvite,
  revokeInvite,
} from "../controllers/invite.controller.ts";
import verifyToken from "../middleware/auth.middleware.ts";
import authorize from "../middleware/authorize.middleware.ts";

const router = express.Router();

// Admin: create & list invites
router.post("/", verifyToken, authorize("admin"), createInvite);
router.get("/", verifyToken, authorize("admin"), listInvites);

// Public: look up and accept an invite (no auth required)
router.get("/:token", getInviteByToken);
router.post("/:token/accept", acceptInvite);

// Admin: revoke invite
router.delete("/:id", verifyToken, authorize("admin"), revokeInvite);

export default router;
