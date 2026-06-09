import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "@/services";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.register(form);
      navigate("/login");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">Create an account</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Name" id="name" value={form.name} onChange={set("name")} required />
          <Input label="Email" id="email" type="email" value={form.email} onChange={set("email")} required />
          <Input label="Password" id="password" type="password" value={form.password} onChange={set("password")} required />
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
