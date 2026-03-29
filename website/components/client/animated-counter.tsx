"use client";

import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function AnimatedCounter({
  value,
  duration = 1.2,
}: {
  value: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const reducedMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 80, damping: 20 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latestValue) => {
      setDisplayValue(Math.round(latestValue));
    });

    return unsubscribe;
  }, [springValue]);

  useEffect(() => {
    if (reducedMotion) {
      motionValue.set(value);
      setDisplayValue(value);
      return;
    }

    if (!inView) {
      return;
    }

    const controls = animate(motionValue, value, { duration });
    return () => controls.stop();
  }, [duration, inView, motionValue, reducedMotion, value]);

  return <span ref={ref}>{reducedMotion ? value : displayValue}</span>;
}
