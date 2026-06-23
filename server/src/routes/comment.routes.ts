import express from "express";
import {
  createComment,
  deleteComment,
  getCommentsByTask,
} from "../controllers/comment.controller.ts";
import verifyToken from "../middleware/auth.middleware.ts";

const router = express.Router();

router.post("/", verifyToken, createComment);
router.get("/task/:taskId", verifyToken, getCommentsByTask);
router.delete("/:id", verifyToken, deleteComment);

export default router;
