import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = ({ label, error, hint, id, className = "", ...props }: InputProps) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>
    )}
    <input
      id={id}
      className={`rounded-xl border bg-white dark:bg-white/5 px-4 py-2.5 text-sm text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition focus:border-blue-500/60 focus:bg-slate-50/50 dark:focus:bg-white/8 focus:ring-2 focus:ring-blue-500/20 ${error ? "border-red-500/40" : "border-slate-200 dark:border-white/10"} ${className}`}
      {...props}
    />
    {hint && !error && <span className="text-xs text-slate-500">{hint}</span>}
    {error && <span className="text-xs text-red-400">{error}</span>}
  </div>
);
