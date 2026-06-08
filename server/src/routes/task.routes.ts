import express from "express";
import {
  createTask,
  deleteTask,
  getMyTasks,
  getTaskById,
  getTasks,
  updateTask,
} from "../controllers/task.controller.ts";
import verifyToken from "../middleware/auth.middleware.ts";
import authorize from "../middleware/authorize.middleware.ts";

const router = express.Router();

// POST /api/tasks
// Body:
// {
//   "title": "Design Login UI",
//   "description": "Create the login screen layout",
//   "startDate": "2026-06-01",
//   "dueDate": "2026-06-05",
//   "project": "<projectId>",
//   "assignedTo": "<userId>",
//   "status": "Todo",
//   "priority": "Medium"
// }
router.post("/", verifyToken, authorize("admin", "manager"), createTask);

// GET /api/tasks/my-tasks
router.get("/my-tasks", verifyToken, getMyTasks);

// GET /api/tasks
router.get("/", verifyToken, getTasks);

// GET /api/tasks/:id
router.get("/:id", verifyToken, getTaskById);

// PUT /api/tasks/:id
// Supports updating startDate and dueDate. startDate must be <= dueDate.
router.put("/:id", verifyToken, authorize("admin", "manager"), updateTask);

// DELETE /api/tasks/:id
router.delete("/:id", verifyToken, authorize("admin"), deleteTask);

export default router;
