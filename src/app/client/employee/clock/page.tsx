"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { LogOut, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClockState {
  startTime: string | null; // HH:MM from saved timesheet
  endTime: string | null;
}

export default function FruitClockPage() {
  const router = useRouter();
  const [employeeName, setEmployeeName] = useState("Employee");
  const [employeeId, setEmployeeId] = useState("");
  const [clockState, setClockState] = useState<ClockState>({ startTime: null, endTime: null });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Live clock tick
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load employee + today's timesheet
  const loadData = useCallback(async () => {
    const meRes = await fetch("/api/client/auth/employee/me");
    const meJson = await meRes.json() as {
      employee?: { id: string; firstName?: string; lastName?: string };
    };
    if (!meRes.ok || !meJson.employee) {
      router.push("/client/employee/login");
      return;
    }
    const emp = meJson.employee;
    setEmployeeName(`${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || "Employee");
    setEmployeeId(emp.id);

    const today = format(new Date(), "yyyy-MM-dd");
    const tsRes = await fetch(`/api/client/timesheets?employeeId=${emp.id}&startDate=${today}&endDate=${today}`);
    if (!tsRes.ok) {
      // silently accept "not clocked in" state on fetch failure
      return;
    }
    const tsJson = await tsRes.json() as { timesheets?: { start_time: string; end_time: string }[] };
    const ts = tsJson.timesheets?.[0];
    if (ts) {
      setClockState({
        startTime: ts.start_time?.slice(0, 5) ?? null,
        endTime: ts.end_time?.slice(0, 5) ?? null,
      });
    }
  }, [router]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleClockIn = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    const now = format(new Date(), "HH:mm");
    const today = format(new Date(), "yyyy-MM-dd");
    const res = await fetch("/api/client/timesheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, workDate: today, startTime: `${now}:00`, endTime: null }),
    });
    if (!res.ok) {
      const json = await res.json() as { error?: string };
      setError(json.error ?? "Failed to clock in");
    } else {
      setClockState({ startTime: now, endTime: null });
    }
    setLoading(false);
  };

  const handleClockOut = async () => {
    if (loading) return;
    if (!clockState.startTime) {
      setError("Clock in time not found. Please try again.");
      return;
    }
    setLoading(true);
    setError("");
    const now = format(new Date(), "HH:mm");
    const today = format(new Date(), "yyyy-MM-dd");
    const res = await fetch("/api/client/timesheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, workDate: today, startTime: `${clockState.startTime}:00`, endTime: `${now}:00` }),
    });
    if (!res.ok) {
      const json = await res.json() as { error?: string };
      setError(json.error ?? "Failed to clock out");
    } else {
      setClockState((prev) => ({ ...prev, endTime: now }));
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch("/api/client/auth/employee", { method: "DELETE" });
    router.push("/client");
  };

  const isComplete = clockState.startTime !== null && clockState.endTime !== null;
  const isClockedIn = clockState.startTime !== null && clockState.endTime === null;
  const isNotClockedIn = clockState.startTime === null;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-20 h-64 w-64 animate-pulse rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-20 right-0 h-64 w-64 animate-pulse rounded-full bg-blue-400/5 blur-3xl" />
      </div>

      {/* Header */}
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/80 px-6 py-4 backdrop-blur-lg">
        <div>
          <h1 className="text-xl font-bold">Welcome, <span className="text-primary">{employeeName}</span></h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm transition-all hover:border-primary/50"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Main */}
      <div className="relative flex w-full max-w-sm flex-col items-center gap-8 px-6">
        {/* Live clock */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-6xl font-bold tabular-nums">{format(currentTime, "HH:mm")}</p>
          <p className="mt-2 text-neutral-400">{format(currentTime, "EEEE, d MMMM yyyy")}</p>
        </motion.div>

        {error && (
          <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {/* State: not clocked in */}
        {isNotClockedIn && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
            <Button
              onClick={handleClockIn}
              disabled={loading || !employeeId}
              className="h-24 w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-2xl font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 disabled:opacity-50"
            >
              {loading ? <Clock className="animate-spin h-8 w-8" /> : "Clock In"}
            </Button>
          </motion.div>
        )}

        {/* State: clocked in, no clock out yet */}
        {isClockedIn && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-4">
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
              <p className="text-sm text-neutral-400">Clocked in at</p>
              <p className="text-3xl font-bold text-green-400">{clockState.startTime}</p>
            </div>
            <Button
              onClick={handleClockOut}
              disabled={loading}
              className="h-24 w-full rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-2xl font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-50"
            >
              {loading ? <Clock className="animate-spin h-8 w-8" /> : "Clock Out"}
            </Button>
          </motion.div>
        )}

        {/* State: complete for today */}
        {isComplete && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6 text-center space-y-3">
              <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
              <p className="text-lg font-semibold">Done for today!</p>
              <div className="flex justify-center gap-8 text-sm text-neutral-400">
                <div>
                  <p>In</p>
                  <p className="text-xl font-bold text-white">{clockState.startTime}</p>
                </div>
                <div>
                  <p>Out</p>
                  <p className="text-xl font-bold text-white">{clockState.endTime}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
