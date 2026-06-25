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
    className={`group flex items-center justify-between rounded-3xl border border-white/5 bg-[#1A2235] px-4 py-3 text-left transition hover:border-white/10 ${className}`}
    {...props}
  >
    <div>
      <p className="text-sm font-semibold text-[#F8FAFC]">{label}</p>
    </div>
    <div className={`relative h-5 w-10 rounded-full transition ${checked ? "bg-blue-600" : "bg-[#0F172A]"}`}>
      <span className={`absolute left-0 top-0 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </div>
  </button>
);
