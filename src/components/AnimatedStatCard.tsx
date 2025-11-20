/**
 * Animated Stat Card
 * Card component with number count-up animation
 */
"use client";

import { useEffect, useState, useRef } from "react";
import { type LucideIcon } from "lucide-react";

interface AnimatedStatCardProps {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  iconColor?: string;
  animate?: boolean;
  decimals?: number;
  duration?: number;
}

export function AnimatedStatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  iconColor = "text-primary",
  animate = true,
  decimals = 0,
  duration = 2000,
}: AnimatedStatCardProps) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!animate || !isVisible || typeof value !== "number") {
      setDisplayValue(value);
      return;
    }

    const startValue = 0;
    const endValue = value;
    const startTime = Date.now();

    const updateValue = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      } else {
        setDisplayValue(endValue);
      }
    };

    requestAnimationFrame(updateValue);
  }, [value, animate, isVisible, duration]);

  const formattedValue =
    typeof displayValue === "number"
      ? displayValue.toFixed(decimals)
      : displayValue;

  return (
    <div
      ref={cardRef}
      className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/20"
    >
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Content */}
      <div className="relative flex items-center justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-400">{label}</p>
          <p className="text-4xl font-bold tabular-nums tracking-tight text-white">
            {prefix}
            {formattedValue}
            {suffix}
          </p>
        </div>

        {/* Icon with glow effect */}
        <div className="relative">
          <div className="absolute inset-0 animate-pulse-slow rounded-full bg-gradient-to-br from-blue-400/50 to-cyan-400/50 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
          <div className="relative rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3 transition-all duration-500 group-hover:scale-110">
            <Icon className={`h-8 w-8 ${iconColor}`} strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );
}
