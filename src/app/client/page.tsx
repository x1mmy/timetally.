/**
 * Client Portal Landing Page
 * Entry point for client subdomains (e.g., acme.timetally.com)
 * Features:
 * - Welcome message with business name
 * - Two login options: Employee and Manager
 * - Navigation to respective login pages
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Clock, Users, Lock, Sparkles } from "lucide-react";
import { LazyMotion, m } from "framer-motion";
import { loadDomAnimation } from "@/lib/motion-features";

export default function ClientLandingPage() {
  const [businessName, setBusinessName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  /**
   * Fetch client information on mount
   */
  useEffect(() => {
    const fetchClientInfo = async () => {
      try {
        // In a real implementation, you'd fetch this from an API endpoint
        // For now, we'll use a placeholder
        setBusinessName("Welcome");
      } catch (error) {
        console.error("Error fetching client info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientInfo();
  }, []);

  if (loading) {
    return (
      <LazyMotion features={loadDomAnimation}>
        <div className="flex min-h-screen items-center justify-center bg-neutral-950">
          <m.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-white"
          >
            <div className="flex items-center gap-3">
              <Clock className="text-primary h-8 w-8 animate-spin" />
              <span className="text-lg">Loading...</span>
            </div>
          </m.div>
        </div>
      </LazyMotion>
    );
  }

  return (
    <LazyMotion features={loadDomAnimation}>
      <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
        {/* Animated Background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-20 -left-40 h-96 w-96 animate-pulse rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute -right-40 bottom-20 h-96 w-96 animate-pulse rounded-full bg-blue-400/5 blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-16">
          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <m.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6 flex justify-center"
            >
              <div className="relative">
                <Clock className="text-primary relative z-10 h-20 w-20 drop-shadow-2xl" />
                <m.div
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  <Clock className="text-primary/30 h-20 w-20" />
                </m.div>
              </div>
            </m.div>

            <m.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-3 text-5xl font-bold tracking-tight md:text-6xl"
            >
              TimeTally<span className="text-primary">.</span>
            </m.h1>

            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 text-xl text-neutral-400"
            >
              <Sparkles className="h-5 w-5" />
              Payroll Management System
            </m.p>
          </m.div>

          {/* Login Options */}
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {/* Employee Login Card */}
            <m.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
            >
              <Link
                href="/client/employee/login"
                className="group block h-full"
              >
                <Card className="hover:border-primary/50 hover:shadow-primary/20 relative h-full overflow-hidden border-neutral-800 bg-neutral-900/50 p-8 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-neutral-900/80 hover:shadow-2xl">
                  {/* Gradient overlay on hover */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="from-primary/10 absolute inset-0 bg-gradient-to-br to-transparent" />
                  </div>

                  <div className="relative space-y-5 text-center">
                    <m.div
                      className="flex justify-center"
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="bg-primary/10 ring-primary/20 rounded-2xl p-5 ring-2">
                        <Users className="text-primary h-16 w-16" />
                      </div>
                    </m.div>

                    <h2 className="text-3xl font-bold text-white">
                      Employee Login
                    </h2>

                    <p className="text-neutral-400">
                      Submit your weekly timesheet
                    </p>

                    <div className="pt-4">
                      <div className="bg-primary shadow-primary/30 group-hover:shadow-primary/40 inline-flex items-center gap-2 rounded-xl px-8 py-3 font-semibold text-white shadow-lg transition-all group-hover:shadow-xl">
                        Login with PIN
                        <m.span
                          className="inline-block"
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          →
                        </m.span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </m.div>

            {/* Manager Login Card */}
            <m.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
            >
              <Link href="/client/manager/login" className="group block h-full">
                <Card className="hover:border-primary/50 hover:shadow-primary/20 relative h-full overflow-hidden border-neutral-800 bg-neutral-900/50 p-8 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-neutral-900/80 hover:shadow-2xl">
                  {/* Gradient overlay on hover */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="from-primary/10 absolute inset-0 bg-gradient-to-br to-transparent" />
                  </div>

                  <div className="relative space-y-5 text-center">
                    <m.div
                      className="flex justify-center"
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="bg-primary/10 ring-primary/20 rounded-2xl p-5 ring-2">
                        <Lock className="text-primary h-16 w-16" />
                      </div>
                    </m.div>

                    <h2 className="text-3xl font-bold text-white">
                      Manager Access
                    </h2>

                    <p className="text-neutral-400">
                      Review and export payroll data
                    </p>

                    <div className="pt-4">
                      <div className="bg-primary shadow-primary/30 group-hover:shadow-primary/40 inline-flex items-center gap-2 rounded-xl px-8 py-3 font-semibold text-white shadow-lg transition-all group-hover:shadow-xl">
                        Manager Login
                        <m.span
                          className="inline-block"
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          →
                        </m.span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </m.div>
          </div>

          {/* Footer */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 text-center text-sm text-neutral-500"
          >
            <p>
              2025 © TimeTally. | Built by{" "}
              <a
                href="https://stashlabs.com.au"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary text-neutral-400 transition-colors hover:underline"
              >
                Stash Labs.
              </a>
            </p>
          </m.div>
        </div>
      </div>
    </LazyMotion>
  );
}
