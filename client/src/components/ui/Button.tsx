import type { ButtonHTMLAttributes } from "react";
import type { HTMLMotionProps } from "framer-motion";
import { motion } from "framer-motion";
import { Spinner } from "./Spinner";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, keyof ButtonHTMLAttributes<HTMLButtonElement>>, ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

const variants: Record<string, string> = {
  primary:   "gradient-primary text-white shadow-lg hover:opacity-95",
  secondary: "bg-[#1A2235] border border-white/5 text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-[#1A2235]/80 hover:border-white/10",
  danger:    "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300",
  ghost:     "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5",
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
