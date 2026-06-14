import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { authService } from "@/services";
import { useAuth } from "@/store/auth.store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type RegisterRole = "employee" | "admin";

interface RoleCard {
  role: RegisterRole;
  icon: string;
  title: string;
  description: string;
}

const ROLE_CARDS: RoleCard[] = [
  {
    role: "employee",
    icon: "👤",
    title: "Employee",
    description: "Collaborate on assigned projects and tasks",
  },
  {
    role: "admin",
    icon: "🛡️",
    title: "Admin",
    description: "Create projects, manage teams, assign work and view analytics",
  },
];

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [role, setRole] = useState<RegisterRole>("employee");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authService.register({ ...form, role });
      login(data.token, data.user);
      navigate("/dashboard");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">Create an account</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Name" id="name" value={form.name} onChange={set("name")} required />
          <Input label="Email" id="email" type="email" value={form.email} onChange={set("email")} required />
          <Input label="Password" id="password" type="password" value={form.password} onChange={set("password")} required />

          {/* Role selection */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Select Role</p>
            <div className="grid grid-cols-2 gap-3">
              {ROLE_CARDS.map(({ role: r, icon, title, description }) => {
                const selected = role === r;
                return (
                  <motion.button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    whileHover={{ y: -4 }}
                    animate={{ scale: selected ? 1.02 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={[
                      "relative flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-shadow",
                      selected
                        ? "border-transparent bg-gradient-to-br from-blue-50 to-indigo-50 shadow-[0_0_0_2px_theme(colors.blue.500),0_0_12px_2px_theme(colors.blue.200)]"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm",
                    ].join(" ")}
                  >
                    {/* Checkmark */}
                    {selected && (
                      <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                        ✓
                      </span>
                    )}
                    <span className="text-xl">{icon}</span>
                    <span className="text-sm font-semibold text-gray-800">{title}</span>
                    <span className="text-xs text-gray-500 leading-snug">{description}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" loading={loading}>Register</Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
