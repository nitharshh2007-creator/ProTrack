import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/store/auth.store";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";

export const InviteAcceptancePage = () => {
  const { token: inviteToken } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<"loading" | "form" | "invalid" | "expired">("loading");
  const [inviteData, setInviteData] = useState<{
    email: string;
    role: string;
    workspaceName: string;
  } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");

  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Validate invite token
  useEffect(() => {
    if (!inviteToken) {
      setStep("invalid");
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`${baseURL}/invites/${inviteToken}`);
        const data = await res.json();

        if (res.ok) {
          setInviteData(data.invite);
          setEmail(data.invite.email);
          setStep("form");
        } else {
          if (res.status === 400 && data.message?.includes("expired")) {
            setStep("expired");
          } else {
            setStep("invalid");
          }
        }
      } catch (error) {
        console.error("Token validation error:", error);
        setStep("invalid");
      }
    };

    validateToken();
  }, [inviteToken, baseURL]);

  const validateForm = () => {
    let isValid = true;

    if (!name.trim()) {
      setNameError("Full name is required");
      isValid = false;
    } else {
      setNameError("");
    }

    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      isValid = false;
    } else {
      setPasswordError("");
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    } else {
      setConfirmPasswordError("");
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch(`${baseURL}/invites/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: inviteToken,
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setToastVariant("success");
        setToastMessage("Account created successfully!");

        setTimeout(() => {
          login(data.token, data.user);
          navigate("/dashboard");
        }, 1000);
      } else {
        setFormError(data.message || "Failed to create account");
        setToastVariant("error");
        setToastMessage(data.message || "Failed to create account");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setFormError("An error occurred. Please try again.");
      setToastVariant("error");
      setToastMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (toastMessage) {
    setTimeout(() => setToastMessage(""), 3000);
  }

  return (
    <div className="flex min-h-screen text-slate-100 antialiased bg-[#081120] overflow-hidden">
      {/* Background Decorative Glow Gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-600/8 blur-[100px]" />
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          variant={toastVariant}
          onClose={() => setToastMessage("")}
        />
      )}

      <div className="flex w-full grid-cols-1 lg:grid lg:grid-cols-12">
        {/* Left Section - Branding (Hidden on mobile) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 relative border-r border-white/5 bg-[#0b1626]/40">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 pointer-events-none" />

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group relative z-10 w-fit">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <span className="text-white font-black text-xl">P</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">ProTrack</span>
          </Link>

          {/* Content */}
          <div className="my-auto max-w-xl space-y-10 relative z-10">
            <div className="space-y-4">
              <h1 className="text-5xl font-black tracking-tight text-white leading-tight">
                Welcome to Your Team
              </h1>
              <p className="text-lg text-slate-400">
                Complete your profile and get started with your workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Secure Setup</h3>
                <p className="text-xs text-slate-400">
                  Your account is created with enterprise-grade security
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-blue-300/80 flex items-center gap-3 relative z-10 w-fit">
            <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>Your workspace is ready for you</span>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="flex flex-col justify-center items-center col-span-12 lg:col-span-6 xl:col-span-5 p-6 sm:p-12 md:p-20 relative">
          {/* Logo on mobile */}
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600">
              <span className="text-white font-black text-lg">P</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">ProTrack</span>
          </div>

          {step === "loading" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-md text-center space-y-4"
            >
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
              <p className="text-slate-400">Validating your invitation...</p>
            </motion.div>
          )}

          {step === "invalid" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md bg-[#0b1626]/60 border border-red-500/20 rounded-2xl p-8 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Invitation Invalid</h2>
              <p className="text-slate-400">
                This invitation link is invalid or has been revoked.
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
              >
                Go to Login
              </Link>
            </motion.div>
          )}

          {step === "expired" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md bg-[#0b1626]/60 border border-orange-500/20 rounded-2xl p-8 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto border border-orange-500/20">
                <AlertCircle className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Invitation Expired</h2>
              <p className="text-slate-400">
                This invitation has expired. Please contact your administrator for a new invitation.
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
              >
                Go to Login
              </Link>
            </motion.div>
          )}

          {step === "form" && inviteData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md bg-[#0b1626]/60 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl"
            >
              <div className="mb-6 space-y-1">
                <h2 className="text-2xl font-extrabold text-white">Create Your Account</h2>
                <p className="text-sm text-slate-400">
                  Joining <strong>{inviteData.workspaceName}</strong> as <strong>{inviteData.role}</strong>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5" /> Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError("");
                    }}
                    className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500/60 focus:bg-white/8 focus:ring-2 focus:ring-blue-500/20 ${
                      nameError ? "border-red-500/40" : "border-white/10"
                    }`}
                    placeholder="Your full name"
                    required
                  />
                  {nameError && <span className="text-xs text-red-400">{nameError}</span>}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Mail className="w-3.5 h-3.5" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500/60 focus:bg-white/8 focus:ring-2 focus:ring-blue-500/20 ${
                      emailError ? "border-red-500/40" : "border-white/10"
                    }`}
                    placeholder="you@company.com"
                    required
                  />
                  {emailError && <span className="text-xs text-red-400">{emailError}</span>}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Lock className="w-3.5 h-3.5" /> Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      className={`w-full rounded-xl border bg-white/5 pl-4 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500/60 focus:bg-white/8 focus:ring-2 focus:ring-blue-500/20 ${
                        passwordError ? "border-red-500/40" : "border-white/10"
                      }`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && <span className="text-xs text-red-400">{passwordError}</span>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Lock className="w-3.5 h-3.5" /> Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (confirmPasswordError) setConfirmPasswordError("");
                      }}
                      className={`w-full rounded-xl border bg-white/5 pl-4 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500/60 focus:bg-white/8 focus:ring-2 focus:ring-blue-500/20 ${
                        confirmPasswordError ? "border-red-500/40" : "border-white/10"
                      }`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPasswordError && <span className="text-xs text-red-400">{confirmPasswordError}</span>}
                </div>

                {formError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2 text-xs text-red-400">
                    {formError}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  loading={loading}
                  disabled={!name || !email || !password || !confirmPassword || loading}
                  className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  {loading ? "Creating Account..." : "Create Account & Join"}
                </Button>
              </form>

              <p className="mt-6 text-center text-xs text-slate-500">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  Sign In
                </Link>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
