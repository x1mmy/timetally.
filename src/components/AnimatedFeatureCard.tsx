/**
 * Animated Feature Card
 * Feature showcase card with icon and gradient effects
 */
"use client";

import { type LucideIcon } from "lucide-react";

interface AnimatedFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: string;
  delay?: number;
}

export function AnimatedFeatureCard({
  icon: Icon,
  title,
  description,
  gradient = "from-blue-500 to-cyan-500",
  delay = 0,
}: AnimatedFeatureCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-8 transition-all duration-700 hover:-translate-y-2 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient overlay on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.07]`}
      />

      {/* Icon with gradient background */}
      <div className="relative mb-6">
        <div
          className={`inline-flex rounded-2xl bg-gradient-to-br ${gradient} p-4 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl`}
        >
          <Icon className="h-8 w-8 text-white" strokeWidth={1.5} />
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        <h3 className="mb-3 text-xl font-bold text-white transition-colors group-hover:text-blue-300">
          {title}
        </h3>
        <p className="leading-relaxed text-neutral-400 transition-colors group-hover:text-neutral-300">
          {description}
        </p>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );
}
