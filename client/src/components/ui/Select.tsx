import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = ({ label, error, id, className = "", children, ...props }: SelectProps) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
    )}
    <select
      id={id}
      className={`rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white ${error ? "border-red-500" : "border-gray-300"} ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
);
