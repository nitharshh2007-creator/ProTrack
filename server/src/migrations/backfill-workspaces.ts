/**
 * Migration: backfill workspaceId on all Users, Projects, and Tasks.
 *
 * Strategy:
 *   1. For each admin user that has no workspaceId:
 *      - Create a Workspace owned by that admin.
 *      - Set workspaceId on the admin user.
 *   2. For each non-admin user with no workspaceId:
 *      - Find the first admin (oldest) and assign them to that workspace.
 *   3. For each Project with no workspaceId:
 *      - Look up the createdBy user's workspaceId and apply it.
 *   4. For each Task with no workspaceId:
 *      - Look up the parent project's workspaceId and apply it.
 *
 * Run once:
 *   npx ts-node --esm src/migrations/backfill-workspaces.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.ts";
import Workspace from "../models/Workspace.ts";
import Project from "../models/Project.ts";
import Task from "../models/Task.ts";

dotenv.config();

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set in .env");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  // ── 1. Create workspaces for admins without one ───────────────────────────
  const adminsWithoutWS = await User.find({ role: "admin", workspaceId: { $exists: false } });
  console.log(`Found ${adminsWithoutWS.length} admin(s) without a workspace`);

  for (const admin of adminsWithoutWS) {
    const ws = await Workspace.create({
      name: `${admin.name}'s Workspace`,
      ownerId: admin._id,
    });
    admin.workspaceId = ws._id;
    await admin.save();
    console.log(`  Created workspace "${ws.name}" for admin ${admin.email}`);
  }

  // ── 2. Assign non-admin users to the first admin's workspace ──────────────
  const fallbackAdmin = await User.findOne({ role: "admin" }).sort({ createdAt: 1 });

  if (fallbackAdmin?.workspaceId) {
    const result = await User.updateMany(
      { workspaceId: { $exists: false } },
      { $set: { workspaceId: fallbackAdmin.workspaceId } }
    );
    console.log(
      `Assigned ${result.modifiedCount} non-admin user(s) to workspace ${fallbackAdmin.workspaceId}`
    );
  } else {
    console.warn("No admin with a workspace found — skipping non-admin user backfill");
  }

  // ── 3. Backfill workspaceId on Projects ───────────────────────────────────
  const projectsWithoutWS = await Project.find({ workspaceId: { $exists: false } });
  console.log(`Found ${projectsWithoutWS.length} project(s) without workspaceId`);

  for (const project of projectsWithoutWS) {
    const creator = await User.findById(project.createdBy).select("workspaceId");
    if (creator?.workspaceId) {
      project.workspaceId = creator.workspaceId;
      await project.save();
    } else if (fallbackAdmin?.workspaceId) {
      project.workspaceId = fallbackAdmin.workspaceId;
      await project.save();
    } else {
      console.warn(`  Skipped project ${project._id} — no workspace found`);
    }
  }
  console.log(`Backfilled workspaceId on ${projectsWithoutWS.length} project(s)`);

  // ── 4. Backfill workspaceId on Tasks ──────────────────────────────────────
  const tasksWithoutWS = await Task.find({ workspaceId: { $exists: false } });
  console.log(`Found ${tasksWithoutWS.length} task(s) without workspaceId`);

  for (const task of tasksWithoutWS) {
    const parentProject = await Project.findById(task.project).select("workspaceId");
    if (parentProject?.workspaceId) {
      task.workspaceId = parentProject.workspaceId;
      await task.save();
    } else if (fallbackAdmin?.workspaceId) {
      task.workspaceId = fallbackAdmin.workspaceId;
      await task.save();
    } else {
      console.warn(`  Skipped task ${task._id} — no workspace found`);
    }
  }
  console.log(`Backfilled workspaceId on ${tasksWithoutWS.length} task(s)`);

  await mongoose.disconnect();
  console.log("Migration complete.");
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
