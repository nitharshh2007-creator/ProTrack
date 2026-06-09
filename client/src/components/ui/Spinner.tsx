interface SpinnerProps {
  className?: string;
}

export const Spinner = ({ className = "h-6 w-6" }: SpinnerProps) => (
  <div
    className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${className}`}
  />
);
