import type { Response, Request } from "express";
import type { AuthRequest } from "../types/auth.types";
import User from "../models/User.ts";
import Workspace from "../models/Workspace.ts";
import WorkspaceInvite from "../models/WorkspaceInvite.ts";
import Notification from "../models/Notification.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// ── Validate invite token ──────────────────────────────────────────────────

export const validateInviteToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) return res.status(400).json({ message: "Token is required" });

    const invite = await WorkspaceInvite.findOne({ token }).populate("workspaceId", "name");

    if (!invite) return res.status(404).json({ message: "Invitation not found" });

    if (invite.status !== "pending") return res.status(400).json({ message: "Invitation has already been used or rejected" });

    if (new Date() > invite.expiresAt) {
      invite.status = "expired";
      await invite.save();
      return res.status(400).json({ message: "Invitation has expired" });
    }

    return res.status(200).json({
      invite: {
        token: invite.token,
        email: invite.email,
        role: invite.role,
        workspaceName: (invite.workspaceId as any)?.name || "ProTrack",
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    console.error("❌ validateInviteToken error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── Register from invite ───────────────────────────────────────────────────

export const registerFromInvite = async (req: Request, res: Response) => {
  try {
    console.log("🔵 REGISTER FROM INVITE HIT");
    const { token, name, email, password } = req.body;

    if (!token || !name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    // Validate invite token
    const invite = await WorkspaceInvite.findOne({ token });

    if (!invite) return res.status(404).json({ message: "Invitation not found" });

    if (invite.status !== "pending") return res.status(400).json({ message: "Invitation has already been used" });

    if (new Date() > invite.expiresAt) {
      invite.status = "expired";
      await invite.save();
      return res.status(400).json({ message: "Invitation has expired" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      // If user exists but not in workspace, join them
      if (!existingUser.workspaceId) {
        existingUser.workspaceId = invite.workspaceId;
        existingUser.role = (invite.role as "employee" | "manager") || "employee";
        await existingUser.save();

        invite.status = "accepted";
        invite.acceptedBy = existingUser._id;
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
            type: "team_member_joined",
            title: "Team Member Joined",
            message: `${existingUser.name} has joined the workspace`,
            triggeredBy: existingUser._id,
          });
        }

        // Generate JWT
        const token = jwt.sign(
          { userId: existingUser._id, email: existingUser.email, role: existingUser.role, workspaceId: existingUser.workspaceId?.toString() },
          process.env.JWT_SECRET || "secret",
          { expiresIn: "7d" }
        );

        return res.status(200).json({
          message: "Welcome back! You have joined the workspace",
          token,
          user: {
            userId: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            workspaceId: existingUser.workspaceId,
          },
        });
      } else {
        return res.status(400).json({ message: "User already exists in another workspace" });
      }
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: (invite.role as "employee" | "manager") || "employee",
      workspaceId: invite.workspaceId,
    });

    console.log("✅ User created:", newUser._id);

    // Mark invite as accepted
    invite.status = "accepted";
    invite.acceptedBy = newUser._id;
    invite.acceptedAt = new Date();
    await invite.save();

    console.log("✅ Invite marked as accepted");

    // Notify admins
    const admins = await User.find({
      workspaceId: invite.workspaceId,
      role: "admin",
    });

    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        type: "team_member_joined",
        title: "Team Member Joined",
        message: `${newUser.name} has joined the workspace`,
        triggeredBy: newUser._id,
      });
    }

    console.log("✅ Notifications created");

    // Notify new employee
    await Notification.create({
      userId: newUser._id,
      type: "user_added",
      title: "Welcome to ProTrack!",
      message: `Welcome to the workspace. Get started with your first project.`,
    });

    // Generate JWT
    const authToken = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role, workspaceId: newUser.workspaceId?.toString() },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    console.log("✅ REGISTRATION FROM INVITE SUCCESS");

    return res.status(201).json({
      message: "Account created successfully",
      token: authToken,
      user: {
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        workspaceId: newUser.workspaceId,
      },
    });
  } catch (error) {
    console.error("💥 registerFromInvite error:", error);
    return res.status(500).json({ message: "Server Error", error: String(error) });
  }
};
