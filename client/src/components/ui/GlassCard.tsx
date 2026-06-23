import type { ReactNode, FC } from "react";

type GlassCardVariant = "default" | "stats" | "interactive";

interface GlassCardProps {
  variant?: GlassCardVariant;
  children: ReactNode;
  className?: string;
}

export const GlassCard: FC<GlassCardProps> = ({
  variant = "default",
  children,
  className = "",
}) => {
  const baseClasses = "glass-card transition-all hover:shadow-lg";
  const variantClasses = {
    default: "",
    stats: "glass-card--stats",
    interactive: "glass-card--interactive",
  }[variant];

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`.trim()}>
      {children}
    </div>
  );
};
