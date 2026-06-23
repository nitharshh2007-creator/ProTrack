import type { ButtonHTMLAttributes } from "react";

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}

export const Toggle = ({ checked, label, onChange, className = "", ...props }: ToggleProps) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`group flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 ${className}`}
    {...props}
  >
    <div>
      <p className="text-sm font-semibold text-slate-800 dark:text-white">{label}</p>
    </div>
    <div className={`relative h-5 w-10 rounded-full transition ${checked ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"}`}>
      <span className={`absolute left-0 top-0 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </div>
  </button>
);
