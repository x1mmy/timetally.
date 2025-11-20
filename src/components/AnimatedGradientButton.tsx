/**
 * Animated Gradient Button
 * Signature button component with gradient hover effects
 */
"use client";

import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

interface AnimatedGradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  className?: string;
  disabled?: boolean;
}

export function AnimatedGradientButton({
  children,
  onClick,
  href,
  variant = "primary",
  icon: Icon,
  iconPosition = "right",
  className = "",
  disabled = false,
}: AnimatedGradientButtonProps) {
  const baseClasses = `
    group relative overflow-hidden rounded-xl px-8 py-4 font-semibold
    transition-all duration-300 hover:scale-105
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
    inline-flex items-center justify-center gap-2
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-600 to-blue-500 text-white
      shadow-lg shadow-blue-500/50
      hover:shadow-xl hover:shadow-blue-500/60
    `,
    secondary: `
      bg-gradient-to-r from-purple-600 to-pink-500 text-white
      shadow-lg shadow-purple-500/50
      hover:shadow-xl hover:shadow-purple-500/60
    `,
    outline: `
      border-2 border-blue-500/50 bg-blue-500/10 text-white
      backdrop-blur-sm
      hover:border-blue-400 hover:bg-blue-500/20
      hover:shadow-lg hover:shadow-blue-500/30
    `,
  };

  const content = (
    <>
      {Icon && iconPosition === "left" && (
        <Icon className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
      )}
      <span className="relative z-10">{children}</span>
      {Icon && iconPosition === "right" && (
        <Icon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      )}
      {variant === "primary" && (
        <div className="absolute inset-0 -z-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}
      {variant === "secondary" && (
        <div className="absolute inset-0 -z-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}
    </>
  );

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={classes}>
      {content}
    </button>
  );
}
