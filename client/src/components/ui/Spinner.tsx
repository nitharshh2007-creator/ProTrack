interface SpinnerProps {
  className?: string;
}

export const Spinner = ({ className = "h-6 w-6" }: SpinnerProps) => (
  <div
    className={`animate-spin rounded-full border-2 border-blue-100 border-t-blue-600 ${className}`}
  />
);
