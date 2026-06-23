import express from "express";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjectKanban,
  getProjects,
  getProjectProgress,
  getProjectTimeline,
  updateProject,
  uploadCoverImage,
  getProjectMembers,
} from "../controllers/project.controller.ts";
import verifyToken from "../middleware/auth.middleware.ts";
import authorize from "../middleware/authorize.middleware.ts";

const router = express.Router();

router.post("/", verifyToken, authorize("admin"), createProject);
router.get("/", verifyToken, getProjects);
router.get("/:id/timeline", verifyToken, getProjectTimeline);
router.get("/:id/kanban", verifyToken, getProjectKanban);
router.get("/:id/progress", verifyToken, getProjectProgress);
router.post("/:id/upload-cover", verifyToken, authorize("admin"), uploadCoverImage);
router.get("/:id/members", verifyToken, getProjectMembers);
router.get("/:id", verifyToken, getProjectById);
router.put("/:id", verifyToken, authorize("admin", "manager"), updateProject);
router.patch("/:id", verifyToken, authorize("admin", "manager"), updateProject);
router.delete("/:id", verifyToken, authorize("admin"), deleteProject);

export default router;