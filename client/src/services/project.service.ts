import api from "@/lib/axios";
import type { CreateProjectPayload, KanbanBoard, Project, ProjectProgress, TimelineResponse, UpdateProjectPayload } from "@/types";

export const projectService = {
  getAll: () =>
    api.get<{ projects: Project[] }>("/projects").then((r) => r.data.projects),

  getById: (id: string) =>
    api.get<{ project: Project }>(`/projects/${id}`).then((r) => r.data.project),

  create: (payload: CreateProjectPayload) =>
    api.post<{ message: string; project: Project }>("/projects", payload).then((r) => r.data),

  update: (id: string, payload: UpdateProjectPayload) =>
    api.put<{ message: string; project: Project }>(`/projects/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/projects/${id}`).then((r) => r.data),

  getProgress: (id: string) =>
    api.get<ProjectProgress>(`/projects/${id}/progress`).then((r) => r.data),

  getKanban: (id: string) =>
    api.get<KanbanBoard>(`/projects/${id}/kanban`).then((r) => r.data),

  getTimeline: (id: string) =>
    api.get<TimelineResponse>(`/projects/${id}/timeline`).then((r) => r.data),
};
