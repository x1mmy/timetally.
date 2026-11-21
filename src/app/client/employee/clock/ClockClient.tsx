"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

interface ClockState {
  startTime: string | null; // HH:MM from saved timesheet
  endTime: string | null;
}

interface RecentTimesheet {
  work_date: string;
  start_time: string | null;
  end_time: string | null;
}

function resolveTodayState(recentTimesheets: RecentTimesheet[]): ClockState {
  const today = format(new Date(), "yyyy-MM-dd");
  const todays = recentTimesheets.find((t) => t.work_date === today);
  return {
    startTime: todays?.start_time?.slice(0, 5) ?? null,
    endTime: todays?.end_time?.slice(0, 5) ?? null,
  };
}

export function ClockClient({
  employeeId,
  employeeName,
  recentTimesheets,
}: {
  employeeId: string;
  employeeName: string;
  recentTimesheets: RecentTimesheet[];
}) {
  const router = useRouter();
  // Deterministic on both server and client render: avoids a hydration
  // mismatch, since "today" can only be resolved against the browser's
  // actual timezone, not the server's.
  const [clockState, setClockState] = useState<ClockState>({
    startTime: null,
    endTime: null,
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

  const handleLogout = async () => {
    await fetch("/api/client/auth/employee", { method: "DELETE" });
    router.push("/client");
  };

  const isComplete =
    clockState.startTime !== null && clockState.endTime !== null;
  const isClockedIn =
    clockState.startTime !== null && clockState.endTime === null;
  const isNotClockedIn = clockState.startTime === null;

  const formatAmPm = (time: string | null) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const period = h! >= 12 ? "pm" : "am";
    const hour = h! % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${period}`;
  };

  return (
    <>
      {/* Header */}
      <header className="bg-card border-border border-b">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Logo />
            <span className="border-input text-muted-foreground truncate border-l pl-3 text-sm">
              {employeeName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Log out
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto grid max-w-[420px] gap-4 px-4 py-6 sm:px-6 sm:py-8 [@media(orientation:landscape)_and_(max-height:540px)]:max-w-3xl [@media(orientation:landscape)_and_(max-height:540px)]:grid-cols-2 [@media(orientation:landscape)_and_(max-height:540px)]:items-center [@media(orientation:landscape)_and_(max-height:540px)]:gap-x-8 [@media(orientation:landscape)_and_(max-height:540px)]:py-5">
        {/* Live clock */}
        <div className="pt-4 text-center [@media(orientation:landscape)_and_(max-height:540px)]:col-start-1 [@media(orientation:landscape)_and_(max-height:540px)]:row-span-3 [@media(orientation:landscape)_and_(max-height:540px)]:row-start-1 [@media(orientation:landscape)_and_(max-height:540px)]:pt-0">
          <p className="text-7xl leading-none font-medium tracking-tight tabular-nums [@media(orientation:landscape)_and_(max-height:540px)]:text-6xl">
            {format(currentTime, "h:mm")}
            <span className="text-muted-foreground ml-1.5 text-2xl tracking-normal">
              {format(currentTime, "aaa")}
            </span>
          </p>
          <p className="text-muted-foreground mt-2.5">
            {format(currentTime, "EEEE d MMMM yyyy")}
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="bg-warn/10 text-warn rounded-lg px-3 py-2 text-center text-sm [@media(orientation:landscape)_and_(max-height:540px)]:col-start-2"
          >
            {error}
          </p>
        )}

        {/* State: not clocked in */}
        {isNotClockedIn && (
          <Button
            variant="go"
            onClick={handleClockIn}
            disabled={loading}
            className="h-18 w-full rounded-xl text-xl [@media(orientation:landscape)_and_(max-height:540px)]:col-start-2 [@media(orientation:landscape)_and_(max-height:540px)]:h-16"
          >
            {loading ? (
              <Loader2 className="size-6 animate-spin" strokeWidth={1.5} />
            ) : (
              "Clock in"
            )}
          </Button>
        )}

        {/* State: clocked in, no clock out yet */}
        {isClockedIn && (
          <div className="grid gap-4 [@media(orientation:landscape)_and_(max-height:540px)]:col-start-2">
            <div className="border-border bg-card grid gap-1.5 rounded-lg border p-4 text-center">
              <p className="text-muted-foreground text-sm">Clocked in at</p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {formatAmPm(clockState.startTime)}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleClockOut}
              disabled={loading}
              className="h-18 w-full rounded-xl text-xl [@media(orientation:landscape)_and_(max-height:540px)]:h-16"
            >
              {loading ? (
                <Loader2 className="size-6 animate-spin" strokeWidth={1.5} />
              ) : (
                "Clock out"
              )}
            </Button>
          </div>
        )}

        {/* State: complete for today */}
        {isComplete && (
          <div className="border-border bg-card grid gap-1.5 rounded-lg border p-4 text-center [@media(orientation:landscape)_and_(max-height:540px)]:col-start-2">
            <p className="text-lg font-semibold">Done for today</p>
            <div className="mt-1.5 flex justify-center gap-10 text-sm">
              <div>
                <p className="text-muted-foreground">In</p>
                <p className="text-xl font-semibold tabular-nums">
                  {formatAmPm(clockState.startTime)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Out</p>
                <p className="text-xl font-semibold tabular-nums">
                  {formatAmPm(clockState.endTime)}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
