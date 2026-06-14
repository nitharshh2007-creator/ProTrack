/**
 * resolveWorkspace — shared helper used by all controllers.
 *
 * New JWTs carry workspaceId directly (fast path).
 * Old JWTs issued before the workspace refactor don't — we fall back to
 * a DB lookup so those users don't get surprise 401s after the upgrade.
 */
import { Types } from "mongoose";
import User from "../models/User.ts";

export const resolveWorkspaceId = async (
  userId: string,
  jwtWorkspaceId?: string
): Promise<string | null> => {
  if (jwtWorkspaceId) return jwtWorkspaceId;

  const user = await User.findById(userId).select("workspaceId").lean();
  return user?.workspaceId?.toString() ?? null;
};

export const toOid = (id: string) => new Types.ObjectId(id);
