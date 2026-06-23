import React, { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  /** Target number to count up to */
  to: number;
  /** Duration of the animation in milliseconds */
  duration?: number;
}

/**
 * AnimatedCounter animates a numeric value from 0 to the target `to`.
 * It uses a simple easing function and requestAnimationFrame for smooth updates.
 * This component is lightweight and has no external dependencies beyond React.
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ to, duration = 1000 }) => {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out cubic for a pleasant feel
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ease * to));
      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to, duration]);

  return <>{value}</>;
};
