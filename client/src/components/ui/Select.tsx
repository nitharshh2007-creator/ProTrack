import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = ({ label, error, id, className = "", children, ...props }: SelectProps) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
        {label}
      </label>
    )}
    <select
      id={id}
      className={`rounded-xl border bg-[#0F172A] px-4 py-2.5 text-sm text-[#F8FAFC] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${error ? "border-red-500" : "border-white/10"} ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <span className="text-xs text-red-400">{error}</span>}
  </div>
);
