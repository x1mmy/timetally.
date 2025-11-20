/**
 * TimeTally Landing Page - B2B Optimized with Support Focus
 * Focused on business outcomes + dedicated support from Stash Labs
 */
"use client";

import { useEffect, useState } from "react";
import { Clock, Users, FileText, CheckCircle, DollarSign, Zap, ArrowRight, Handshake, Award } from "lucide-react";
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

  // Reframed features - focus on business outcomes, not technical details
  const features = [
    {
      icon: Zap,
      title: "Save 200+ Hours a Year",
      description: "Stop manually calculating hours. No more spreadsheets. No more errors. Automated from start to finish.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: CheckCircle,
      title: "Australian Award Compliant",
      description: "Automatic break calculations based on Modern Award requirements. Always compliant, always correct.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Users,
      title: "Staff Love It",
      description: "Simple 4-digit PIN login. No passwords to reset. No training needed. Employees clock in and out in seconds.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: FileText,
      title: "Works with Your System",
      description: "Easy CSV export works with MYOB, Xero, QuickBooks, or hand to your accountant. No data re-entry.",
      gradient: "from-amber-500 to-orange-500",
    },
    {
      icon: DollarSign,
      title: "Accurate Payroll",
      description: "Real-time visibility of hours and pay calculations. Review everything before finalizing.",
      gradient: "from-rose-500 to-red-500",
    },
    {
      icon: Clock,
      title: "Setup in Minutes",
      description: "Add your employees, set their pay rates, and you're done. No IT knowledge required.",
      gradient: "from-indigo-500 to-blue-500",
    },
  ];

  const painPoints = [
    {
      problem: "Manual timesheets are error-prone",
      solution: "Automated calculations eliminate human error"
    },
    {
      problem: "Hours get lost or miscalculated",
      solution: "Real-time tracking with instant accuracy"
    },
    {
      problem: "Staff forget their hours",
      solution: "Simple PIN system your team will actually use"
    },
    {
      problem: "Getting payroll into your system is a headache",
      solution: "We help you integrate with MYOB, Xero, or your accountant"
    },
  ];

  const supportPoints = [
    {
      icon: Award,
      title: "Setup Visit to Your Location",
      description: "We come to you. Train your team. Get everything running smoothly on day one."
    },
    {
      icon: Users,
      title: "Team Training & PIN Distribution",
      description: "Your staff gets hands-on help. No confusion about how to use the system."
    },
    {
      icon: FileText,
      title: "Payroll System Integration",
      description: "We handle getting your data into MYOB, Xero, or wherever your accountant works."
    },
    {
      icon: Handshake,
      title: "Ongoing Support from Stash Labs",
      description: "Direct access to our team. Questions? Issues? We're here to help, not a chatbot."
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Animated Background Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] md:h-[600px] md:w-[600px] opacity-30 blur-3xl transition-all duration-1000 ease-out"
          style={{
            background: `radial-gradient(circle, oklch(0.547 0.261 265) 0%, transparent 70%)`,
            left: `${mousePosition.x - 300}px`,
            top: `${mousePosition.y - 300}px`,
          }}
        />

        <div className="absolute -top-40 right-0 h-[250px] w-[250px] sm:h-[350px] sm:w-[350px] md:h-[500px] md:w-[500px] animate-pulse-slow rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-[250px] w-[250px] sm:h-[350px] sm:w-[350px] md:h-[500px] md:w-[500px] animate-pulse-slower rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 blur-3xl" />

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
        {/* Hero Section - Lead with pain point */}
        <section className="container relative mx-auto px-4 pb-16 pt-12 sm:pb-24 sm:pt-16 md:pb-32 md:pt-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 md:mb-8 flex justify-center">
              <div className={`group relative transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
                <div className="absolute inset-0 animate-pulse-slow rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 opacity-50 blur-2xl group-hover:opacity-75" />
                <div className="relative animate-float">
                  <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-4 sm:p-6 shadow-2xl shadow-blue-500/50 backdrop-blur-sm transition-all duration-500 hover:scale-110 hover:shadow-blue-500/70">
                    <Clock className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-blue-400 transition-transform duration-700 group-hover:rotate-180" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            </div>

            <div className={`space-y-6 md:space-y-8 text-center transition-all delay-300 duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
              <h1 className="text-4xl font-black tracking-tighter sm:text-5xl md:text-7xl lg:text-8xl">
                <span className="bg-gradient-to-br from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
                  Stop wasting time{" "}
                </span>
                <span className="text-blue-500">on timesheets</span>
              </h1>

              <p className="mx-auto max-w-2xl text-xl font-semibold text-neutral-300 sm:text-2xl md:text-3xl">
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Automated payroll
                  </span>
                  <span className="absolute inset-x-0 bottom-1 h-3 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 blur-sm" />
                </span>
                {" "}for Australian small businesses
              </p>

              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-neutral-400">
                Save 200+ hours a year. Eliminate manual errors. Review all hours and pay. We handle the rest.
                {" "}
                <span className="text-blue-300">Stash Labs sets it up for you.</span>
              </p>

              <div className="flex flex-col items-center justify-center gap-4 pt-6 md:pt-8 sm:flex-row">
                <Link
                  href="https://airtable.com/app5rtz40muNLx7Sb/pagN27LT5K7caBPsT/form"
                  className="group rounded-xl border-2 border-blue-500/50 bg-blue-500/10 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-blue-400 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
                >
                  <span className="flex items-center gap-2">
                    Request a Demo
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Problem-Solution Section */}
        <section className="container relative mx-auto px-4 py-12 md:py-20">
          <div className={`mb-10 md:mb-16 text-center transition-all delay-500 duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <h2 className="mb-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              The timesheets problem{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                solved
              </span>
            </h2>
            <p className="text-lg text-neutral-400">
              Does this sound familiar?
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {painPoints.map((point, index) => (
              <div
                key={index}
                className={`rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 md:p-8 transition-all duration-700 ${
                  mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
                }`}
                style={{
                  transitionDelay: `${700 + index * 100}ms`,
                }}
              >
                <h3 className="mb-3 text-lg font-bold text-red-400">
                  ❌ {point.problem}
                </h3>
                <p className="text-neutral-300">
                  ✅ {point.solution}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section - Business focused */}
        <section className="container relative mx-auto px-4 py-12 md:py-20">
          <div className={`mb-10 md:mb-16 text-center transition-all delay-500 duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <h2 className="mb-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              How TimeTally works for your business
            </h2>
            <p className="text-lg text-neutral-400">
              Simple. Transparent. Built for Australian businesses like yours.
            </p>
          </div>

          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`group relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 md:p-8 transition-all duration-700 hover:-translate-y-2 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 ${
                    mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
                  }`}
                  style={{
                    transitionDelay: `${700 + index * 100}ms`,
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.07]`} />

                  <div className="relative mb-6">
                    <div className={`inline-flex rounded-2xl bg-gradient-to-br ${feature.gradient} p-4 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl`}>
                      <Icon className="h-8 w-8 text-white" strokeWidth={1.5} />
                    </div>
                  </div>

                  <div className="relative">
                    <h3 className="mb-3 text-xl font-bold text-white transition-colors group-hover:text-blue-300">
                      {feature.title}
                    </h3>
                    <p className="leading-relaxed text-neutral-400 transition-colors group-hover:text-neutral-300">
                      {feature.description}
                    </p>
                  </div>

                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                </div>
              );
            })}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container relative mx-auto px-4 py-12 md:py-20">
          <div className={`mx-auto max-w-3xl transition-all delay-1000 duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <div className="group relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-blue-950/30 p-8 md:p-12 shadow-2xl transition-all duration-500 hover:border-blue-500/50 hover:shadow-blue-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

              <div className="relative text-center">
                <div className="mb-6 inline-flex rounded-full bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400">
                  Simple Setup
                </div>

                <h2 className="mb-4 text-2xl sm:text-3xl md:text-4xl font-bold">
                  Get started in 3 steps
                </h2>

                <div className="mt-8 md:mt-12 space-y-6 md:space-y-8 text-left">
                  <div className="flex gap-4 md:gap-6">
                    <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold text-base md:text-lg">
                      1
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">Add your employees</h3>
                      <p className="text-neutral-400">Upload their names, pay rates, and we&apos;ll generate PINs automatically.</p>
                    </div>
                </div>

                  <div className="flex gap-4 md:gap-6">
                    <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold text-base md:text-lg">
                      2
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">Share access with your team</h3>
                      <p className="text-neutral-400">They log in with their PIN and submit hours each week.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 md:gap-6">
                    <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold text-base md:text-lg">
                      3
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-semibold">Review & export</h3>
                      <p className="text-neutral-400">View all hours and pay calculations, then export a CSV file. We help integrate with MYOB, Xero, or your accountant.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Support & Dedicated Help Section */}
        <section className="container relative mx-auto px-4 py-12 md:py-20">
          <div className={`mb-10 md:mb-16 text-center transition-all delay-500 duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <h2 className="mb-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              You&apos;re not alone in this
            </h2>
            <p className="text-lg text-neutral-400">
              Stash Labs handles the setup. We&apos;re here every step of the way.
            </p>
          </div>

          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
            {supportPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <div
                  key={index}
                  className={`group relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 md:p-8 transition-all duration-700 hover:-translate-y-2 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 ${
                    mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
                  }`}
                  style={{
                    transitionDelay: `${700 + index * 100}ms`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.07]" />

                  <div className="relative mb-6">
                    <div className="inline-flex rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 p-4 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl">
                      <Icon className="h-8 w-8 text-white" strokeWidth={1.5} />
                    </div>
                  </div>

                  <div className="relative">
                    <h3 className="mb-3 text-xl font-bold text-white transition-colors group-hover:text-blue-300">
                      {point.title}
                    </h3>
                    <p className="leading-relaxed text-neutral-400 transition-colors group-hover:text-neutral-300">
                      {point.description}
                    </p>
                  </div>

                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container relative mx-auto px-4 py-12 md:py-20">
          <div className={`mx-auto max-w-2xl rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-purple-950/20 p-8 md:p-12 text-center transition-all delay-1000 duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <h2 className="mb-4 text-xl sm:text-2xl md:text-3xl font-bold">
              Ready to save 200+ hours a year?
            </h2>
            <p className="mb-8 text-lg text-neutral-400">
              Let&apos;s chat about how we can set up TimeTally for your business. No obligation, just a quick conversation.
            </p>
            <Link
              href="https://airtable.com/app5rtz40muNLx7Sb/pagN27LT5K7caBPsT/form"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-8 py-4 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30"
            >
              Request a Demo
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative mt-20 border-t border-neutral-900 py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="mb-4 text-neutral-400">
              Built for Australian small businesses by Stash Labs.
            </p>
            <p className="text-neutral-500">
            &copy; {new Date().getFullYear()} TimeTally. All rights reserved. &nbsp;|&nbsp; Built by{" "}
              <a
                href="https://stashlabs.com.au"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-400 transition-colors hover:text-blue-300 hover:underline"
              >
                Stash Labs.
              </a>  
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}