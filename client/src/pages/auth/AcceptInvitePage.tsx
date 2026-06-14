import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { inviteService } from "@/services";
import { useAuth } from "@/store/auth.store";
import type { InviteInfo } from "@/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export const AcceptInvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Invite metadata
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState("");

  // Registration form
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Load invite info on mount
  useEffect(() => {
    if (!token) {
      setInviteError("Invalid invite link.");
      setLoadingInvite(false);
      return;
    }
    inviteService
      .getByToken(token)
      .then((data) => setInvite(data))
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setInviteError(msg ?? "This invite link is invalid or has expired.");
      })
      .finally(() => setLoadingInvite(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!name.trim()) { setFormError("Name is required."); return; }
    if (password.length < 6) { setFormError("Password must be at least 6 characters."); return; }

    setFormError("");
    setSubmitting(true);
    try {
      const data = await inviteService.accept(token, { name: name.trim(), password });
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? "Failed to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loadingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // ── Invalid / expired invite ──────────────────────────────────────────────
  if (inviteError || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800">Invite Invalid</h1>
          <p className="text-sm text-gray-500">{inviteError}</p>
          <Link to="/login" className="text-sm text-blue-600 hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Join {invite.workspace.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            You've been invited by <strong>{invite.invitedBy.name}</strong> to join as an employee.
          </p>
        </div>

        {/* Pre-filled email (read-only) */}
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Joining as <strong>{invite.email}</strong>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Your name"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
          />
          <Input
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a password"
            required
          />

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <Button type="submit" loading={submitting}>
            Create Account &amp; Join Workspace
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
