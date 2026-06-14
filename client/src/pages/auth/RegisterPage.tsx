import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create an Admin account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Admins own a workspace and invite their team.
          </p>
        </div>

        {/* Employee notice */}
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <strong>Are you an employee?</strong> You need an invitation link from your admin to join
          a workspace. Check your email for an invite.
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Name" id="name" value={form.name} onChange={set("name")} required />
          <Input
            label="Email"
            id="email"
            type="email"
            value={form.email}
            onChange={set("email")}
            required
          />
          <Input
            label="Password"
            id="password"
            type="password"
            value={form.password}
            onChange={set("password")}
            required
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" loading={loading}>
            Create Admin Account
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
