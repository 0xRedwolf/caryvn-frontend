'use client';

import { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '@/lib/utils';

interface CountUpBalanceProps {
  value: number | string;
  currency?: string;
  className?: string;
  durationMs?: number;
}

export default function CountUpBalance({
  value,
  currency = 'NGN',
  className = '',
  durationMs = 900,
}: CountUpBalanceProps) {
  const target = typeof value === 'string' ? parseFloat(value) || 0 : value || 0;
  const [displayValue, setDisplayValue] = useState<number>(target);
  const [isIncreased, setIsIncreased] = useState(false);
  const prevValueRef = useRef<number>(target);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = target;

    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    let pulseTimer: NodeJS.Timeout | undefined;
    if (endValue > startValue) {
      setIsIncreased(true);
      pulseTimer = setTimeout(() => setIsIncreased(false), durationMs + 800);
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // easeOutCubic curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = startValue + (endValue - startValue) * easeProgress;

      setDisplayValue(currentVal);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (pulseTimer) {
        clearTimeout(pulseTimer);
      }
    };
  }, [target, durationMs]);

  return (
    <span
      className={`inline-block transition-all duration-300 ${
        isIncreased ? 'text-emerald-600 scale-[1.03]' : ''
      } ${className}`}
    >
      {formatCurrency(displayValue, currency)}
    </span>
  );
}
