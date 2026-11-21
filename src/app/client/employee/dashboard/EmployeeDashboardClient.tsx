"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TimePicker } from "@/components/TimePicker";
import { Button } from "@/components/ui/button";
import {
  format,
  addWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
} from "date-fns";
import { useRouter } from "next/navigation";
import type { Timesheet } from "@/types/database";
import { formatHoursAndMinutes } from "@/lib/timeUtils";
import { cn } from "@/lib/utils";

interface DayEntry {
  date: Date;
  dayName: string;
  dayNumber: number;
  monthName: string;
  startTime: string;
  endTime: string;
}

function getWeekDates(weekOffset: number) {
  const today = new Date();
  const weekStart = startOfWeek(addWeeks(today, weekOffset), {
    weekStartsOn: 1,
  }); // Monday
  const weekEnd = endOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 }); // Sunday
  return { weekStart, weekEnd };
}

function buildWeekDays(
  weekOffset: number,
  existingTimesheets: Timesheet[],
): DayEntry[] {
  const { weekStart, weekEnd } = getWeekDates(weekOffset);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return days.map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existingEntry = existingTimesheets.find(
      (ts) => format(new Date(ts.work_date), "yyyy-MM-dd") === dateStr,
    );

    return {
      date,
      dayName: format(date, "EEEE"),
      dayNumber: parseInt(format(date, "d")),
      monthName: format(date, "MMM"),
      startTime: existingEntry?.start_time?.slice(0, 5) ?? "",
      endTime: existingEntry?.end_time?.slice(0, 5) ?? "",
    };
  });
}

export function EmployeeDashboardClient({
  employeeId,
  employeeName,
  initialTimesheets,
}: {
  employeeId: string;
  employeeName: string;
  initialTimesheets: Timesheet[];
}) {
  const router = useRouter();

  // Week navigation
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = current week, -1 = last week, 1 = next week

  // Week days with entries
  const [weekDays, setWeekDays] = useState<DayEntry[]>(() =>
    buildWeekDays(0, initialTimesheets),
  );

  // UI state
  const [loading, setLoading] = useState<string | null>(null); // stores the date being saved
  const [deletingDate, setDeletingDate] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Per-day save feedback: which date was just saved (shows green/success on that day card)
  const [lastSavedDate, setLastSavedDate] = useState<string | null>(null);

  // Past timesheets
  const [timesheets, setTimesheets] = useState<Timesheet[]>(initialTimesheets);

  /**
   * Re-fetch timesheets — used after a save/delete mutation, not on load
   * (the initial set arrives already server-rendered).
   */
  const fetchTimesheets = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/client/timesheets?employeeId=${employeeId}`,
      );
      const json: unknown = await response.json();

      if (response.ok && typeof json === "object" && json !== null) {
        const { timesheets: fetchedTimesheets } = json as {
          timesheets?: Timesheet[];
        };
        setTimesheets(fetchedTimesheets ?? []);
        setWeekDays(buildWeekDays(currentWeek, fetchedTimesheets ?? []));
      }
    } catch (error) {
      console.error("Error fetching timesheets:", error);
    }
  }, [employeeId, currentWeek]);

  /**
   * Handle week navigation
   */
  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = direction === "prev" ? currentWeek - 1 : currentWeek + 1;
    setCurrentWeek(newWeek);
    setWeekDays(buildWeekDays(newWeek, timesheets));
  };

  /**
   * Update time for a specific day
   */
  const updateDayTime = (
    index: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setWeekDays((prev) => {
      const updated = [...prev];
      const current = updated[index];
      if (!current) return updated;

      if (field === "startTime") {
        updated[index] = { ...current, startTime: value };
      } else {
        updated[index] = { ...current, endTime: value };
      }
      return updated;
    });
  };

  /**
   * Save timesheet for a specific day
   */
  const saveDay = async (dayEntry: DayEntry) => {
    const dateStr = format(dayEntry.date, "yyyy-MM-dd");
    setLoading(dateStr);
    setError("");
    setSuccess("");

    // Check if at least one time is filled
    if (!dayEntry.startTime && !dayEntry.endTime) {
      setError("Please enter at least a start time or end time");
      setLoading(null);
      return;
    }

    // If both times are provided, validate end time is after start time
    if (dayEntry.startTime && dayEntry.endTime) {
      const start = new Date(`2000-01-01T${dayEntry.startTime}:00`);
      const end = new Date(`2000-01-01T${dayEntry.endTime}:00`);

      if (end <= start) {
        setError("End time must be after start time");
        setLoading(null);
        return;
      }
    }

    try {
      const response = await fetch("/api/client/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          workDate: dateStr,
          startTime: dayEntry.startTime ? dayEntry.startTime + ":00" : null,
          endTime: dayEntry.endTime ? dayEntry.endTime + ":00" : null,
        }),
      });

      const json: unknown = await response.json();

      const hasErrorMessage = (value: unknown): value is { error: string } => {
        if (typeof value !== "object" || value === null) return false;
        const record = value as Record<string, unknown>;
        return typeof record.error === "string";
      };

      if (!response.ok) {
        const errMsg = hasErrorMessage(json)
          ? json.error
          : "Failed to save timesheet";
        setError(errMsg);
        return;
      }

      setSuccess("Saved");
      setLastSavedDate(dateStr);
      setTimeout(() => setSuccess(""), 2000);
      setTimeout(() => setLastSavedDate(null), 3500);
      void fetchTimesheets();
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(null);
    }
  };

  /**
   * Delete timesheet entry for a day (e.g. wrong day entered)
   */
  const deleteDayEntry = async (dateStr: string) => {
    setDeletingDate(dateStr);
    setError("");
    try {
      const response = await fetch("/api/client/timesheets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, workDate: dateStr }),
      });
      const json: unknown = await response.json();
      const hasError = (v: unknown): v is { error: string } =>
        typeof v === "object" &&
        v !== null &&
        "error" in v &&
        typeof (v as Record<string, unknown>).error === "string";
      if (!response.ok) {
        setError(hasError(json) ? json.error : "Failed to remove entry");
        return;
      }
      setSuccess("Entry removed");
      setTimeout(() => setSuccess(""), 2000);
      void fetchTimesheets();
    } catch {
      setError("Failed to remove entry");
    } finally {
      setDeletingDate(null);
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      // Clear session cookie
      await fetch("/api/client/auth/employee", { method: "DELETE" });
      router.push("/client");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  /**
   * Calculate total hours for current week
   */
  const { weekStart, weekEnd } = getWeekDates(currentWeek);
  const weeklyHours = timesheets
    .filter((ts) => {
      const tsDate = new Date(ts.work_date);
      return tsDate >= weekStart && tsDate <= weekEnd;
    })
    .reduce((sum, ts) => sum + parseFloat(ts.total_hours.toString()), 0);

  return (
    <>
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

      <main className="mx-auto grid max-w-[560px] gap-4 px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Your timesheet
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enter your hours for the week
          </p>
        </div>

        {/* Week Navigation */}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigateWeek("prev")}
            aria-label="Previous week"
          >
            <ChevronLeft strokeWidth={1.5} />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <h2 className="text-center text-base font-semibold">
            {format(weekStart, "d MMM")} – {format(weekEnd, "d MMM yyyy")}
          </h2>
          <Button
            variant="outline"
            onClick={() => navigateWeek("next")}
            aria-label="Next week"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight strokeWidth={1.5} />
          </Button>
        </div>

        {/* Total Hours */}
        <div className="border-border bg-card flex items-baseline justify-between gap-3 rounded-lg border px-4 py-3.5">
          <span className="text-muted-foreground font-mono text-[11px] tracking-[0.1em] uppercase">
            Total this week
          </span>
          <span className="text-primary text-3xl font-semibold tracking-tight tabular-nums">
            {formatHoursAndMinutes(weeklyHours)}
          </span>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <p role="status" className="text-ok text-sm">
            {success}
          </p>
        )}
        {error && (
          <p role="alert" className="text-warn text-sm">
            {error}
          </p>
        )}

        {/* Days List */}
        {weekDays.map((day, index) => {
          const dateStr = format(day.date, "yyyy-MM-dd");
          const isLoading = loading === dateStr;
          const isDeleting = deletingDate === dateStr;
          const isTodayDay = isToday(day.date);
          const justSaved = lastSavedDate === dateStr;
          const hasSavedEntry = timesheets.some(
            (ts) => format(new Date(ts.work_date), "yyyy-MM-dd") === dateStr,
          );
          const weekday = day.date.getDay();

          return (
            <section
              key={dateStr}
              aria-label={`${day.dayName} ${format(day.date, "d MMMM")}`}
              className={cn(
                "bg-card grid gap-3.5 rounded-lg border p-4 transition-colors",
                justSaved
                  ? "border-ok"
                  : isTodayDay
                    ? "border-primary"
                    : "border-border",
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3
                  className={cn(
                    "text-[17px] font-semibold tracking-tight",
                    weekday === 6 && "text-sat",
                    weekday === 0 && "text-sun",
                  )}
                >
                  {day.dayName}
                  <span className="text-muted-foreground ml-2 font-mono text-xs font-normal">
                    {format(day.date, "d MMMM")}
                  </span>
                </h3>
                {isTodayDay && (
                  <span className="text-primary bg-primary/10 rounded-lg px-1.5 py-0.5 font-mono text-[11px]">
                    Today
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="grid min-w-0 gap-1">
                  <span className="text-muted-foreground text-[13px]">
                    Start time
                  </span>
                  <TimePicker
                    value={day.startTime}
                    onChange={(value: string) =>
                      updateDayTime(index, "startTime", value)
                    }
                    placeholder="--:-- --"
                  />
                </div>
                <div className="grid min-w-0 gap-1">
                  <span className="text-muted-foreground text-[13px]">
                    End time
                  </span>
                  <TimePicker
                    value={day.endTime}
                    onChange={(value: string) =>
                      updateDayTime(index, "endTime", value)
                    }
                    placeholder="--:-- --"
                  />
                </div>
              </div>

              {/* Save + remove */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => saveDay(day)}
                  disabled={isLoading || (!day.startTime && !day.endTime)}
                  variant={justSaved ? "outline" : "default"}
                  className={cn(
                    justSaved && "border-ok text-ok hover:border-ok",
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" strokeWidth={1.5} />
                      Saving…
                    </>
                  ) : justSaved ? (
                    "Saved ✓"
                  ) : (
                    "Save"
                  )}
                </Button>
                {hasSavedEntry && (
                  <button
                    type="button"
                    onClick={() => deleteDayEntry(dateStr)}
                    disabled={isDeleting || isLoading}
                    className="text-warn inline-block py-2 text-sm transition-colors hover:underline disabled:opacity-40"
                  >
                    {isDeleting ? "Removing…" : "Remove entry"}
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
