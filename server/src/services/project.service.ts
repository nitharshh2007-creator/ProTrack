import Project from "../models/Project.ts";
import Notification from "../models/Notification.ts";
import User from "../models/User.ts";
import type { Types } from "mongoose";

export const assignTeamMembersToProject = async (
  projectId: Types.ObjectId,
  teamMemberIds: string[],
  projectTitle: string,
  assignedBy: string
) => {
  try {
    // Add team members to project
    const project = await Project.findByIdAndUpdate(
      projectId,
      { teamMembers: teamMemberIds.map(id => new (require("mongoose").Types.ObjectId)(id)) },
      { new: true }
    );

    if (!project) return;

    // Create notifications for each assigned member
    for (const memberId of teamMemberIds) {
      await Notification.create({
        userId: memberId,
        type: "project_created",
        title: "Project Assignment",
        message: `You have been added to project ${projectTitle}`,
        relatedProjectId: projectId,
        triggeredBy: assignedBy,
        link: `/projects/${projectId}`,
      });
    }
  } catch (error) {
    console.error("[assignTeamMembersToProject]", error);
    throw error;
  }
};

export const getProjectTeamMembers = async (projectId: Types.ObjectId) => {
  try {
    const project = await Project.findById(projectId)
      .populate("teamMembers", "name email role")
      .lean();

    return project?.teamMembers || [];
  } catch (error) {
    console.error("[getProjectTeamMembers]", error);
    return [];
  }
};
