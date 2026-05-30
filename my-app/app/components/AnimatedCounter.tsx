"use client";

import React, { useEffect, useState } from "react";

type AnimatedCounterProps = {
  value: number;
  suffix?: string;
};

export function AnimatedCounter({ value, suffix = "" }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const duration = 600; // 600ms count-up
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutQuad easing
      const easeProgress = progress * (2 - progress);
      
      const current = Math.floor(easeProgress * (end - start) + start);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    const animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [value]);

  return <span>{displayValue}{suffix}</span>;
}
