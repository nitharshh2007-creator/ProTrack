import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Lock, LogOut, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth.store";
import { authService } from "@/services";
import type { ActiveSession } from "@/types";
import { getStoredJson, setStoredJson } from "@/lib/storage";

interface ProfileState {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  bio: string;
}

const PROFILE_STORAGE_KEY = "protrack:profile";

const DEFAULT_PROFILE: ProfileState = {
  name: "Your Name",
  email: "",
  phone: "Add phone number",
  position: "Team Member",
  department: "Not Assigned",
  bio: "Passionate team member contributing to projects and collaborating with colleagues to achieve workspace goals.",
};

const DEMO_VALUE_PATTERNS = [/^boss\d*$/i, /^admin@test\.com$/i, /^placeholder/i, /^developer/i, /^test@/i];

const normalizeText = (value: string | null | undefined, fallback: string) => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return fallback;
  if (DEMO_VALUE_PATTERNS.some((pattern) => pattern.test(trimmed))) return fallback;
  return trimmed;
};

const normalizeEmail = (value: string | null | undefined, fallback = "") => {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return fallback;
  if (DEMO_VALUE_PATTERNS.some((pattern) => pattern.test(trimmed))) return fallback;
  return trimmed;
};

const createInitialProfile = (user: { name?: string; email?: string } | null): ProfileState => {
  const stored = getStoredJson<ProfileState | null>(PROFILE_STORAGE_KEY, null);
  const base = {
    ...DEFAULT_PROFILE,
    name: normalizeText(user?.name, DEFAULT_PROFILE.name),
    email: normalizeEmail(user?.email, DEFAULT_PROFILE.email),
  };

  if (!stored) return base;

  return {
    ...base,
    name: normalizeText(stored.name, base.name),
    email: normalizeEmail(stored.email, base.email),
    phone: normalizeText(stored.phone, DEFAULT_PROFILE.phone),
    position: normalizeText(stored.position, DEFAULT_PROFILE.position),
    department: normalizeText(stored.department, DEFAULT_PROFILE.department),
    bio: normalizeText(stored.bio, DEFAULT_PROFILE.bio),
  };
};

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileState>(() => createInitialProfile(user));
  const [editMode, setEditMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showActiveSessions, setShowActiveSessions] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [sessionsError, setSessionsError] = useState("");
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    setProfile(createInitialProfile(user));
  }, [user]);

  useEffect(() => {
    if (!showActiveSessions) return;

    let cancelled = false;

    const loadSessions = async () => {
      setSessionsLoading(true);
      setSessionsError("");
      try {
        const data = await authService.getSessions();
        if (!cancelled) setSessions(data);
      } catch {
        if (!cancelled) {
          setSessionsError("Unable to load active sessions right now.");
          setSessions([]);
        }
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    };

    void loadSessions();

    return () => {
      cancelled = true;
    };
  }, [showActiveSessions]);

  const initials = useMemo(() => {
    const name = profile.name || user?.name || DEFAULT_PROFILE.name;
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }, [profile.name, user?.name]);

  const handleSave = () => {
    setStoredJson(PROFILE_STORAGE_KEY, profile);
    if (user) {
      localStorage.setItem("user", JSON.stringify({ ...user, name: profile.name, email: profile.email }));
    }
    setEditMode(false);
    setStatusMessage("Profile saved successfully.");
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleCancel = () => {
    setProfile(createInitialProfile(user));
    setEditMode(false);
    setStatusMessage("");
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("Passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage("Password must be at least 8 characters");
      return;
    }

    try {
      setPasswordMessage("");
      const response = await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordMessage(response.message);
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPasswordMessage("");
        logout();
        navigate("/signin", { replace: true });
      }, 1200);
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message!
          : error instanceof Error
            ? error.message
            : "Unable to change password.";
      setPasswordMessage(message);
    }
  };

  const handleSignOutCurrentSession = () => {
    logout();
    navigate("/signin", { replace: true });
  };

  const memberSince = user?.createdAt ? new Date(user.createdAt) : new Date();

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-[#101728] px-8 py-12 shadow-xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.25),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.18),_transparent_35%)]" />
        <div className="relative space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Account</p>
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <p className="text-sm text-slate-400">Manage your account and workspace information</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-8 lg:grid-cols-3"
      >
        <div className="rounded-[20px] bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 shadow-md">
          <div className="flex flex-col gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-[14px] border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 shadow-sm flex-shrink-0">
              <span className="text-lg font-bold text-slate-400 dark:text-slate-300">{initials}</span>
            </div>

            <div className="space-y-2 min-h-0">
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{profile.name}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{profile.email || "Add email address"}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{profile.position}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200/50">
                  {user?.role ?? "Member"}
                </span>
              </div>
              <p className="text-xs text-slate-500 pt-1">
                Joined {memberSince.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>
            </div>

          </div>
        </div>

        <div className="lg:col-span-2 rounded-[20px] bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-8 shadow-md">
          <p className="mb-6 text-xs uppercase tracking-[0.2em] font-semibold text-slate-700 dark:text-slate-300">Personal Information</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                disabled={!editMode}
                placeholder={DEFAULT_PROFILE.name}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-700"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                disabled={!editMode}
                placeholder="Add email address"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-700"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Phone</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                disabled={!editMode}
                placeholder={DEFAULT_PROFILE.phone}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-700"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Department</label>
              <input
                type="text"
                value={profile.department}
                onChange={(e) => setProfile((prev) => ({ ...prev, department: e.target.value }))}
                disabled={!editMode}
                placeholder={DEFAULT_PROFILE.department}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-700"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Position</label>
              <input
                type="text"
                value={profile.position}
                onChange={(e) => setProfile((prev) => ({ ...prev, position: e.target.value }))}
                disabled={!editMode}
                placeholder={DEFAULT_PROFILE.position}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-700"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Bio</label>
              <textarea
                rows={2}
                value={profile.bio}
                onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                disabled={!editMode}
                placeholder={DEFAULT_PROFILE.bio}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-700"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-[20px] bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-8 shadow-md"
      >
        <p className="mb-6 text-xs uppercase tracking-[0.2em] font-semibold text-slate-700 dark:text-slate-300">Workspace Information</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between sm:flex-col sm:items-start rounded-lg bg-slate-50/50 px-4 py-3 border border-slate-200/30">
            <span className="text-xs font-semibold uppercase text-slate-600">Workspace Name</span>
            <span className="text-slate-900 font-semibold">ProTrack Team</span>
          </div>
          <div className="flex items-center justify-between sm:flex-col sm:items-start rounded-lg bg-slate-50/50 px-4 py-3 border border-slate-200/30">
            <span className="text-xs font-semibold uppercase text-slate-600">Workspace ID</span>
            <span className="font-mono text-xs text-slate-900 font-semibold">{user?.workspaceId ?? "Not Assigned"}</span>
          </div>
          <div className="flex items-center justify-between sm:flex-col sm:items-start rounded-lg bg-slate-50/50 px-4 py-3 border border-slate-200/30">
            <span className="text-xs font-semibold uppercase text-slate-600">Your Role</span>
            <span className="font-semibold text-slate-900">{user?.role ?? "Member"}</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-[20px] bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-8 shadow-md"
      >
        <p className="mb-6 text-xs uppercase tracking-[0.2em] font-semibold text-slate-700 dark:text-slate-300">Account Security</p>
        <div className="space-y-2">
          <button
            onClick={() => setShowChangePassword(true)}
            className="w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg border border-blue-200/60 bg-white hover:bg-blue-50 hover:border-blue-300 text-blue-600 font-medium text-sm transition shadow-sm hover:shadow-md"
          >
            <Lock className="h-4 w-4 flex-shrink-0" />
            <span>Change Password</span>
          </button>
          <button
            onClick={() => setShowActiveSessions(true)}
            className="w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg border border-blue-200/60 bg-white hover:bg-blue-50 hover:border-blue-300 text-blue-600 font-medium text-sm transition shadow-sm hover:shadow-md"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span>Active Sessions</span>
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-[20px] bg-gradient-to-br from-white via-slate-50/80 to-slate-100/60 p-8 shadow-md border border-slate-200/40"
      >
        <div className="text-sm text-slate-600">{statusMessage || "Your profile is ready to personalize."}</div>
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={!editMode}
            className="px-4 py-2 rounded-lg border border-slate-200/60 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition shadow-sm hover:shadow-md"
            >
              Edit Profile
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition shadow-sm hover:shadow-md"
            >
              Save Changes
            </button>
          )}
        </div>
      </motion.div>

      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[20px] bg-white dark:bg-slate-900 p-8 shadow-xl w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Change Password</h2>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setPasswordMessage("");
                }}
                className="text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className="rounded-lg border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-blue-400 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="rounded-lg border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-blue-400 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="rounded-lg border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-blue-400 dark:focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50"
                />
              </div>
              {passwordMessage && (
                <p className={`text-xs font-medium ${passwordMessage.includes("successfully") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {passwordMessage}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setPasswordMessage("");
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white font-medium text-sm transition"
              >
                Change Password
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showActiveSessions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[20px] bg-white dark:bg-slate-900 p-8 shadow-xl w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Active Sessions</h2>
              <button onClick={() => setShowActiveSessions(false)} className="text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {sessionsLoading ? (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Loading active sessions...</p>
                </div>
              ) : sessionsError ? (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{sessionsError}</p>
                </div>
              ) : sessions.length > 0 ? (
                sessions.map((session) => (
                  <div key={session.id} className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{session.device}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{session.userAgent}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                          {session.isCurrent ? "Active now" : `Last active ${new Date(session.lastActiveAt).toLocaleString()}`}
                        </p>
                      </div>
                      {session.isCurrent && (
                        <span className="rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400">No active sessions found.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSignOutCurrentSession}
                className="flex-1 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 font-medium text-sm transition"
              >
                Sign out this session
              </button>
              <button
                onClick={() => setShowActiveSessions(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white font-medium text-sm transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
