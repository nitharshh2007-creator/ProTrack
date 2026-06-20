import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  active?: boolean;
}

export const Chip = ({ children, active = false }: ChipProps) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition ${active ? "bg-blue-500/15 text-blue-200" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
    {children}
  </span>
);
