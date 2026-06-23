import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  duration?: number;
  onClose: () => void;
}

export const Toast = ({ message, type = 'success', duration = 2000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -50, x: 20 }}
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            type === 'success'
              ? 'bg-green-500 text-white border-green-600'
              : 'bg-red-500 text-white border-red-600'
          }`}
          style={{ maxWidth: '400px' }}
        >
          {type === 'success' && <CheckCircle className="h-5 w-5" />}
          <span className="text-sm font-medium">{message}</span>
          <button
            onClick={handleClose}
            className="ml-2 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};