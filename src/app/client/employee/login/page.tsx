/**
 * Employee Login Page
 * PIN-only authentication for employees
 * Features:
 * - PIN pad for secure PIN entry (4 digits)
 * - Session creation on successful login
 * - Redirect to employee dashboard
 * Note: Each employee has a unique PIN per client
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PinPad } from "@/components/PinPad";
import { Label } from "@/components/ui/label";
import { Clock, Users, ArrowLeft } from "lucide-react";
import { LazyMotion, m, AnimatePresence } from "framer-motion";
import { loadDomAnimation } from "@/lib/motion-features";
import Link from "next/link";

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Handle PIN completion
   * Automatically triggered when PIN is fully entered
   */
  const handlePinComplete = async (pin: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/client/auth/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Fetch employee details to check category
      const meRes = await fetch("/api/client/auth/employee/me");
      if (!meRes.ok) {
        setError("Failed to load employee info. Please try again.");
        return;
      }
      const meJson = (await meRes.json()) as {
        employee?: {
          id: string;
          firstName?: string;
          lastName?: string;
          categoryName?: string | null;
          dashboardView?: "weekly" | "today_only" | null;
        };
      };
      if (!meJson.employee) {
        setError("Failed to load employee info. Please try again.");
        return;
      }
      const dashboardView = meJson.employee.dashboardView ?? "weekly";

      // Redirect based on configured dashboard view for this category
      if (dashboardView === "today_only") {
        router.push("/client/employee/clock");
      } else {
        router.push("/client/employee/dashboard");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle PIN clear
   * Reset error state when user clears PIN
   */
  const handlePinClear = () => {
    setError("");
  };

  return (
    <LazyMotion features={loadDomAnimation}>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 text-white">
        {/* Animated Background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-20 left-1/4 h-96 w-96 animate-pulse rounded-full bg-blue-500/10 blur-3xl" />
          <div className="bg-primary/10 absolute right-1/4 bottom-20 h-96 w-96 animate-pulse rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md space-y-8 p-8">
          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4 text-center"
          >
            <m.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="bg-primary/10 ring-primary/20 rounded-2xl p-6 ring-2">
                  <Users className="text-primary h-16 w-16" />
                </div>
                <m.div
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  <div className="bg-primary/20 rounded-2xl p-6">
                    <Users className="text-primary/30 h-16 w-16" />
                  </div>
                </m.div>
              </div>
            </m.div>
            <m.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold"
            >
              Employee Login
            </m.h1>
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-neutral-400"
            >
              Enter your 4-digit PIN to access your timesheet
            </m.p>
          </m.div>

          {/* PIN Pad */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-sm"
          >
            <Label className="mb-4 block text-center text-lg font-semibold">
              Enter PIN
            </Label>
            <PinPad
              length={4}
              onComplete={handlePinComplete}
              onClear={handlePinClear}
            />
          </m.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <m.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-400 backdrop-blur-sm"
              >
                {error}
              </m.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          <AnimatePresence>
            {loading && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-3 text-neutral-400"
              >
                <m.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Clock className="text-primary h-5 w-5" />
                </m.div>
                <span>Authenticating...</span>
              </m.div>
            )}
          </AnimatePresence>

          {/* Back Link */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <Link
              href="/client"
              className="hover:text-primary inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to portal selection
            </Link>
          </m.div>
        </div>
      </div>
    </LazyMotion>
  );
}
