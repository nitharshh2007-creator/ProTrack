import api from "@/lib/axios";

export interface SettingsData {
  theme: "light" | "dark" | "system";
  density: "compact" | "comfortable";
  notifications: {
    email: boolean;
    projectUpdates: boolean;
    taskReminders: boolean;
    teamInvites: boolean;
  };
}

class SettingsService {
  async getSettings(): Promise<SettingsData> {
    const response = await api.get("/settings");
    return response.data;
  }

  async updateSettings(settings: Partial<SettingsData>): Promise<SettingsData> {
    const response = await api.put("/settings", settings);
    return response.data.settings;
  }
}

export const settingsService = new SettingsService();
