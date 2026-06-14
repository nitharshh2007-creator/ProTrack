import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = ({ children, className = "", ...props }: CardProps) => (
  <div className={`rounded-[32px] border border-white/10 bg-glass p-6 shadow-card backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-glow ${className}`} {...props}>
    {children}
  </div>
);
