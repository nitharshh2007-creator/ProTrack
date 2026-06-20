import { useEffect, useMemo, useState } from "react";
import { Cog, Sparkles, Bell, Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion"; // Import motion
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Chip } from "@/components/ui/Chip";
import { getStoredJson, setStoredJson } from "@/lib/storage";

const STORAGE_KEY = "protrack:settings";

type ThemeOption = "dark" | "light" | "system";

type AccentOption = "blue" | "purple" | "indigo" | "emerald";

type DensityOption = "compact" | "comfortable";
type AppearanceValue<K extends keyof SettingsState["appearance"]> = SettingsState["appearance"][K];

interface SettingsState {
  appearance: {
    theme: ThemeOption;
    accent: AccentOption;
    density: DensityOption;
    animations: boolean;
    blur: boolean;
    sound: boolean;
  };
  notifications: {
    email: boolean;
    projectUpdates: boolean;
    taskReminders: boolean;
    teamInvites: boolean;
  };
  account: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
}

const defaultSettings: SettingsState = {
  appearance: {
    theme: "light",
    accent: "blue",
    density: "comfortable",
    animations: true,
    blur: true,
    sound: false,
  },
  notifications: {
    email: true,
    projectUpdates: true,
    taskReminders: true,
    teamInvites: true,
  },
  account: {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  },
};

export const SettingsPage = () => {
  const [settings, setSettings] = useState<SettingsState>(() => getStoredJson<SettingsState>(STORAGE_KEY, defaultSettings));
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    setStoredJson(STORAGE_KEY, settings);
  }, [settings]);

  const accentPalette = useMemo(
    () => ({
      blue: "#2563EB",
      purple: "#7C3AED",
      indigo: "#4F46E5",
      emerald: "#10B981",
    }),
    []
  );

  const updateAppearance = <K extends keyof SettingsState["appearance"]>(key: K, value: AppearanceValue<K>) => {
    setSettings((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, [key]: value },
    }));
  };

  const updateNotifications = (key: keyof SettingsState["notifications"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const updateAccount = (key: keyof SettingsState["account"], value: string) => {
    setSettings((prev) => ({
      ...prev,
      account: { ...prev.account, [key]: value },
    }));
  };

  const handleSaveAccount = () => {
    if (settings.account.newPassword && settings.account.newPassword !== settings.account.confirmPassword) {
      setPasswordError("New passwords do not match.");
      setSuccessMessage("");
      return;
    }
    setPasswordError("");
    setSuccessMessage("Settings saved locally. Account changes will apply when connected.");
    setSettings((prev) => ({
      ...prev,
      account: { ...prev.account, currentPassword: "", newPassword: "", confirmPassword: "" },
    }));
  };

  return (
    <motion.div // Framer Motion for page load
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8"
    >
      <Card className="p-8"> {/* Use Card component for consistent styling */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-blue-600">Workspace settings</p> {/* Adjusted text color for light theme */}
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">Customize your ProTrack experience</h1> {/* Adjusted text color for light theme */}
            <p className="mt-3 text-sm text-gray-600"> {/* Adjusted text color for light theme */}
              Choose your theme, manage notifications, and secure your account with a polished control center.
            </p>
          </div>
          <Card className="px-5 py-4 text-sm text-gray-700"> {/* Use Card component here too */}
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-blue-500" /> {/* Adjusted text color for light theme */}
              <div>
                <p className="font-semibold text-gray-900">Saved locally</p> {/* Adjusted text color for light theme */}
                <p className="text-xs text-gray-500">Your preferences persist in this browser.</p> {/* Adjusted text color for light theme */}
              </div>
            </div>
          </Card>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] max-w-7xl mx-auto"> {/* Added max-width and auto margins for content centering */}
        <div className="space-y-6">
          <Card className="space-y-6"> {/* Rely on Card component for styling */}
            <div className="flex items-center gap-3">
              <Cog className="h-6 w-6 text-violet-600" /> {/* Adjusted icon color */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Appearance</h2> {/* Adjusted text color */}
                <p className="text-sm text-gray-600">Set the overall theme and visual tone for your workspace.</p> {/* Adjusted text color */}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {(["dark", "light", "system"] as ThemeOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => updateAppearance("theme", option)}
                  className={`rounded-3xl border p-4 text-left transition ${settings.appearance.theme === option ? "border-blue-400/40 bg-blue-500/10" : "border-gray-200 bg-white hover:border-gray-300"}`} // Light theme styling
                >
                  <p className="text-sm font-semibold text-gray-900 capitalize">{option}</p> {/* Adjusted text color */}
                  <p className="mt-2 text-xs text-gray-500">{option === "system" ? "Follow device preferences" : option === "dark" ? "Low-light mode" : "Brighter mode"}</p> {/* Adjusted text color */}
                </button>
              ))}
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Accent color</p> {/* Adjusted text color */}
              <div className="mt-3 flex flex-wrap gap-3">
                {(["blue", "purple", "indigo", "emerald"] as AccentOption[]).map((accent) => (
                  <button
                    key={accent}
                    type="button"
                    onClick={() => updateAppearance("accent", accent)}
                    className={`flex items-center gap-3 rounded-3xl border px-4 py-3 text-sm font-semibold transition ${settings.appearance.accent === accent ? "border-blue-400/40 bg-blue-500/10 text-blue-800" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`} // Light theme styling
                  >
                    <span className="h-3 w-3 rounded-full" style={{ background: accentPalette[accent] }} />
                    {accent}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {(["compact", "comfortable"] as DensityOption[]).map((density) => (
                <button
                  key={density}
                  onClick={() => updateAppearance("density", density)}
                  className={`rounded-3xl border p-4 text-left transition ${settings.appearance.density === density ? "border-blue-400/40 bg-blue-500/10" : "border-gray-200 bg-white hover:border-gray-300"}`} // Light theme styling
                >
                  <p className="text-sm font-semibold text-gray-900 capitalize">{density}</p>
                  <p className="mt-2 text-xs text-gray-600">{density === "compact" ? "More information per page" : "Airy layout with spacing"}</p>
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Toggle checked={settings.appearance.animations} onChange={(value) => updateAppearance("animations", value)} label="Animations" />
              <Toggle checked={settings.appearance.blur} onChange={(value) => updateAppearance("blur", value)} label="Blur effects" />
              <Toggle checked={settings.appearance.sound} onChange={(value) => updateAppearance("sound", value)} label="Sound effects" />
            </div>
          </Card>

          <Card className="space-y-6"> {/* Rely on Card component for styling */}
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-cyan-600" /> {/* Adjusted icon color */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2> {/* Adjusted text color */}
                <p className="text-sm text-gray-600">Choose which alerts keep you informed.</p> {/* Adjusted text color */}
              </div>
            </div>

            <div className="grid gap-4">
              {(
                [
                  { key: "email", label: "Email notifications", description: "Receive updates by email." },
                  { key: "projectUpdates", label: "Project updates", description: "Stay informed when projects change." },
                  { key: "taskReminders", label: "Task reminders", description: "Get notified before due dates." },
                  { key: "teamInvites", label: "Team invitations", description: "Know when new members join." },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => updateNotifications(item.key, !settings.notifications[item.key])}
                  className={`group flex items-center justify-between rounded-3xl border px-4 py-4 text-left transition ${settings.notifications[item.key] ? "border-blue-400/40 bg-blue-500/10" : "border-gray-200 bg-white hover:border-gray-300"}`} // Light theme styling
                >
                  <div>
                    <p className="font-semibold text-gray-900">{item.label}</p> {/* Adjusted text color */}
                    <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                  </div>
                  <span className={`inline-flex h-6 w-10 items-center justify-center rounded-full text-[11px] font-semibold ${settings.notifications[item.key] ? "bg-blue-600/10 text-blue-600" : "bg-gray-100 text-gray-500"}`}> {settings.notifications[item.key] ? "On" : "Off"}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6"> {/* Right column */}
          <Card className="space-y-6"> {/* Rely on Card component for styling */}
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-emerald-600" /> {/* Adjusted icon color */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Account</h2> {/* Adjusted text color */}
                <p className="text-sm text-gray-600">Secure your account and manage session settings.</p> {/* Adjusted text color */}
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Current password"
                type="password"
                value={settings.account.currentPassword}
                onChange={(e) => updateAccount("currentPassword", e.target.value)}
              />
              <Input
                label="New password"
                type="password"
                value={settings.account.newPassword}
                onChange={(e) => updateAccount("newPassword", e.target.value)}
              />
              <Input
                label="Confirm new password"
                type="password"
                value={settings.account.confirmPassword}
                onChange={(e) => updateAccount("confirmPassword", e.target.value)}
              />
              {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
              <div className="flex flex-wrap gap-3"> {/* Added Framer Motion to buttons */}
                <Button
                  onClick={handleSaveAccount}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Change password
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setSettings(defaultSettings)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Reset appearance
                </Button>
              </div>
            </div>
          </Card>

          <Card className="space-y-4 bg-gradient-to-br from-white/90 via-white/80 to-gray-50/90 border-gray-200"> {/* Light gradient for preview card */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Workspace preview</p> {/* Adjusted text color */}
                <p className="text-sm text-gray-600">A glance at your selected theme and system controls.</p> {/* Adjusted text color */}
              </div>
              <Chip active>{settings.appearance.theme}</Chip>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4"> {/* Light theme styling */}
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Accent</p> {/* Adjusted text color */}
                <div className="mt-3 h-10 rounded-3xl" style={{ background: `linear-gradient(135deg, ${accentPalette[settings.appearance.accent]}, ${accentPalette[settings.appearance.accent]}99)` }} />
              </div>
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4"> {/* Light theme styling */}
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Details</p> {/* Adjusted text color */}
                <div className="mt-3 space-y-2 text-sm text-gray-700"> {/* Adjusted text color */}
                  <p>Density: <span className="text-gray-900">{settings.appearance.density}</span></p> {/* Adjusted text color */}
                  <p>Blur: <span className="text-gray-900">{settings.appearance.blur ? "Enabled" : "Disabled"}</span></p> {/* Adjusted text color */}
                  <p>Animations: <span className="text-gray-900">{settings.appearance.animations ? "Enabled" : "Reduced"}</span></p> {/* Adjusted text color */}
                </div>
              </div>
            </div>
            {successMessage && <p className="rounded-3xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">{successMessage}</p>}
          </Card>
        </div>
      </div>
      
      <Card className="p-6"> {/* Use Card component for consistent styling */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Need help?</p> {/* Adjusted text color */}
            <h2 className="text-xl font-semibold text-gray-900">Reach out for support or workspace setup.</h2> {/* Adjusted text color */}
          </div>
          <Button
            variant="secondary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowRight className="h-4 w-4" /> Contact support
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
