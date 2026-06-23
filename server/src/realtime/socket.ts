import type { Server as HttpServer } from "http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { AuthUserPayload } from "../types/auth.types.ts";
import type { INotification } from "../models/Notification.ts";

let io: SocketIOServer | null = null;

export const initializeSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error("Unauthorized"));

      const secret = process.env.JWT_SECRET;
      if (!secret) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, secret);
      if (typeof decoded === "string") return next(new Error("Unauthorized"));

      const payload = decoded as JwtPayload & AuthUserPayload;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as AuthUserPayload | undefined;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    socket.join(user.userId);
    if (user.workspaceId) {
      socket.join(user.workspaceId);
    }
  });

  return io;
};

const getIo = () => io;

export const emitNotificationCreated = (notification: INotification) => {
  const server = getIo();
  if (!server) return;
  server.to(notification.userId.toString()).emit("notification:new", notification);
};

export const emitNotificationUpdated = (notification: INotification) => {
  const server = getIo();
  if (!server) return;
  server.to(notification.userId.toString()).emit("notification:updated", notification);
};

export const emitNotificationDeleted = (notification: INotification | { userId: { toString: () => string } }) => {
  const server = getIo();
  if (!server) return;
  server.to(notification.userId.toString()).emit("notification:deleted", notification);
};

export const emitDashboardRefresh = (workspaceId: string) => {
  const server = getIo();
  if (!server) return;
  server.to(workspaceId).emit("dashboard:refresh", { workspaceId });
};

export const emitAnalyticsRefresh = (workspaceId: string) => {
  const server = getIo();
  if (!server) return;
  server.to(workspaceId).emit("analytics:refresh", { workspaceId });
};

export const emitAnalyticsRefreshToUser = (userId: string) => {
  const server = getIo();
  if (!server) return;
  server.to(userId).emit("analytics:refresh", { userId });
};
