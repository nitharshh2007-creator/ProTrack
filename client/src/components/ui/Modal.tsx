import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  open?: boolean;
  description?: string;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export const Modal = ({ title, onClose, children, open = true, description, icon, size = "md" }: ModalProps) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`relative w-full ${sizeClasses[size]} glass-card rounded-2xl`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/8 px-6 py-4">
            <div className="flex items-center gap-3">
              {icon && <div className="text-blue-600 dark:text-blue-400">{icon}</div>}
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h2>
                {description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/8 dark:hover:text-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
