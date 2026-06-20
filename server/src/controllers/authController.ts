import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

    // Create workspace first so we can reference it on the user
    const workspace = await Workspace.create({
      name: `${name.trim()}'s Workspace`,
      ownerId: null, // placeholder — will be updated after user creation
    });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
      workspaceId: workspace._id,
    });

    // Back-fill ownerId now that we have the user id
    workspace.ownerId = user._id;
    await workspace.save();

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
