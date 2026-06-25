import type { TextareaHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, leftIcon, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-3 text-slate-400">
              {leftIcon}
            </div>
          )}
          <textarea
            ref={ref}
            className={`w-full resize-none rounded-xl border border-white/10 bg-[#0F172A] px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#64748B] transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
              leftIcon ? "pl-10" : ""
            } ${error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20" : ""} ${className}`}
            {...props}
          />
        </div>
        {hint && !error && <p className="mt-1.5 text-xs text-[#64748B]">{hint}</p>}
        {error && <p className="mt-1.5 text-xs font-medium text-rose-500">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
