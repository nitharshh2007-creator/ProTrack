import type { Request, Response } from "express";
import User from "../models/User.ts";

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select("_id name email role");
    return res.status(200).json({ users });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};
