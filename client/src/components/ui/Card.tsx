import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = "" }: CardProps) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md dark:shadow-xl dark:shadow-black/20 p-4 ${className}`}>
    {children}
  </div>
);
