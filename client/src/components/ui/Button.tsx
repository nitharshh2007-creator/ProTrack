import type { ButtonHTMLAttributes } from "react";
import type { HTMLMotionProps } from "framer-motion";
import { motion } from "framer-motion";
import { Spinner } from "./Spinner";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, keyof ButtonHTMLAttributes<HTMLButtonElement>>, ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

const variants: Record<string, string> = {
  primary:   "gradient-primary text-white shadow-lg hover:opacity-90 glow-blue",
  secondary: "glass text-slate-300 hover:text-white hover:border-white/20",
  danger:    "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300",
  ghost:     "text-slate-400 hover:text-white hover:bg-white/5",
};

export const Button = ({
  loading, variant = "primary", children, className = "", disabled, ...props
}: ButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
    disabled={loading || disabled}
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${variants[variant]} ${disabled || loading ? "opacity-40 pointer-events-none" : ""} ${className}`}
    {...(props as React.ComponentProps<typeof motion.button>)}
  >
    {loading && <Spinner className="h-4 w-4" />}
    {children}
  </motion.button>
);
