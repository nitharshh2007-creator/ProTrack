import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Mail, Phone, Sparkles, Briefcase, XCircle } from "lucide-react";
import { useAuth } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getStoredJson, setStoredJson } from "@/lib/storage";

interface ProfileState {
  name: string;
  email: string;
  phone: string;
  position: string;
  bio: string;
  avatar?: string | null;
}

const PROFILE_STORAGE_KEY = "protrack:profile";

const createInitialProfile = (user: { name?: string; email?: string } | null): ProfileState => {
  const stored = getStoredJson<ProfileState | null>(PROFILE_STORAGE_KEY, null);
  return stored ?? {
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    position: "Product Designer",
    bio: "Crafting modern workflows, polished dashboards, and delightful experiences.",
    avatar: null,
  };
};

export const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileState>(() => createInitialProfile(user));
  const [editMode, setEditMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setProfile(createInitialProfile(user));
  }, [user]);

  const initials = useMemo(() => {
    const name = profile.name || user?.name || "User";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [profile.name, user?.name]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, avatar: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setStoredJson(PROFILE_STORAGE_KEY, profile);
    if (user) {
      localStorage.setItem(
        "user",
        JSON.stringify({ ...user, name: profile.name, email: profile.email })
      );
    }
    setEditMode(false);
    setStatusMessage("Profile saved locally for this workspace.");
  };

  const handleCancel = () => {
    setProfile(createInitialProfile(user));
    setEditMode(false);
    setStatusMessage("");
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[32px] overflow-hidden border border-white/10 shadow-card"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-[#101728] px-6 py-12 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.25),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.18),_transparent_35%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Profile</p>
              <h1 className="text-3xl font-semibold text-white">Your workspace identity</h1>
              <p className="max-w-2xl text-sm text-slate-400">
                Personalize your account, workspace details, and avatar with a premium profile experience.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg">
              <Sparkles className="h-5 w-5 text-blue-300" />
              <div>
                <p className="text-sm font-semibold text-white">Workspace</p>
                <p className="text-xs text-slate-400">{user?.workspaceId ?? "No workspace assigned"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-8">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-6 shadow-inner">
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                  <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-slate-900 shadow-lg">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="Avatar preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-slate-200">{initials}</span>
                    )}
                    <div className="absolute inset-0 bg-black/15" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Account</p>
                    <p className="text-xl font-semibold text-white">{profile.name}</p>
                    <p className="text-sm text-slate-400">{profile.email}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{user?.role ?? "Member"}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{profile.position}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-[#0b1626]/80 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Profile details</p>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-3 text-slate-300">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {profile.email}
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {profile.phone || "Phone not added"}
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      {profile.position}
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[#0b1626]/80 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Workspace membership</p>
                  <div className="mt-4 space-y-4">
                    <div className="rounded-3xl bg-white/5 p-4 text-sm text-slate-300">
                      Role: <span className="font-semibold text-white">{user?.role ?? "Member"}</span>
                    </div>
                    <div className="rounded-3xl bg-white/5 p-4 text-sm text-slate-300">
                      Workspace ID: <span className="font-semibold text-white">{user?.workspaceId ?? "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#0b1626]/80 p-6 shadow-inner">
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Profile editor</p>
                      <p className="text-sm text-slate-500">Update your personal details and resume your workspace workflow.</p>
                    </div>
                    <Button variant="secondary" onClick={() => setEditMode((prev) => !prev)}>
                      {editMode ? "Viewing" : "Edit Profile"}
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <Input
                      id="profile-name"
                      label="Full name"
                      value={profile.name}
                      onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                      disabled={!editMode}
                    />
                    <Input
                      id="profile-email"
                      label="Email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                      disabled={!editMode}
                    />
                    <Input
                      id="profile-phone"
                      label="Phone"
                      value={profile.phone}
                      onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                      disabled={!editMode}
                    />
                    <Input
                      id="profile-position"
                      label="Position"
                      value={profile.position}
                      onChange={(e) => setProfile((prev) => ({ ...prev, position: e.target.value }))}
                      disabled={!editMode}
                    />
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bio</label>
                      <textarea
                        rows={4}
                        value={profile.bio}
                        onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                        disabled={!editMode}
                        className="min-h-[112px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-[#0f172a]/80 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Avatar</p>
                          <p className="text-sm text-slate-500">Upload a custom profile image for your workspace.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-blue-600/10 px-3 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-600/15">
                            <Camera className="h-4 w-4" />
                            <span>Upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file);
                              }}
                              disabled={!editMode}
                            />
                          </label>
                          <Button variant="ghost" onClick={() => setProfile((prev) => ({ ...prev, avatar: null }))} disabled={!editMode}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {profile.avatar && (
                        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-black/30">
                          <img src={profile.avatar} alt="Preview avatar" className="h-40 w-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-400">
                      {statusMessage || "Your settings are saved locally in the browser."}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="secondary" onClick={handleCancel} disabled={!editMode}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={!editMode}>
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
