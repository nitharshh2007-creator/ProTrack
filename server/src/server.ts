import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { createServer } from "http";
import connectDB from "./config/db.ts";
import authRoutes from "./routes/authRoutes.ts";
import dashboardRoutes from "./routes/dashboard.routes.ts";
import commentRoutes from "./routes/comment.routes.ts";
import projectRoutes from "./routes/project.routes.ts";
import notificationRoutes from "./routes/notification.routes.ts";
import reportRoutes from "./routes/report.routes.ts";
import taskRoutes from "./routes/task.routes.ts";
import userRoutes from "./routes/user.routes.ts";
import analyticsRoutes from "./routes/analytics.routes.ts";
import inviteRoutes from "./routes/invite.routes.ts";
import teamRoutes from "./routes/team.routes.ts";
import { initializeSocket } from "./realtime/socket.ts";
import { sendDeadlineNotifications } from "./services/notification.service.ts";
import settingsRoutes from "./routes/settings.routes.ts";
dotenv.config();

connectDB();

const app = express();
const server = createServer(app);

app.use(helmet({
  crossOriginResourcePolicy: false // disable if loading client resources directly
}));
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CLIENT_URL || "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (process.env.NODE_ENV === "development") {
      const devBypassRoutes = ["/api/team", "/api/auth/me", "/api/notifications", "/api/dashboard", "/api/invites"];
      return devBypassRoutes.some(route => req.path.startsWith(route));
    }
    return false;
  }
});

app.use(limiter);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/team", teamRoutes);

app.get("/", (_req, res) => { res.send("ProTrack API Running..."); });

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }
  next(err);
});

const PORT = process.env.PORT || 5000;

mongoose.connection.once("open", () => {
  initializeSocket(server);
  void sendDeadlineNotifications();
  setInterval(() => {
    void sendDeadlineNotifications();
  }, 60 * 60 * 1000);
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
