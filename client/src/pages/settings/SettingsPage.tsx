import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Palette, Bell, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { settingsService } from "@/services";
import type { SettingsData } from "@/services";
import { useTheme } from "@/store/theme.store";

type NotificationKey = keyof SettingsData["notifications"];

export const SettingsPage = () => {
  const { density, updateDensity } = useTheme();
  const [notifications, setNotifications] = useState<SettingsData["notifications"]>({
    email: true,
    projectUpdates: true,
    taskReminders: true,
    teamInvites: true,
  });
  const [animations, setAnimations] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getSettings();
        setNotifications(settings.notifications);
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  const updateNotification = (key: NotificationKey, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingsService.updateSettings({ notifications });
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="rounded-[18px] border border-white/5 bg-[#111827] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-1/4 mb-2"></div>
            <div className="h-8 bg-slate-700 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-hero"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.15),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.05),_transparent_45%)]" />
        <div className="relative space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400/80">Workspace Settings</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none">Settings</h1>
          <p className="text-sm md:text-base text-[#CBD5E1] max-w-2xl leading-relaxed">Customize your ProTrack experience</p>
        </div>
      </motion.div>

      <div className="grid gap-8">
        {/* Appearance Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[18px] border border-white/5 bg-[#111827] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-violet-500/20 rounded-lg border border-violet-500/30">
              <Palette className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#F8FAFC]">Appearance</h2>
              <p className="text-slate-400">Customize the look and feel of your workspace</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Theme</label>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
                <p className="font-semibold text-blue-400">Dark Mode (Default)</p>
                <p className="text-sm text-slate-400 mt-1">ProTrack now runs exclusively in a high-contrast premium dark theme to ensure visual consistency.</p>
              </div>
            </div>

            {/* Density Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Density</label>
              <div className="grid grid-cols-2 gap-3">
                {(["compact", "comfortable"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => updateDensity(option)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      density === option
                        ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20"
                        : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:shadow-lg hover:shadow-slate-500/10"
                    }`}
                  >
                    <p className={`font-medium capitalize ${density === option ? "text-blue-300" : "text-slate-300"}`}>
                      {option}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {option === "compact" ? "More information per screen" : "Spacious layout"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Animations Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/30">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Animations</p>
                <p className="text-sm text-slate-400">Enable smooth transitions and effects</p>
              </div>
              <button
                onClick={() => setAnimations(!animations)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  animations ? "bg-blue-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    animations ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
            className="rounded-[18px] border border-white/5 bg-[#111827] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
              <Bell className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#F8FAFC]">Notifications</h2>
              <p className="text-slate-400">Choose which alerts to receive</p>
            </div>
          </div>

          <div className="space-y-4">
            {(
              [
                { key: "email", label: "Email notifications", description: "Receive updates via email" },
                { key: "projectUpdates", label: "Project updates", description: "Get notified when projects change" },
                { key: "taskReminders", label: "Task reminders", description: "Reminders before task due dates" },
                { key: "teamInvites", label: "Team invitations", description: "Notifications for team invites" },
              ] as const
            ).map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 rounded-lg hover:bg-white dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{item.label}</p>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
                <button
                  onClick={() => updateNotification(item.key, !notifications[item.key])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[item.key] ? "bg-blue-600" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      notifications[item.key] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-300">Save your preferences</p>
            <p className="text-sm text-slate-400">Changes will be applied immediately</p>
          </div>
          <Button 
            onClick={handleSave} 
            loading={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-slate-900 dark:text-slate-100 px-6 py-2"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
