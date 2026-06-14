/**
 * Migration: backfill `createdBy` on projects that are missing it.
 *
 * Strategy:
 *   1. Find the oldest admin user in the system (safest assumption for legacy data).
 *   2. Set `createdBy` on every project that lacks the field to that admin's _id.
 *
 * Run once:
 *   npx ts-node --esm src/migrations/backfill-project-owner.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "../models/Project.ts";
import User from "../models/User.ts";

dotenv.config();

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set in .env");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const fallbackAdmin = await User.findOne({ role: "admin" }).sort({ createdAt: 1 });

  if (!fallbackAdmin) {
    console.warn("No admin user found — cannot backfill. Exiting.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Using fallback admin: ${fallbackAdmin.email} (${fallbackAdmin._id})`);

  const result = await Project.updateMany(
    { createdBy: { $exists: false } },
    { $set: { createdBy: fallbackAdmin._id } }
  );

  console.log(`Backfilled createdBy on ${result.modifiedCount} project(s).`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
