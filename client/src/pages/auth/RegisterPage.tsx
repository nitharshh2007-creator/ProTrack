import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { authService } from "@/services";
import { useAuth } from "@/store/auth.store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authService.register({ ...form, role: "admin" });
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: "radial-gradient(ellipse at top, #0d1f3c 0%, #081120 60%)" }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-600/12 blur-[80px]" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-sm"
      >
        <div className="glass-card rounded-2xl p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg glow-blue">
              <span className="text-base font-black text-white">P</span>
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">ProTrack</span>
          </div>

          <h1 className="mb-1 text-2xl font-bold text-white">Create an account</h1>
          <p className="mb-5 text-sm text-slate-400">Start your workspace as admin.</p>

          <div className="mb-5 rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-3 text-xs text-blue-300">
            <strong className="font-semibold">Employee?</strong> You need an invitation link from your admin — check your email.
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Name" id="name" value={form.name} onChange={set("name")} required placeholder="Your full name" />
            <Input label="Email" id="email" type="email" value={form.email} onChange={set("email")} required placeholder="you@company.com" />
            <Input label="Password" id="password" type="password" value={form.password} onChange={set("password")} required placeholder="••••••••" />
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400"
              >
                {error}
              </motion.p>
            )}
            <Button type="submit" loading={loading} className="mt-1 w-full py-3 text-base font-bold">
              Create Admin Account
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
