import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = ({ children, className = "", ...props }: CardProps) => (
  <div className={`glass-card p-5 ${className}`} {...props}>
    {children}
  </div>
);
