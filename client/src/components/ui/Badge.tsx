import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const variants = {
  default:  "bg-slate-700/50 text-slate-300 border border-slate-600/40",
  success:  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  warning:  "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  danger:   "bg-red-500/10 text-red-400 border border-red-500/20",
  info:     "bg-blue-500/10 text-blue-400 border border-blue-500/20",
};

export const Badge = ({ children, variant = "default", className = "" }: BadgeProps) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}>
    {children}
  </span>
);
