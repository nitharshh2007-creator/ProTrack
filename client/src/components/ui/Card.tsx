import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = "" }: CardProps) => (
  <div className={`bg-[#111827] border border-white/5 rounded-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:border-white/10 text-[#F8FAFC] p-6 transition-all duration-300 ${className}`}>
    {children}
  </div>
);
