import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Lock, X, Mail, Calendar, ChevronRight, User, Shield, Building, Info, Laptop } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth.store";
import { authService, workspaceService } from "@/services";
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
  const [workspaceName, setWorkspaceName] = useState("ProTrack Team");
  const [initialWorkspaceName, setInitialWorkspaceName] = useState("ProTrack Team");

  useEffect(() => {
    setProfile(createInitialProfile(user));
    workspaceService.getWorkspace()
      .then((ws) => {
        setWorkspaceName(ws.name);
        setInitialWorkspaceName(ws.name);
      })
      .catch((err) => console.error("Failed to load workspace:", err));
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
    
    if (user?.role === "admin" && workspaceName !== initialWorkspaceName) {
      workspaceService.updateWorkspace(workspaceName)
        .then((ws) => {
          setInitialWorkspaceName(ws.name);
          setStatusMessage("Profile and Workspace saved successfully.");
        })
        .catch((err) => {
          console.error("Failed to update workspace name:", err);
          setStatusMessage("Profile saved, but Workspace update failed.");
        });
    } else {
      setStatusMessage("Profile saved successfully.");
    }
    
    setEditMode(false);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleCancel = () => {
    setProfile(createInitialProfile(user));
    setWorkspaceName(initialWorkspaceName);
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
    <div className="space-y-8 pb-32">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[20px] border border-slate-800 bg-[#171f33]/70 p-8 backdrop-blur-xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.15),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.05),_transparent_45%)]" />
        <div className="relative space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b4c5ff]">Account</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#dae2fd]">Profile</h1>
          <p className="text-sm md:text-base text-[#c3c6d7] max-w-2xl leading-relaxed">
            Manage your account and workspace information
          </p>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Profile Summary & Security Column */}
        <aside className="col-span-12 lg:col-span-4 space-y-8">
          {/* Profile Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[20px] border border-slate-800 bg-[#171f33]/70 p-6 backdrop-blur-xl flex flex-col items-center text-center"
          >
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-lg bg-[#2d3449] flex items-center justify-center border border-slate-700 overflow-hidden shadow-inner">
                <span className="text-3xl font-semibold text-[#b4c5ff]">{initials}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0b1326] rounded-full p-1 shadow-md">
                <div className="w-full h-full bg-emerald-500 rounded-full border-2 border-[#0b1326]" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#dae2fd]">{profile.name}</h2>
            <p className="text-sm text-[#c3c6d7] mt-1">{profile.position}</p>
            <div className="mt-3 px-3 py-1 bg-[#2563eb]/20 text-[#b4c5ff] border border-[#2563eb]/30 rounded-full text-xs font-semibold tracking-wider">
              {user?.role ?? "Member"}
            </div>
            <div className="w-full mt-6 pt-6 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center gap-3 text-[#c3c6d7] text-left">
                <Mail className="h-4 w-4 text-[#b4c5ff] flex-shrink-0" />
                <span className="text-xs truncate">{profile.email || "Add email address"}</span>
              </div>
              <div className="flex items-center gap-3 text-[#c3c6d7] text-left">
                <Calendar className="h-4 w-4 text-[#b4c5ff] flex-shrink-0" />
                <span className="text-xs">
                  Joined {memberSince.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Account Security Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-[20px] border border-slate-800 bg-[#171f33]/70 p-6 backdrop-blur-xl"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#c3c6d7] mb-4">Account Security</h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full group flex items-center justify-between p-4 rounded-lg bg-[#060e20] border border-slate-800 hover:bg-[#2d3449]/50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-[#b4c5ff]" />
                  <span className="text-sm font-medium text-[#dae2fd]">Change Password</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-[#b4c5ff] transition-colors" />
              </button>
              <button
                onClick={() => setShowActiveSessions(true)}
                className="w-full group flex items-center justify-between p-4 rounded-lg bg-[#060e20] border border-slate-800 hover:bg-[#2d3449]/50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <Laptop className="h-4 w-4 text-[#b4c5ff]" />
                  <span className="text-sm font-medium text-[#dae2fd]">Active Sessions</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-[#b4c5ff] transition-colors" />
              </button>
            </div>
          </motion.div>
        </aside>

        {/* Main Form Area Column */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Personal Information Form */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-[20px] border border-slate-800 bg-[#171f33]/70 p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <User className="h-5 w-5 text-[#b4c5ff]" />
              <h3 className="text-lg font-semibold text-[#dae2fd]">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7] uppercase tracking-wider ml-1">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={!editMode}
                  placeholder={DEFAULT_PROFILE.name}
                  className="w-full rounded-lg bg-[#060e20] border border-slate-800 px-4 py-3 text-sm text-[#dae2fd] placeholder:text-slate-500 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[#060e20]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7] uppercase tracking-wider ml-1">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                  disabled={!editMode}
                  placeholder="Add email address"
                  className="w-full rounded-lg bg-[#060e20] border border-slate-800 px-4 py-3 text-sm text-[#dae2fd] placeholder:text-slate-500 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[#060e20]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7] uppercase tracking-wider ml-1">Phone</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                  disabled={!editMode}
                  placeholder={DEFAULT_PROFILE.phone}
                  className="w-full rounded-lg bg-[#060e20] border border-slate-800 px-4 py-3 text-sm text-[#dae2fd] placeholder:text-slate-500 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[#060e20]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7] uppercase tracking-wider ml-1">Department</label>
                <input
                  type="text"
                  value={profile.department}
                  onChange={(e) => setProfile((prev) => ({ ...prev, department: e.target.value }))}
                  disabled={!editMode}
                  placeholder={DEFAULT_PROFILE.department}
                  className="w-full rounded-lg bg-[#060e20] border border-slate-800 px-4 py-3 text-sm text-[#dae2fd] placeholder:text-slate-500 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[#060e20]"
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-[#c3c6d7] uppercase tracking-wider ml-1">Position</label>
                <input
                  type="text"
                  value={profile.position}
                  onChange={(e) => setProfile((prev) => ({ ...prev, position: e.target.value }))}
                  disabled={!editMode}
                  placeholder={DEFAULT_PROFILE.position}
                  className="w-full rounded-lg bg-[#060e20] border border-slate-800 px-4 py-3 text-sm text-[#dae2fd] placeholder:text-slate-500 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[#060e20]"
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-[#c3c6d7] uppercase tracking-wider ml-1">Bio</label>
                <textarea
                  rows={4}
                  value={profile.bio}
                  onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                  disabled={!editMode}
                  placeholder={DEFAULT_PROFILE.bio}
                  className="w-full rounded-lg bg-[#060e20] border border-slate-800 px-4 py-3 text-sm text-[#dae2fd] placeholder:text-slate-500 outline-none resize-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[#060e20]"
                />
              </div>
            </div>
          </motion.section>

          {/* Workspace Information Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-[20px] border border-slate-800 bg-[#171f33]/70 p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <Building className="h-5 w-5 text-[#b4c5ff]" />
              <h3 className="text-lg font-semibold text-[#dae2fd]">Workspace Information</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-[#060e20] p-4 flex flex-col justify-between h-32">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-[shimmer_3s_infinite] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <span className="text-[10px] font-semibold text-[#c3c6d7] uppercase tracking-wider">Workspace Name</span>
                {editMode && user?.role === "admin" ? (
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full rounded bg-[#171f33] border border-slate-700 px-2 py-1.5 text-xs text-[#dae2fd] outline-none transition focus:border-[#2563eb] mt-auto"
                  />
                ) : (
                  <div className="text-base font-semibold text-[#dae2fd] truncate">{workspaceName}</div>
                )}
              </div>
              <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-[#060e20] p-4 flex flex-col justify-between h-32">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-[shimmer_3s_infinite] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <span className="text-[10px] font-semibold text-[#c3c6d7] uppercase tracking-wider">Workspace ID</span>
                <div className="text-xs font-mono text-[#b4c5ff] truncate">{user?.workspaceId ?? "Not Assigned"}</div>
              </div>
              <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-[#060e20] p-4 flex flex-col justify-between h-32">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-[shimmer_3s_infinite] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <span className="text-[10px] font-semibold text-[#c3c6d7] uppercase tracking-wider">Your Role</span>
                <div className="flex items-center gap-2 mt-auto">
                  <Shield className="h-4 w-4 text-[#b4c5ff]" />
                  <div className="text-base font-semibold text-[#dae2fd] capitalize">{user?.role ?? "Member"}</div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 px-4 md:px-8 py-4 bg-[#0b1326]/60 backdrop-blur-md border-t border-slate-850">
        <div className="max-w-7xl mx-auto rounded-xl border border-[#2563eb]/20 bg-[#171f33]/85 p-4 flex items-center justify-between shadow-2xl backdrop-blur-xl">
          <div className="hidden md:flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#b4c5ff]/10 flex items-center justify-center">
              <Info className="h-4 w-4 text-[#b4c5ff]" />
            </div>
            <p className="text-xs text-[#c3c6d7]">
              {statusMessage || "Your profile is ready to personalize."}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleCancel}
              disabled={!editMode}
              className="flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs font-semibold text-[#c3c6d7] hover:bg-[#2d3449]/50 transition-all border border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs font-semibold bg-[#2563eb] text-white hover:bg-[#2563eb]/95 transition-all shadow-lg shadow-[#2563eb]/20 active:scale-[0.98]"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs font-semibold bg-[#2563eb] text-white hover:bg-[#2563eb]/95 transition-all shadow-lg shadow-[#2563eb]/20 active:scale-[0.98]"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[20px] border border-slate-800 bg-[#171f33] p-6 shadow-2xl w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#dae2fd]">Change Password</h2>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setPasswordMessage("");
                }}
                className="text-slate-500 hover:text-[#dae2fd] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7] uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full rounded-lg bg-[#060e20] border border-slate-800 px-4 py-2.5 text-sm text-[#dae2fd] placeholder:text-slate-600 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7] uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full rounded-lg bg-[#060e20] border border-slate-800 px-4 py-2.5 text-sm text-[#dae2fd] placeholder:text-slate-600 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#c3c6d7] uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full rounded-lg bg-[#060e20] border border-slate-800 px-4 py-2.5 text-sm text-[#dae2fd] placeholder:text-slate-600 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
                />
              </div>
              {passwordMessage && (
                <p
                  className={`text-xs font-medium ${
                    passwordMessage.includes("successfully") ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
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
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-800 bg-[#060e20] hover:bg-[#2d3449]/50 text-[#c3c6d7] text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#2563eb] hover:bg-[#2563eb]/95 text-white text-xs font-semibold transition shadow-lg shadow-[#2563eb]/20"
              >
                Change Password
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Active Sessions Modal */}
      {showActiveSessions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[20px] border border-slate-800 bg-[#171f33] p-6 shadow-2xl w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#dae2fd]">Active Sessions</h2>
              <button
                onClick={() => setShowActiveSessions(false)}
                className="text-slate-500 hover:text-[#dae2fd] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-1">
              {sessionsLoading ? (
                <div className="rounded-lg bg-[#060e20] p-4 border border-slate-800">
                  <p className="text-xs text-[#c3c6d7]">Loading active sessions...</p>
                </div>
              ) : sessionsError ? (
                <div className="rounded-lg bg-rose-500/10 p-4 border border-rose-500/25">
                  <p className="text-xs font-medium text-rose-400">{sessionsError}</p>
                </div>
              ) : sessions.length > 0 ? (
                sessions.map((session) => (
                  <div key={session.id} className="rounded-lg bg-[#060e20] p-4 border border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#dae2fd]">{session.device}</p>
                        <p className="text-[10px] text-[#c3c6d7] mt-1 line-clamp-2 leading-relaxed">{session.userAgent}</p>
                        <p className="text-[10px] text-slate-500 mt-2">
                          {session.isCurrent ? "Active now" : `Last active ${new Date(session.lastActiveAt).toLocaleString()}`}
                        </p>
                      </div>
                      {session.isCurrent && (
                        <span className="rounded-full bg-[#2563eb]/20 px-2.5 py-0.5 text-[9px] font-semibold tracking-wider text-[#b4c5ff] border border-[#2563eb]/30">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-[#060e20] p-4 border border-slate-800">
                  <p className="text-xs text-[#c3c6d7]">No active sessions found.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSignOutCurrentSession}
                className="flex-1 px-4 py-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition"
              >
                Sign out this session
              </button>
              <button
                onClick={() => setShowActiveSessions(false)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#2563eb] hover:bg-[#2563eb]/95 text-white text-xs font-semibold transition shadow-lg shadow-[#2563eb]/20"
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
