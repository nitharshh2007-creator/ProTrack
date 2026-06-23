/**
 * resolveWorkspace — shared helper used by all controllers.
 *
 * New JWTs carry workspaceId directly (fast path).
 * Old JWTs issued before the workspace refactor don't — we fall back to
 * a DB lookup so those users don't get surprise 401s after the upgrade.
 *
 * For admins that somehow still lack a workspace (pre-migration accounts),
 * we auto-create one on-demand so they are never blocked.
 */
import { Types } from "mongoose";
import User from "../models/User.ts";
import Workspace from "../models/Workspace.ts";

export const resolveWorkspaceId = async (
  userId: string,
  jwtWorkspaceId?: string
): Promise<string | null> => {
  // Fast path — JWT already has it
  if (jwtWorkspaceId) return jwtWorkspaceId;

  // DB lookup
  const user = await User.findById(userId).select("workspaceId name role").lean();
  if (!user) return null;

  if (user.workspaceId) return user.workspaceId.toString();

  // Auto-create workspace for admins who pre-date the workspace feature
  if (user.role === "admin") {
    const ws = await Workspace.create({
      name: `${(user.name as string).trim()}'s Workspace`,
      ownerId: new Types.ObjectId(userId),
    });
    await User.findByIdAndUpdate(userId, { workspaceId: ws._id });
    return ws._id.toString();
  }

  return null;
};

export const toOid = (id: string) => new Types.ObjectId(id);
