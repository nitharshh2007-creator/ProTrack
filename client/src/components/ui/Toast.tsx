import { useEffect } from "react";

interface ToastProps {
  message: string;
  variant?: "success" | "error";
  onClose: () => void;
}

export const Toast = ({ message, variant = "success", onClose }: ToastProps) => {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3500);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed right-6 top-6 z-50 rounded-3xl px-5 py-4 text-sm text-white shadow-glow ${variant === "success" ? "bg-emerald-500/90" : "bg-red-500/90"}`}>
      {message}
    </div>
  );
};
