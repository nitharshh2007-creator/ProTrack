import { useState } from "react";
import { ShieldCheck, Cog, User, Moon, Sun } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export const SettingsPage = () => {
  const [profile, setProfile] = useState({ name: "Jordan Blake", email: "jordan@protrack.com" });
  const [account, setAccount] = useState({ plan: "Premium", notifications: true });
  const [password, setPassword] = useState({ current: "", newPassword: "", confirm: "" });
  const [theme, setTheme] = useState("dark");
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-white/10 bg-glass p-7 shadow-card backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Settings</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50">Configure your workspace</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Manage your profile, security and brand experience from one polished control panel.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-fuchsia-400" />
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Profile settings</h2>
              <p className="text-sm text-slate-400">Your display information and contact details.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <Input label="Full name" value={profile.name} onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))} />
            <Input label="Email address" type="email" value={profile.email} onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))} />
            <Button onClick={() => setMessage("Profile updated successfully.")}>Save profile</Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-cyan-400" />
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Account security</h2>
              <p className="text-sm text-slate-400">Protect your login and account access.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <Input label="Current password" type="password" value={password.current} onChange={(e) => setPassword((prev) => ({ ...prev, current: e.target.value }))} />
            <Input label="New password" type="password" value={password.newPassword} onChange={(e) => setPassword((prev) => ({ ...prev, newPassword: e.target.value }))} />
            <Input label="Confirm password" type="password" value={password.confirm} onChange={(e) => setPassword((prev) => ({ ...prev, confirm: e.target.value }))} />
            <Button variant="secondary" onClick={() => setMessage("Password change requested. Confirm via email.")}>Change password</Button>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <Cog className="h-6 w-6 text-violet-400" />
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Theme settings</h2>
            <p className="text-sm text-slate-400">Personalize the app aesthetic and sidebar appearance.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <button
            onClick={() => setTheme("dark")}
            className={`rounded-[28px] border p-5 text-left transition ${theme === "dark" ? "border-fuchsia-400/50 bg-slate-900/90" : "border-white/10 bg-slate-950/70"}`}
          >
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-slate-100" />
              <div>
                <p className="font-semibold text-slate-100">Dark mode</p>
                <p className="text-sm text-slate-400">Elegant low-light interface.</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setTheme("light")}
            className={`rounded-[28px] border p-5 text-left transition ${theme === "light" ? "border-fuchsia-400/50 bg-slate-900/90" : "border-white/10 bg-slate-950/70"}`}
          >
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-slate-100" />
              <div>
                <p className="font-semibold text-slate-100">Light mode</p>
                <p className="text-sm text-slate-400">Brighter layout for day use.</p>
              </div>
            </div>
          </button>
        </div>
      </Card>

      {message && (
        <div className="rounded-3xl bg-slate-950/80 px-5 py-4 text-sm text-slate-100 shadow-card">
          {message}
        </div>
      )}
    </div>
  );
};
