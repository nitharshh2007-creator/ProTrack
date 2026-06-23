import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/User.ts";
import Workspace from "../models/Workspace.ts";
import type { AuthRequest } from "../types/auth.types.ts";

// ── helpers ──────────────────────────────────────────────────────────────────

const signToken = (
  userId: string,
  email: string,
  role: string,
  workspaceId?: string
) =>
  jwt.sign(
    { userId, email, role, ...(workspaceId ? { workspaceId } : {}) },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

const browserLabelFromUserAgent = (userAgent?: string) => {
  if (!userAgent) return "Unknown browser";
  if (userAgent.includes("Edg/")) return "Microsoft Edge";
  if (userAgent.includes("Chrome/")) return "Google Chrome";
  if (userAgent.includes("Safari/")) return "Safari";
  if (userAgent.includes("Firefox/")) return "Mozilla Firefox";
  return "Browser";
};

// ── register ─────────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    // Only admins may self-register. Employees must use an invite link.
    if (role !== "admin") {
      return res.status(403).json({
        message: "Employees must register via an invitation link.",
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
    });

    const workspace = await Workspace.create({
      name: `${name.trim()}'s Workspace`,
      ownerId: user._id,
    });

    user.workspaceId = workspace._id;
    await user.save();

    const workspaceId = workspace._id.toString();
    const token = signToken(user._id.toString(), user.email, user.role, workspaceId);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId,
      },
    });
  } catch (error) {
    console.error("[register]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── login ─────────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Auto-create workspace for legacy admins who don't have one yet
    if (user.role === "admin" && !user.workspaceId) {
      const ws = await Workspace.create({
        name: `${user.name.trim()}'s Workspace`,
        ownerId: user._id,
      });
      user.workspaceId = ws._id;
      await user.save();
    }

    const workspaceId = user.workspaceId?.toString();
    const token = signToken(user._id.toString(), user.email, user.role, workspaceId);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── profile ───────────────────────────────────────────────────────────────────

export const profile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── changePassword ───────────────────────────────────────────────────────────

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = new Date();
    user.set("resetToken", undefined);
    user.set("resetTokenExpiry", undefined);
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("[changePassword]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── sessions ─────────────────────────────────────────────────────────────────

export const sessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("passwordChangedAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    const userAgent = req.headers["user-agent"] ?? undefined;

    return res.status(200).json({
      sessions: [
        {
          id: "current",
          device: browserLabelFromUserAgent(userAgent),
          userAgent: userAgent ?? "Unknown user agent",
          ipAddress: req.ip,
          lastActiveAt: new Date().toISOString(),
          isCurrent: true,
        },
      ],
    });
  } catch (error) {
    console.error("[sessions]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── me ────────────────────────────────────────────────────────────────────────
// GET /api/auth/me — returns current user with fresh workspaceId from DB

export const me = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId?.toString(),
    });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── logout ────────────────────────────────────────────────────────────────────

export const logout = async (req: Request, res: Response) => {
  try {
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── forgotPassword ────────────────────────────────────────────────────────────

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return 200/success anyway to avoid email enumeration attacks, as per standard security
      // or check requirements: "System checks if account exists. ... Send email. Show success message."
      // Let's do: if not exist, we can return error or success. The requirement says:
      // "System checks if account exists." If not, return error so user knows. Let's return error.
      return res.status(404).json({ message: "No account with that email address exists." });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Configure transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${token}`;

    const mailOptions = {
      from: `"ProTrack Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "ProTrack Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #081120; color: #f1f5f9; border-radius: 12px; border: 1px solid #1e3a8a;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 28px; font-weight: bold;">ProTrack</h1>
          </div>
          <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">Hello ${user.name},</p>
          <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">You requested a password reset for your ProTrack account. Please click the button below to set a new password:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 16px; font-weight: bold; border-radius: 9999px; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);">Reset Password</a>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
          <p style="font-size: 12px; text-align: center; color: #64748b;">© ${new Date().getFullYear()} ProTrack. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("[forgotPassword]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ── resetPassword ─────────────────────────────────────────────────────────────

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body as { password?: string };

    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const user = await User.findOne({
      resetToken: token as string,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordChangedAt = new Date();
    user.set("resetToken", undefined);
    user.set("resetTokenExpiry", undefined);
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("[resetPassword]", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
