import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.ts";
import authRoutes from "./routes/authRoutes.ts";
import dashboardRoutes from "./routes/dashboard.routes.ts";
import commentRoutes from "./routes/comment.routes.ts";
import projectRoutes from "./routes/project.routes.ts";
import reportRoutes from "./routes/report.routes.ts";
import taskRoutes from "./routes/task.routes.ts";
import userRoutes from "./routes/user.routes.ts";
import analyticsRoutes from "./routes/analytics.routes.ts";
import inviteRoutes from "./routes/invite.routes.ts";

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/invites", inviteRoutes);

app.get("/", (_req, res) => { res.send("ProTrack API Running..."); });

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }
  next(err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
