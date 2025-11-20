/**
 * Animated Card Component
 * Signature card with hover lift and glow effects
 */
"use client";

import { type ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  hover?: boolean;
  gradient?: string;
  glowColor?: "blue" | "purple" | "green" | "amber" | "cyan";
}

export function AnimatedCard({
  children,
  onClick,
  className = "",
  hover = true,
  gradient,
  glowColor = "blue",
}: AnimatedCardProps) {
  const glowColors = {
    blue: "hover:border-blue-500/50 hover:shadow-blue-500/20",
    purple: "hover:border-purple-500/50 hover:shadow-purple-500/20",
    green: "hover:border-green-500/50 hover:shadow-green-500/20",
    amber: "hover:border-amber-500/50 hover:shadow-amber-500/20",
    cyan: "hover:border-cyan-500/50 hover:shadow-cyan-500/20",
  };

  return (
    <div
      onClick={onClick}
      className={`
        group relative overflow-hidden rounded-2xl border border-neutral-800
        bg-gradient-to-br from-neutral-900 to-neutral-950
        transition-all duration-700
        ${hover ? `hover:-translate-y-2 hover:shadow-2xl ${glowColors[glowColor]}` : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {/* Gradient overlay on hover */}
      {gradient && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.07]`}
        />
      )}

      {/* Decorative corner accent */}
      <div
        className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-${glowColor}-500/20 to-purple-500/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100`}
      />

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  );
}
