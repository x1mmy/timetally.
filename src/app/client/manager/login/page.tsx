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
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

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

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error || "Invalid PIN");
        return;
      }

      // Redirect to manager dashboard on success
      router.push("/client/manager/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
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
    <>
      <header className="bg-card border-border border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/client"
            className="text-muted-foreground hover:text-primary inline-block py-2 text-sm transition-colors"
          >
            ‹ Back
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto grid max-w-[340px] justify-items-center gap-5 px-4 py-12 text-center [@media(orientation:landscape)_and_(max-height:540px)]:max-w-2xl [@media(orientation:landscape)_and_(max-height:540px)]:grid-cols-[minmax(0,1fr)_280px] [@media(orientation:landscape)_and_(max-height:540px)]:items-center [@media(orientation:landscape)_and_(max-height:540px)]:gap-x-10 [@media(orientation:landscape)_and_(max-height:540px)]:gap-y-2 [@media(orientation:landscape)_and_(max-height:540px)]:py-5 [@media(orientation:portrait)_and_(max-height:700px)]:gap-3.5 [@media(orientation:portrait)_and_(max-height:700px)]:py-5">
        <div className="grid gap-5 [@media(orientation:landscape)_and_(max-height:540px)]:col-start-1 [@media(orientation:landscape)_and_(max-height:540px)]:row-start-1 [@media(orientation:landscape)_and_(max-height:540px)]:gap-3 [@media(orientation:portrait)_and_(max-height:700px)]:gap-3.5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Manager login
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Enter your manager PIN to open the dashboard
            </p>
          </div>
          <p className="font-medium">Enter manager PIN</p>
        </div>

        <div className="w-full [@media(orientation:landscape)_and_(max-height:540px)]:col-start-2 [@media(orientation:landscape)_and_(max-height:540px)]:row-span-2 [@media(orientation:landscape)_and_(max-height:540px)]:row-start-1">
          <PinPad
            length={4}
            onComplete={handlePinComplete}
            onClear={handlePinClear}
          />
        </div>

        <div
          className="min-h-5 w-full [@media(orientation:landscape)_and_(max-height:540px)]:col-start-1 [@media(orientation:landscape)_and_(max-height:540px)]:row-start-2"
          aria-live="polite"
        >
          {error && (
            <p
              role="alert"
              className="bg-warn/10 text-warn rounded-lg px-3 py-2 text-sm"
            >
              {error}
            </p>
          )}
          {loading && (
            <p className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
              Checking…
            </p>
          )}
        </div>
      </main>
    </>
  );
}
