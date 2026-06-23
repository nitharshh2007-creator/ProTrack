import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = ({ label, error, id, className = "", children, ...props }: SelectProps) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>
    )}
    <select
      id={id}
      className={`rounded-xl border bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 ${error ? "border-red-500/40" : "border-slate-200 dark:border-slate-800"} ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <span className="text-xs text-red-400">{error}</span>}
  </div>
);
