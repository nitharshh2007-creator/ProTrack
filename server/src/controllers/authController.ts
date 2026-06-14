import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.ts";
import type { AuthRequest } from "../types/auth.types.ts";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    const ALLOWED_REGISTER_ROLES = ["employee", "admin"] as const;
    type AllowedRole = (typeof ALLOWED_REGISTER_ROLES)[number];

    const isAllowedRole = (v: unknown): v is AllowedRole =>
      typeof v === "string" && (ALLOWED_REGISTER_ROLES as readonly string[]).includes(v);

    if (role !== undefined && !isAllowedRole(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'employee' or 'admin'" });
    }

    const normalizedRole: AllowedRole = isAllowedRole(role) ? role : "employee";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const profile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};