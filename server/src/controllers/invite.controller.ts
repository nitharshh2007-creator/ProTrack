import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import Invite from "../models/Invite.ts";
import User from "../models/User.ts";
import Workspace from "../models/Workspace.ts";
import { resolveWorkspaceId } from "../middleware/workspace.middleware.ts";
import type { AuthRequest } from "../types/auth.types.ts";


// ── POST /api/invites ─────────────────────────────────────────────────────────

export const createInvite = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(adminId, req.user?.workspaceId);
    if (!workspaceId) {
      return res.status(400).json({
        message: "Your account is not linked to a workspace. Please log out and log back in.",
      });
    }

    const { email } = req.body as { email?: string };
    if (!email?.trim()) return res.status(400).json({ message: "Email is required." });

    const normalizedEmail = email.trim().toLowerCase();
    const wsOid = new Types.ObjectId(workspaceId);

    // Block inviting someone already in this workspace
    const existing = await User.findOne({ email: normalizedEmail, workspaceId: wsOid });
    if (existing) {
      return res.status(409).json({
        message: "This user is already a member of your workspace.",
      });
    }

    // Replace any pending invite for the same email+workspace
    await Invite.deleteMany({ email: normalizedEmail, workspaceId: wsOid, accepted: false });

    const token = crypto.randomBytes(32).toString("hex");

    const invite = await Invite.create({
      email: normalizedEmail,
      workspaceId: wsOid,
      invitedBy: new Types.ObjectId(adminId),
      token,
      accepted: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const clientBase =
      process.env.CLIENT_URL ?? "http://localhost:5173";
    const inviteLink = `${clientBase}/invite/${token}`;

    return res.status(201).json({
      success: true,
      inviteLink,
      message: "Invite created successfully.",
      invite: {
        _id: invite._id,
        email: invite.email,
        token: invite.token,
        expiresAt: invite.expiresAt,
        accepted: invite.accepted,
        invitedBy: { name: "", email: "" }, // populated below on GET
      },
    });
  } catch (error) {
    console.error("[createInvite]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── GET /api/invites ──────────────────────────────────────────────────────────

export const listInvites = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(adminId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const invites = await Invite.find({ workspaceId: new Types.ObjectId(workspaceId) })
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ invites });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── GET /api/invites/:token ───────────────────────────────────────────────────
// Public — no auth required.

export const getInviteByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params as { token: string };

    const invite = await Invite.findOne({ token })
      .populate("workspaceId", "name")
      .populate("invitedBy", "name email");

    if (!invite) {
      return res.status(404).json({ message: "Invite not found or has been revoked." });
    }

    if (invite.accepted) {
      return res.status(400).json({ message: "This invite has already been used." });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ message: "This invite has expired." });
    }

    return res.status(200).json({
      invite: {
        email: invite.email,
        workspace: invite.workspaceId,
        invitedBy: invite.invitedBy,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── POST /api/invites/:token/accept ──────────────────────────────────────────
// Public — no auth required.

export const acceptInvite = async (req: Request, res: Response) => {
  try {
    const { token } = req.params as { token: string };
    const { name, password } = req.body as { name?: string; password?: string };

    if (!name?.trim() || !password) {
      return res.status(400).json({ message: "Name and password are required." });
    }

    const invite = await Invite.findOne({ token });

    if (!invite) {
      return res.status(404).json({ message: "Invite not found or has been revoked." });
    }
    if (invite.accepted) {
      return res.status(400).json({ message: "This invite has already been used." });
    }
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ message: "This invite has expired." });
    }

    const existingUser = await User.findOne({ email: invite.email });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const workspace = await Workspace.findById(invite.workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace no longer exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: invite.email,
      password: hashedPassword,
      role: "employee",
      workspaceId: invite.workspaceId,
    });

    invite.accepted = true;
    await invite.save();

    const workspaceId = invite.workspaceId.toString();

    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, workspaceId },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Account created successfully.",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId,
      },
    });
  } catch (error) {
    console.error("[acceptInvite]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── DELETE /api/invites/:id ───────────────────────────────────────────────────

export const revokeInvite = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const workspaceId = await resolveWorkspaceId(adminId, req.user?.workspaceId);
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const invite = await Invite.findOne({
      _id: req.params.id,
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!invite) return res.status(404).json({ message: "Invite not found." });

    await invite.deleteOne();
    return res.status(200).json({ message: "Invite revoked." });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};
