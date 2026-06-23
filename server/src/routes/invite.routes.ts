import { Router } from "express";
import { validateInviteToken, registerFromInvite } from "../controllers/inviteController.ts";

const router = Router();

router.get("/:token", validateInviteToken);
router.post("/accept", registerFromInvite);

export default router;
