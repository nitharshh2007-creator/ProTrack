import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

const variants: Record<string, string> = {
  primary: "bg-gradient-primary text-white shadow-glow hover:brightness-110",
  secondary: "bg-white/10 text-slate-100 hover:bg-white/15",
  danger: "bg-red-500/10 text-red-300 hover:bg-red-500/20",
  ghost: "bg-transparent text-slate-100 hover:bg-white/5",
};

export const Button = ({ loading, variant = "primary", children, className = "", disabled, ...props }: ButtonProps) => (
  <button
    disabled={loading || disabled}
    className={`inline-flex items-center justify-center gap-2 rounded-3xl px-5 py-3 text-sm font-semibold transition ${variants[variant]} ${disabled ? "opacity-50 pointer-events-none" : ""} ${className}`}
    {...props}
  >
    {loading && <Spinner className="h-4 w-4" />}
    {children}
  </button>
);
