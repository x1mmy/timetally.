/**
 * TimeTally Landing Page - Redesigned
 * Bold, distinctive landing page with animations and signature components
 */
"use client";

import { useEffect, useState } from "react";
import { Clock, Shield, Users, Building2, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    {
      icon: Building2,
      title: "Multi-Tenant Architecture",
      description: "Each client gets their own subdomain with complete data isolation",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Users,
      title: "Easy Employee Login",
      description: "Simple 4-digit PIN authentication for quick timesheet submission",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Shield,
      title: "Manager Dashboard",
      description: "View all employee hours, manage staff, and export CSVs",
      gradient: "from-amber-500 to-orange-500",
    },
    {
      icon: CheckCircle,
      title: "Automatic Break Calculation",
      description: "Configurable break rules automatically deduct breaks based on hours worked",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Clock,
      title: "Weekly Reports",
      description: "View and export weekly timesheet summaries with totals",
      gradient: "from-indigo-500 to-blue-500",
    },
    {
      icon: Sparkles,
      title: "Real-Time Tracking",
      description: "Monitor hours as they happen with live updates and instant sync",
      gradient: "from-rose-500 to-red-500",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Animated Background Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Primary radial gradient that follows cursor */}
        <div
          className="absolute h-[600px] w-[600px] opacity-30 blur-3xl transition-all duration-1000 ease-out"
          style={{
            background: `radial-gradient(circle, oklch(0.547 0.261 265) 0%, transparent 70%)`,
            left: `${mousePosition.x - 300}px`,
            top: `${mousePosition.y - 300}px`,
          }}
        />

        {/* Static ambient gradients */}
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] animate-pulse-slow rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[500px] w-[500px] animate-pulse-slower rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 blur-3xl" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative">
        {/* Hero Section */}
        <section className="container relative mx-auto px-4 pb-32 pt-20">
          <div className="mx-auto max-w-5xl">
            {/* Floating Clock Icon */}
            <div className="mb-8 flex justify-center">
              <div className={`group relative transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
                {/* Glow effect */}
                <div className="absolute inset-0 animate-pulse-slow rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 opacity-50 blur-2xl group-hover:opacity-75" />

                {/* Icon container with rotation animation */}
                <div className="relative animate-float">
                  <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-6 shadow-2xl shadow-blue-500/50 backdrop-blur-sm transition-all duration-500 hover:scale-110 hover:shadow-blue-500/70">
                    <Clock className="h-20 w-20 text-blue-400 transition-transform duration-700 group-hover:rotate-180" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Text */}
            <div className={`space-y-8 text-center transition-all delay-300 duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
              <h1 className="text-7xl font-black tracking-tighter md:text-8xl">
                <span className="bg-gradient-to-br from-white via-blue-100 to-blue-400 bg-clip-text text-transparent ">
                  TimeTally 
                </span>
                <span className="text-blue-500">.</span>
              </h1>

              <p className="mx-auto max-w-2xl text-2xl font-semibold text-neutral-300 md:text-3xl">
                Simple, Powerful{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Timesheet Management
                  </span>
                  <span className="absolute inset-x-0 bottom-1 h-3 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 blur-sm" />
                </span>
              </p>

              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-neutral-400">
                Multi-tenant timesheet solution with subdomain-based client isolation.
                Perfect for businesses managing hourly employees across multiple locations.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col items-center justify-center gap-4 pt-8 sm:flex-row">

              {/* Express Your Interest Button */}
              {/* TODO: Add the link to the form */}
                <Link
                  href=""
                  className="group rounded-xl border-2 border-blue-500/50 bg-blue-500/10 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-blue-400 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
                >
                  <span className="flex items-center gap-2">
                    Express Your Interest
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container relative mx-auto px-4 py-20">
          <div className={`mb-16 text-center transition-all delay-500 duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <h2 className="mb-4 text-5xl font-bold tracking-tight">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                track time
              </span>
            </h2>
            <p className="text-lg text-neutral-400">
              Built for modern teams who value simplicity and precision
            </p>
          </div>

          {/* Feature Grid */}
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`group relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-8 transition-all duration-700 hover:-translate-y-2 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 ${
                    mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
                  }`}
                  style={{
                    transitionDelay: `${700 + index * 100}ms`,
                  }}
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.07]`} />

                  {/* Icon with gradient background */}
                  <div className="relative mb-6">
                    <div className={`inline-flex rounded-2xl bg-gradient-to-br ${feature.gradient} p-4 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl`}>
                      <Icon className="h-8 w-8 text-white" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="mb-3 text-xl font-bold text-white transition-colors group-hover:text-blue-300">
                      {feature.title}
                    </h3>
                    <p className="leading-relaxed text-neutral-400 transition-colors group-hover:text-neutral-300">
                      {feature.description}
                    </p>
                  </div>

                  {/* Decorative corner accent */}
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                </div>
              );
            })}
          </div>
        </section>

        {/* Portal Access Section */}
        <section className="container relative mx-auto px-4 py-20">
          <div className={`mx-auto max-w-3xl transition-all delay-1000 duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <div className="group relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-blue-950/30 p-12 shadow-2xl transition-all duration-500 hover:border-blue-500/50 hover:shadow-blue-500/20">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

              <div className="relative text-center">
                <div className="mb-6 inline-flex rounded-full bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400">
                  Quick Access
                </div>

                <h2 className="mb-4 text-4xl font-bold">
                  Access Your Portal
                </h2>
                <p className="mb-10 text-lg text-neutral-400">
                  Access TimeTally from your dedicated subdomain
                </p>

                <div className="space-y-4">
                  {/* Admin Portal
                  <div className="group/portal overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/50 hover:bg-neutral-900/50 hover:shadow-lg hover:shadow-blue-500/10">
                    <p className="mb-2 text-sm font-medium text-neutral-400">
                      Admin Portal
                    </p>
                    <code className="text-xl font-semibold text-blue-400 transition-colors group-hover/portal:text-blue-300">
                      admin.timetally.com
                    </code>
                  </div> */}

                  {/* Client Portal */}
                  <div className="group/portal overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/50 hover:bg-neutral-900/50 hover:shadow-lg hover:shadow-purple-500/10">
                    <p className="mb-2 text-sm font-medium text-neutral-400">
                      Client Portal
                    </p>
                    <code className="text-xl font-semibold text-purple-400 transition-colors group-hover/portal:text-purple-300">
                      [your-company].timetally.com
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative mt-20 border-t border-neutral-900 py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-neutral-500">
              &copy; {new Date().getFullYear()} TimeTally. All rights reserved. | Built with care by{" "}
              <a
                href="https://stashlabs.com.au"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-400 transition-colors hover:text-blue-300 hover:underline"
              >
                Stash Labs
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
