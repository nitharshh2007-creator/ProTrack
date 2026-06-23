import type { Response } from "express";
import type { AuthRequest } from "../types/auth.types";
import User from "../models/User.ts";
import Workspace from "../models/Workspace.ts";
import WorkspaceInvite from "../models/WorkspaceInvite.ts";
import Notification from "../models/Notification.ts";
import nodemailer from "nodemailer";

// ── Get team members ──────────────────────────────────────────────────────

export const getMembers = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const members = await User.find({ workspaceId })
      .select("_id name email role createdAt")
      .lean();

    return res.status(200).json({ members });
  } catch (error) {
    console.error("[getMembers]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── Get team stats ────────────────────────────────────────────────────────

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const totalMembers = await User.countDocuments({ workspaceId });
    const pendingInvites = await WorkspaceInvite.countDocuments({
      workspaceId,
      status: "pending",
    });

    return res.status(200).json({
      stats: {
        totalMembers,
        activeMembers: totalMembers,
        pendingInvites,
        projects: 0,
      },
    });
  } catch (error) {
    console.error("[getStats]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── Invite member by email ────────────────────────────────────────────────

export const inviteMember = async (req: AuthRequest, res: Response) => {
  try {
    console.log("🔵 INVITE CONTROLLER HIT");
    const userId = req.user?.userId;
    const workspaceId = req.user?.workspaceId;
    console.log("👤 User:", userId, "🏢 Workspace:", workspaceId);
    if (!workspaceId || !userId)
      return res.status(401).json({ message: "Unauthorized" });

    const { email, role } = req.body as { email?: string; role?: string };
    console.log("📧 Email:", email, "👥 Role:", role);

    if (!email || !role)
      return res.status(400).json({ message: "Email and role are required" });

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      workspaceId,
    });
    if (existingUser)
      return res
        .status(400)
        .json({ message: "User already in workspace" });

    console.log("🔧 Creating invite...");
    const invite = await WorkspaceInvite.create({
      workspaceId,
      email: email.toLowerCase(),
      role,
      createdBy: userId,
    });
    console.log("✅ Invite created:", invite._id);

    console.log("📧 Configuring email...");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log("🔐 SMTP User:", process.env.EMAIL_USER);

    const workspace = await Workspace.findById(workspaceId);
    const inviteLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/invite/${invite.token}`;
    console.log("🔗 Invite link:", inviteLink);

    console.log("📤 Sending email to:", email);
    await transporter.sendMail({
      from: `"ProTrack" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Join ${workspace?.name} on ProTrack`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #081120; color: #f1f5f9; border-radius: 12px; border: 1px solid #1e3a8a;">
          <h1 style="color: #3b82f6; text-align: center;">ProTrack</h1>
          <p>You've been invited to join <strong>${workspace?.name}</strong> as a <strong>${role}</strong>.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteLink}" style="background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; display: inline-block; font-weight: bold;">Accept Invitation</a>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">This invitation expires in 7 days.</p>
        </div>
      `,
    });
    console.log("✅ Email sent successfully");

    console.log("📝 Creating notification...");
    await Notification.create({
      userId,
      type: "team_member_invited",
      title: "Invitation Sent",
      message: `Invitation sent to ${email}`,
    });
    console.log("✅ Notification created");

    console.log("✅ INVITE SUCCESS");
    return res.status(201).json({
      message: "Invitation sent successfully",
      invite,
    });
  } catch (error) {
    console.error("💥 INVITE ERROR:", error);
    return res.status(500).json({ message: "Server Error", error: String(error) });
  }
};

// ── Generate invite link ──────────────────────────────────────────────────

export const generateInviteLink = async (req: AuthRequest, res: Response) => {
  try {
    console.log("🔵 GENERATE INVITE LINK HIT");
    const userId = req.user?.userId;
    const workspaceId = req.user?.workspaceId;
    console.log("👤 User:", userId, "🏢 Workspace:", workspaceId);
    if (!workspaceId || !userId)
      return res.status(401).json({ message: "Unauthorized" });

    const { role, email } = req.body as { role?: string; email?: string };
    if (!role) return res.status(400).json({ message: "Role is required" });

    const invite = await WorkspaceInvite.create({
      workspaceId,
      email: email || `invite-${Date.now()}@generated.local`,
      role,
      createdBy: userId,
    });
    console.log("✅ Invite created:", invite._id);

    const link = `${process.env.CLIENT_URL || "http://localhost:5173"}/invite/${invite.token}`;
    console.log("🔗 Invite link:", link);

    // Send email if email provided
    if (email) {
      console.log("📧 Configuring email...");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const workspace = await Workspace.findById(workspaceId);
      console.log("📤 Sending email to:", email);
      await transporter.sendMail({
        from: `"ProTrack" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Join ${workspace?.name} on ProTrack`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #081120; color: #f1f5f9; border-radius: 12px; border: 1px solid #1e3a8a;">
            <h1 style="color: #3b82f6; text-align: center;">ProTrack</h1>
            <p>You've been invited to join <strong>${workspace?.name}</strong> as a <strong>${role}</strong>.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${link}" style="background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; display: inline-block; font-weight: bold;">Accept Invitation</a>
            </div>
            <p style="font-size: 12px; color: #94a3b8;">This invitation expires in 7 days.</p>
          </div>
        `,
      });
      console.log("✅ Email sent successfully");
    }

    console.log("✅ GENERATE INVITE LINK SUCCESS");
    return res.status(201).json({
      message: "Invite link generated",
      link,
      token: invite.token,
      inviteId: invite._id,
    });
  } catch (error) {
    console.error("💥 GENERATE INVITE LINK ERROR:", error);
    return res.status(500).json({ message: "Server Error", error: String(error) });
  }
};

// ── Join workspace ───────────────────────────────────────────────────────

export const joinWorkspace = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;
    const userId = req.user?.userId;

    if (!token || !userId)
      return res.status(400).json({ message: "Invalid token or user" });

    const invite = await WorkspaceInvite.findOne({
      token,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (!invite)
      return res
        .status(400)
        .json({ message: "Invitation invalid or expired" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Add user to workspace
    user.workspaceId = invite.workspaceId;
    user.role = (invite.role as "employee" | "manager") || "employee";
    await user.save();

    // Mark invite as accepted
    invite.status = "accepted";
    invite.acceptedBy = userId;
    invite.acceptedAt = new Date();
    await invite.save();

    // Notify admins
    const admins = await User.find({
      workspaceId: invite.workspaceId,
      role: "admin",
    });

    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        type: "user_added",
        title: "Member Joined",
        message: `${user.name} joined the workspace`,
        triggeredBy: userId,
      });
    }

    return res.status(200).json({
      message: "Successfully joined workspace",
      workspaceId: invite.workspaceId.toString(),
    });
  } catch (error) {
    console.error("[joinWorkspace]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── Block member ──────────────────────────────────────────────────────────

export const blockMember = async (req: AuthRequest, res: Response) => {
  try {
    const { userId: memberId } = req.params;
    const adminId = req.user?.userId;
    const workspaceId = req.user?.workspaceId;

    if (!workspaceId || !adminId)
      return res.status(401).json({ message: "Unauthorized" });

    const member = await User.findOne({
      _id: memberId,
      workspaceId,
    });

    if (!member) return res.status(404).json({ message: "Member not found" });

    // Set role to "blocked" by storing in a field (or remove from workspace)
    member.role = "employee";
    member.workspaceId = undefined;
    await member.save();

    // Notify admins
    await Notification.create({
      userId: adminId,
      type: "user_removed",
      title: "Member Blocked",
      message: `${member.name} has been blocked`,
    });

    return res.status(200).json({ message: "Member blocked successfully" });
  } catch (error) {
    console.error("[blockMember]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── Remove member ─────────────────────────────────────────────────────────

export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const { userId: memberId } = req.params;
    const adminId = req.user?.userId;
    const workspaceId = req.user?.workspaceId;

    if (!workspaceId || !adminId)
      return res.status(401).json({ message: "Unauthorized" });

    const member = await User.findOne({
      _id: memberId,
      workspaceId,
    });

    if (!member) return res.status(404).json({ message: "Member not found" });

    member.workspaceId = undefined;
    await member.save();

    // Notify admins
    await Notification.create({
      userId: adminId,
      type: "user_removed",
      title: "Member Removed",
      message: `${member.name} has been removed`,
    });

    return res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("[removeMember]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── Get pending invites ───────────────────────────────────────────────────

export const getPendingInvites = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) return res.status(401).json({ message: "Unauthorized" });

    const invites = await WorkspaceInvite.find({
      workspaceId,
      status: "pending",
    })
      .populate("createdBy", "name email")
      .lean();

    return res.status(200).json({ invites });
  } catch (error) {
    console.error("[getPendingInvites]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
