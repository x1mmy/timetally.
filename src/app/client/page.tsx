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
import { motion } from "framer-motion";

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
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-white"
        >
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 animate-spin text-primary" />
            <span className="text-lg">Loading...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-96 w-96 animate-pulse rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute -right-40 bottom-20 h-96 w-96 animate-pulse rounded-full bg-blue-400/5 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-6 flex justify-center"
          >
            <div className="relative">
              <Clock className="relative z-10 h-20 w-20 text-primary drop-shadow-2xl" />
              <motion.div
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <Clock className="h-20 w-20 text-primary/30" />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-3 text-5xl font-bold tracking-tight md:text-6xl"
          >
            TimeTally<span className="text-primary">.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 text-xl text-neutral-400"
          >
            <Sparkles className="h-5 w-5" />
            Payroll Management System
          </motion.p>
        </motion.div>

        {/* Login Options */}
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {/* Employee Login Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
          >
            <Link href="/client/employee/login" className="group block h-full">
              <Card className="relative h-full overflow-hidden border-neutral-800 bg-neutral-900/50 p-8 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-primary/50 hover:bg-neutral-900/80 hover:shadow-2xl hover:shadow-primary/20">
                {/* Gradient overlay on hover */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                </div>

                <div className="relative space-y-5 text-center">
                  <motion.div
                    className="flex justify-center"
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="rounded-2xl bg-primary/10 p-5 ring-2 ring-primary/20">
                      <Users className="h-16 w-16 text-primary" />
                    </div>
                  </motion.div>

                  <h2 className="text-3xl font-bold text-white">
                    Employee Login
                  </h2>

                  <p className="text-neutral-400">
                    Submit your weekly timesheet
                  </p>

                  <div className="pt-4">
                    <div className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition-all group-hover:shadow-xl group-hover:shadow-primary/40">
                      Login with PIN
                      <motion.span
                        className="inline-block"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        →
                      </motion.span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>

          {/* Manager Login Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
          >
            <Link href="/client/manager/login" className="group block h-full">
              <Card className="relative h-full overflow-hidden border-neutral-800 bg-neutral-900/50 p-8 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-primary/50 hover:bg-neutral-900/80 hover:shadow-2xl hover:shadow-primary/20">
                {/* Gradient overlay on hover */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                </div>

                <div className="relative space-y-5 text-center">
                  <motion.div
                    className="flex justify-center"
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="rounded-2xl bg-primary/10 p-5 ring-2 ring-primary/20">
                      <Lock className="h-16 w-16 text-primary" />
                    </div>
                  </motion.div>

                  <h2 className="text-3xl font-bold text-white">
                    Manager Access
                  </h2>

                  <p className="text-neutral-400">
                    Review and export payroll data
                  </p>

                  <div className="pt-4">
                    <div className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition-all group-hover:shadow-xl group-hover:shadow-primary/40">
                      Manager Login
                      <motion.span
                        className="inline-block"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        →
                      </motion.span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
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
              className="text-neutral-400 transition-colors hover:text-primary hover:underline"
            >
              Stash Labs.
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
