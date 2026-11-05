import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/** Counts up to `value`. Skips the animation when the user prefers reduced motion. */
export function AnimatedNumber({ value = 0, duration = 0.8 }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  const previous = useRef(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      previous.current = value;
      return undefined;
    }
    const controls = animate(previous.current, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, duration, reduce]);

  return <span>{display.toLocaleString()}</span>;
}
