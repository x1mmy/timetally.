"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { LazyMotion, m } from "framer-motion";
import { loadDomAnimation } from "@/lib/motion-features";
import { LogOut, Clock, CheckCircle2, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimesheetBreak {
  id: string;
  break_start_time: string; // HH:MM:SS
  break_end_time: string | null; // null while break is in progress
}

interface ClockState {
  startTime: string | null; // HH:MM from saved timesheet
  endTime: string | null;
  breaks: TimesheetBreak[];
}

interface RecentTimesheet {
  work_date: string;
  start_time: string | null;
  end_time: string | null;
  breaks: TimesheetBreak[];
}

function resolveTodayState(recentTimesheets: RecentTimesheet[]): ClockState {
  const today = format(new Date(), "yyyy-MM-dd");
  const todays = recentTimesheets.find((t) => t.work_date === today);
  return {
    startTime: todays?.start_time?.slice(0, 5) ?? null,
    endTime: todays?.end_time?.slice(0, 5) ?? null,
    breaks: todays?.breaks ?? [],
  };
}

// Sums completed breaks (HH:MM:SS strings) into whole minutes for display.
function totalBreakMinutes(breaks: TimesheetBreak[]): number {
  return breaks.reduce((sum, b) => {
    if (!b.break_end_time) return sum;
    const [sh = 0, sm = 0] = b.break_start_time.split(":").map(Number);
    const [eh = 0, em = 0] = b.break_end_time.split(":").map(Number);
    return sum + (eh * 60 + em - (sh * 60 + sm));
  }, 0);
}

export function ClockClient({
  employeeId,
  employeeName,
  recentTimesheets,
  allowBreakLogging,
}: {
  employeeId: string;
  employeeName: string;
  recentTimesheets: RecentTimesheet[];
  allowBreakLogging: boolean;
}) {
  const router = useRouter();
  // Deterministic on both server and client render: avoids a hydration
  // mismatch, since "today" can only be resolved against the browser's
  // actual timezone, not the server's.
  const [clockState, setClockState] = useState<ClockState>({
    startTime: null,
    endTime: null,
    breaks: [],
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Resolve today's entry from the already-fetched data (no network call —
  // just matches against the browser's local date once mounted).
  useEffect(() => {
    setClockState(resolveTodayState(recentTimesheets));
  }, [recentTimesheets]);

  // Live clock tick
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClockIn = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    const now = format(new Date(), "HH:mm");
    const today = format(new Date(), "yyyy-MM-dd");
    const res = await fetch("/api/client/timesheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        workDate: today,
        startTime: `${now}:00`,
        endTime: null,
      }),
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      setError(json.error ?? "Failed to clock in");
    } else {
      setClockState({ startTime: now, endTime: null, breaks: [] });
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
      body: JSON.stringify({
        employeeId,
        workDate: today,
        endTime: `${now}:00`,
      }),
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      setError(json.error ?? "Failed to clock out");
    } else {
      setClockState((prev) => ({ ...prev, endTime: now }));
    }
    setLoading(false);
  };

  const handleStartBreak = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    const now = format(new Date(), "HH:mm");
    const today = format(new Date(), "yyyy-MM-dd");
    const res = await fetch("/api/client/timesheets/breaks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        workDate: today,
        action: "start",
        time: `${now}:00`,
      }),
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      setError(json.error ?? "Failed to start break");
    } else {
      const json = (await res.json()) as { break: TimesheetBreak };
      setClockState((prev) => ({ ...prev, breaks: [...prev.breaks, json.break] }));
    }
    setLoading(false);
  };

  const handleEndBreak = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    const now = format(new Date(), "HH:mm");
    const today = format(new Date(), "yyyy-MM-dd");
    const res = await fetch("/api/client/timesheets/breaks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        workDate: today,
        action: "end",
        time: `${now}:00`,
      }),
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      setError(json.error ?? "Failed to end break");
    } else {
      const json = (await res.json()) as { break: TimesheetBreak };
      setClockState((prev) => ({
        ...prev,
        breaks: prev.breaks.map((b) => (b.id === json.break.id ? json.break : b)),
      }));
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch("/api/client/auth/employee", { method: "DELETE" });
    router.push("/client");
  };

  const openBreak = clockState.breaks.find((b) => b.break_end_time === null) ?? null;
  const isComplete =
    clockState.startTime !== null && clockState.endTime !== null;
  const isOnBreak =
    clockState.startTime !== null &&
    clockState.endTime === null &&
    openBreak !== null;
  const isClockedIn =
    clockState.startTime !== null &&
    clockState.endTime === null &&
    !isOnBreak;
  const isNotClockedIn = clockState.startTime === null;
  const breakMinutesToday = totalBreakMinutes(clockState.breaks);

  const formatAmPm = (time: string | null) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const period = h! >= 12 ? "PM" : "AM";
    const hour = h! % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${period}`;
  };

  return (
    <LazyMotion features={loadDomAnimation}>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-950 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-20 left-0 h-64 w-64 animate-pulse rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute right-0 bottom-20 h-64 w-64 animate-pulse rounded-full bg-blue-400/5 blur-3xl" />
        </div>

        {/* Header */}
        <div className="absolute top-0 right-0 left-0 flex items-center justify-between border-b border-neutral-800 bg-neutral-900/80 px-6 py-4 backdrop-blur-lg">
          <div>
            <h1 className="text-xl font-bold">
              Welcome, <span className="text-primary">{employeeName}</span>
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="hover:border-primary/50 flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Main */}
        <div className="relative flex w-full max-w-sm flex-col items-center gap-8 px-6">
          {/* Live clock */}
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-6xl font-bold tabular-nums">
              {format(currentTime, "h:mm a")}
            </p>
            <p className="mt-2 text-neutral-400">
              {format(currentTime, "EEEE, d MMMM yyyy")}
            </p>
          </m.div>

          {error && (
            <div className="w-full rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          {/* State: not clocked in */}
          {isNotClockedIn && (
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <Button
                onClick={handleClockIn}
                disabled={loading}
                className="h-24 w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-2xl font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 disabled:opacity-50"
              >
                {loading ? (
                  <Clock className="h-8 w-8 animate-spin" />
                ) : (
                  "Clock In"
                )}
              </Button>
            </m.div>
          )}

          {/* State: clocked in, no clock out yet */}
          {isClockedIn && (
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-4"
            >
              <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
                <p className="text-sm text-neutral-400">Clocked in at</p>
                <p className="text-3xl font-bold text-green-400">
                  {formatAmPm(clockState.startTime)}
                </p>
                {breakMinutesToday > 0 && (
                  <p className="mt-1 text-xs text-neutral-500">
                    {breakMinutesToday} min break today
                  </p>
                )}
              </div>
              <Button
                onClick={handleClockOut}
                disabled={loading}
                className="h-24 w-full rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-2xl font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-50"
              >
                {loading ? (
                  <Clock className="h-8 w-8 animate-spin" />
                ) : (
                  "Clock Out"
                )}
              </Button>
              {allowBreakLogging && (
                <Button
                  onClick={handleStartBreak}
                  disabled={loading}
                  variant="outline"
                  className="h-14 w-full rounded-2xl border-amber-500/40 bg-transparent text-lg font-semibold text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
                >
                  <Coffee className="mr-2 h-5 w-5" />
                  Start Break
                </Button>
              )}
            </m.div>
          )}

          {/* State: on break */}
          {isOnBreak && openBreak && (
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-4"
            >
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
                <p className="text-sm text-neutral-400">On break since</p>
                <p className="text-3xl font-bold text-amber-400">
                  {formatAmPm(openBreak.break_start_time.slice(0, 5))}
                </p>
              </div>
              <Button
                onClick={handleEndBreak}
                disabled={loading}
                className="h-24 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-2xl font-bold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 disabled:opacity-50"
              >
                {loading ? (
                  <Clock className="h-8 w-8 animate-spin" />
                ) : (
                  "End Break"
                )}
              </Button>
            </m.div>
          )}

          {/* State: complete for today */}
          {isComplete && (
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <div className="space-y-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-6 text-center">
                <CheckCircle2 className="text-primary mx-auto h-10 w-10" />
                <p className="text-lg font-semibold">Done for today!</p>
                <div className="flex justify-center gap-8 text-sm text-neutral-400">
                  <div>
                    <p>In</p>
                    <p className="text-xl font-bold text-white">
                      {formatAmPm(clockState.startTime)}
                    </p>
                  </div>
                  <div>
                    <p>Out</p>
                    <p className="text-xl font-bold text-white">
                      {formatAmPm(clockState.endTime)}
                    </p>
                  </div>
                </div>
              </div>
            </m.div>
          )}
        </div>
      </div>
    </LazyMotion>
  );
}
