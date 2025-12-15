/**
 * Manager Login Page
 * PIN-based authentication for managers
 * Features:
 * - PIN pad for secure PIN entry
 * - Session creation on successful login
 * - Redirect to manager dashboard
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PinPad } from "@/components/PinPad";
import { Label } from "@/components/ui/label";
import { Clock, Lock, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function ManagerLoginPage() {
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
      const response = await fetch("/api/client/auth/manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid PIN");
        return;
      }

      // Redirect to manager dashboard on success
      router.push("/client/manager/dashboard");
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 text-white">
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-20 h-96 w-96 animate-pulse rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-8 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="rounded-2xl bg-primary/10 p-6 ring-2 ring-primary/20">
                <Lock className="h-16 w-16 text-primary" />
              </div>
              <motion.div
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <div className="rounded-2xl bg-primary/20 p-6">
                  <Lock className="h-16 w-16 text-primary/30" />
                </div>
              </motion.div>
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold"
          >
            Manager Access
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-neutral-400"
          >
            Enter your manager PIN to access the dashboard
          </motion.p>
        </motion.div>

        {/* PIN Pad */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-sm"
        >
          <Label className="mb-4 block text-center text-lg font-semibold">
            Enter Manager PIN
          </Label>
          <PinPad
            length={4}
            onComplete={handlePinComplete}
            onClear={handlePinClear}
          />
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-400 backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-3 text-neutral-400"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Clock className="h-5 w-5 text-primary" />
              </motion.div>
              <span>Authenticating...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <Link
            href="/client"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portal selection
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
