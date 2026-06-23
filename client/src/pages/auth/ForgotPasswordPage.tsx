import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { authService } from "@/services";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { 
  FolderKanban, 
  Users, 
  BarChart3, 
  Zap, 
  ShieldCheck, 
  Mail, 
  ArrowLeft 
} from "lucide-react";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");

  const validateForm = () => {
    let isValid = true;
    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    } else {
      setEmailError("");
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
      setToastVariant("success");
      setToastMessage("Password reset link sent to your email.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? "Failed to send reset link. Please try again.");
      setToastVariant("error");
      setToastMessage(msg ?? "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email && /\S+@\S+\.\S+/.test(email);

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
        {/* Left Section - Branding and Feature Cards */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 relative border-r border-white/5 bg-[#0b1626]/40">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 pointer-events-none" />
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group relative z-10 w-fit">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <span className="text-white font-black text-xl">P</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">
              ProTrack
            </span>
          </Link>

          {/* Heading and Feature Grid */}
          <div className="my-auto max-w-xl space-y-10 relative z-10">
            <div className="space-y-4">
              <h1 className="text-5xl font-black tracking-tight text-white leading-tight">
                Reset Password
              </h1>
              <p className="text-lg text-slate-400">
                Recover your ProTrack account password.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Feature 1 */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3 hover:border-blue-500/30 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Project Management</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Plan and track projects with powerful tools
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3 hover:border-indigo-500/30 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Team Collaboration</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Work together in real-time seamlessly
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3 hover:border-purple-500/30 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Smart Analytics</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Get insights into team performance
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3 hover:border-pink-500/30 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 border border-pink-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Workflow Automation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automate tasks and boost productivity
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Card */}
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-blue-300/80 flex items-center gap-3 relative z-10 w-fit">
            <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>A modern project management platform built for teams, students, and organizations</span>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="flex flex-col justify-center items-center col-span-12 lg:col-span-6 xl:col-span-5 p-6 sm:p-12 md:p-20 relative">
          
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600">
              <span className="text-white font-black text-lg">P</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">ProTrack</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md bg-[#0b1626]/60 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-white mb-1">Forgot Password</h2>
              <p className="text-sm text-slate-400">
                {!success 
                  ? "Enter your email to receive a password reset link." 
                  : "Check your email for the reset instructions."
                }
              </p>
            </div>

            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-5">
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
                    className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500/60 focus:bg-white/8 focus:ring-2 focus:ring-blue-500/20 ${emailError ? "border-red-500/40" : "border-white/10"}`}
                    placeholder="you@company.com"
                    required
                  />
                  {emailError && <span className="text-xs text-red-400">{emailError}</span>}
                </div>

                {formError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2 text-xs text-red-400">
                    {formError}
                  </div>
                )}

                <Button 
                  type="submit" 
                  loading={loading} 
                  disabled={!isFormValid || loading} 
                  className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4 text-sm text-emerald-400 flex flex-col gap-2">
                  <span className="font-bold">Reset email sent!</span>
                  <span>We've sent a password reset link to <strong className="text-white">{email}</strong>. Please check your inbox and click the link to reset your password.</span>
                </div>
                
                <Button 
                  onClick={() => setSuccess(false)}
                  className="w-full py-3 text-sm font-bold text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                >
                  Resend Email
                </Button>
              </div>
            )}

            <div className="mt-8 flex justify-center border-t border-white/5 pt-5">
              <Link to="/signin" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
