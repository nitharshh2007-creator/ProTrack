import api from "@/lib/axios";

export interface WorkspaceData {
  id: string;
  name: string;
  ownerId: string;
}

export const workspaceService = {
  getWorkspace: () =>
    api.get<WorkspaceData>("/workspace").then((r) => r.data),

  updateWorkspace: (name: string) =>
    api.put<WorkspaceData>("/workspace", { name }).then((r) => r.data),
};
