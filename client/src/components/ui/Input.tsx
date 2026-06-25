import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = ({ label, error, hint, id, className = "", ...props }: InputProps) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
        {label}
      </label>
    )}
    <input
      id={id}
      className={`rounded-xl border bg-[#0F172A] px-4 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#64748B] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${error ? "border-red-500" : "border-white/10"} ${className}`}
      {...props}
    />
    {hint && !error && <span className="text-xs text-[#64748B]">{hint}</span>}
    {error && <span className="text-xs text-red-400">{error}</span>}
  </div>
);
