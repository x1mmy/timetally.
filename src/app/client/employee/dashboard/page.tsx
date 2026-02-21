/**
 * Employee Dashboard Page
 * Weekly timesheet entry with start/end time per day
 * Features:
 * - Weekly view with all days
 * - Save start time first, end time later
 * - Week navigation
 * - Logout functionality
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { TimePicker } from "@/components/TimePicker";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LogOut, Clock, CheckCircle2, Calendar } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";

interface DayEntry {
  date: Date;
  dayName: string;
  dayNumber: number;
  monthName: string;
  startTime: string;
  endTime: string;
}

export default function EmployeeDashboardPage() {
  const router = useRouter();

  // Employee info
  const [employeeName, setEmployeeName] = useState("Employee");
  const [employeeId, setEmployeeId] = useState("");

  // Week navigation
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = current week, -1 = last week, 1 = next week

  // Week days with entries
  const [weekDays, setWeekDays] = useState<DayEntry[]>([]);

  // UI state
  const [loading, setLoading] = useState<string | null>(null); // stores the date being saved
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Past timesheets
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);

  /**
   * Get week start and end dates
   */
  const getWeekDates = useCallback((weekOffset: number) => {
    const today = new Date();
    const weekStart = startOfWeek(addWeeks(today, weekOffset), {
      weekStartsOn: 1,
    }); // Monday
    const weekEnd = endOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 }); // Sunday
    return { weekStart, weekEnd };
  }, []);

  /**
   * Initialize week days
   */
  const initializeWeekDays = useCallback(
    (weekOffset: number, existingTimesheets: Timesheet[]) => {
      const { weekStart, weekEnd } = getWeekDates(weekOffset);
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

      const weekEntries: DayEntry[] = days.map((date) => {
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

      setWeekDays(weekEntries);
    },
    [getWeekDates],
  );

  /**
   * Fetch employee's timesheets
   */
  const fetchTimesheets = useCallback(async () => {
    try {
      if (!employeeId) return;

      const response = await fetch(
        `/api/client/timesheets?employeeId=${employeeId}`,
      );
      const json: unknown = await response.json();

      if (response.ok && typeof json === "object" && json !== null) {
        const { timesheets: fetchedTimesheets } = json as {
          timesheets?: Timesheet[];
        };
        setTimesheets(fetchedTimesheets ?? []);
        initializeWeekDays(currentWeek, fetchedTimesheets ?? []);
      }
    } catch (error) {
      console.error("Error fetching timesheets:", error);
    }
  }, [employeeId, currentWeek, initializeWeekDays]);

  useEffect(() => {
    // Load current employee from session cookie
    const loadEmployee = async () => {
      try {
        const response = await fetch("/api/client/auth/employee/me");
        const json: unknown = await response.json();
        if (response.ok && typeof json === "object" && json !== null) {
          const { employee } = json as {
            employee?: { id: string; firstName?: string; lastName?: string };
          };
          if (!employee) return;
          const fullName =
            `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim();
          setEmployeeName(fullName || "Employee");
          setEmployeeId(employee.id);
        }
      } catch (err) {
        console.error("Failed to load employee:", err);
      }
    };
    void loadEmployee();
  }, []);

  // When employeeId changes, fetch timesheets
  useEffect(() => {
    if (!employeeId) return;
    void fetchTimesheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  /**
   * Handle week navigation
   */
  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = direction === "prev" ? currentWeek - 1 : currentWeek + 1;
    setCurrentWeek(newWeek);
    initializeWeekDays(newWeek, timesheets);
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

      setSuccess("Time saved successfully!");
      setTimeout(() => setSuccess(""), 2000);
      void fetchTimesheets();
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(null);
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
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Animated Background - Mobile Optimized */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-20 h-64 w-64 animate-pulse rounded-full bg-blue-500/5 blur-3xl md:h-80 md:w-80" />
        <div className="absolute bottom-20 right-0 h-64 w-64 animate-pulse rounded-full bg-blue-400/5 blur-3xl md:h-80 md:w-80" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-lg"
      >
        <div className="container mx-auto px-4 py-4 md:px-6 md:py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold md:text-3xl">
                Welcome,{" "}
                <span className="text-primary">{employeeName}</span>
              </h1>
              <p className="mt-1 text-sm text-neutral-400 md:text-base">
                Enter your hours for the week
              </p>
            </motion.div>

            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-neutral-800 md:px-4"
              >
                <LogOut className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container relative mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
        {/* Week Navigation */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="mb-6 overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-neutral-900/90 to-neutral-900/50 p-4 shadow-2xl shadow-blue-500/10 backdrop-blur-sm md:p-6"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateWeek("prev")}
              className="flex items-center gap-1 rounded-xl bg-neutral-800/80 px-3 py-2 text-sm backdrop-blur-sm transition-all hover:bg-neutral-700 active:scale-95 md:gap-2 md:px-4 md:text-base"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden md:inline">Previous</span>
            </motion.button>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-neutral-400">
                <Calendar className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold md:text-xl">
                {format(weekStart, "d MMM")} - {format(weekEnd, "d MMM yyyy")}
              </h2>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateWeek("next")}
              className="flex items-center gap-1 rounded-xl bg-neutral-800/80 px-3 py-2 text-sm backdrop-blur-sm transition-all hover:bg-neutral-700 active:scale-95 md:gap-2 md:px-4 md:text-base"
            >
              <span className="hidden md:inline">Next</span>
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </motion.button>
          </div>

          {/* Total Hours */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center"
          >
            <div className="relative overflow-hidden rounded-full bg-gradient-to-r from-primary to-blue-500 px-6 py-3 shadow-lg shadow-primary/30 md:px-8 md:py-4">
              <div className="absolute inset-0 animate-pulse bg-white/10" />
              <div className="relative flex items-center gap-2">
                <Clock className="h-5 w-5 md:h-6 md:w-6" />
                <p className="text-base font-bold md:text-lg">
                  Total: {formatHoursAndMinutes(weeklyHours)}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-4 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400 backdrop-blur-sm"
            >
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Days List */}
        <div className="space-y-3 md:space-y-4">
          {weekDays.map((day, index) => {
            const dateStr = format(day.date, "yyyy-MM-dd");
            const isLoading = loading === dateStr;
            const hasTime = day.startTime || day.endTime;
            const isTodayDay = isToday(day.date);

            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.01 }}
                className={`group rounded-xl border p-4 backdrop-blur-sm transition-all md:p-6 ${
                  isTodayDay
                    ? "border-primary/50 bg-linear-to-br from-neutral-900/90 to-neutral-900/50 shadow-md shadow-primary/10"
                    : "border-neutral-800 bg-linear-to-br from-neutral-900/90 to-neutral-900/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                }`}
              >
                <div className="flex items-start gap-3 md:gap-6">
                  {/* Day Number Badge */}
                  <motion.div
                    whileHover={{ rotate: 5 }}
                    className={`flex min-w-[60px] flex-col items-center justify-center rounded-xl px-3 py-2 shadow-lg transition-all md:min-w-[70px] md:px-4 ${
                      hasTime
                        ? "bg-linear-to-br from-primary to-blue-500 text-white shadow-primary/30"
                        : isTodayDay
                          ? "bg-neutral-700/80 text-white ring-2 ring-primary/60"
                          : "bg-neutral-800/80 text-neutral-400"
                    }`}
                  >
                    <div className="text-2xl font-bold md:text-3xl">
                      {day.dayNumber}
                    </div>
                    <div className="text-xs uppercase tracking-wide opacity-80">
                      {day.monthName}
                    </div>
                  </motion.div>

                  {/* Day Info and Times */}
                  <div className="flex-1">
                    <div className="mb-3 md:mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold md:text-xl">
                          {day.dayName}
                        </h3>
                        {isTodayDay && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white shadow-sm shadow-primary/50">
                            Today
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 md:text-sm">
                        {format(day.date, "EEEE, MMMM d")}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                      {/* Start Time */}
                      <div>
                        <label className="mb-2 block text-xs font-medium text-neutral-400 md:text-sm">
                          Start Time
                        </label>
                        <TimePicker
                          value={day.startTime}
                          onChange={(value: string) =>
                            updateDayTime(index, "startTime", value)
                          }
                          placeholder="--:-- --"
                        />
                      </div>

                      {/* End Time */}
                      <div>
                        <label className="mb-2 block text-xs font-medium text-neutral-400 md:text-sm">
                          End Time
                        </label>
                        <TimePicker
                          value={day.endTime}
                          onChange={(value: string) =>
                            updateDayTime(index, "endTime", value)
                          }
                          placeholder="--:-- --"
                        />
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="mt-4">
                      <motion.div whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={() => saveDay(day)}
                          disabled={isLoading || (!day.startTime && !day.endTime)}
                          className="w-full rounded-xl bg-gradient-to-r from-primary to-blue-500 py-6 text-base font-semibold shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 disabled:opacity-50 md:text-lg"
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                              >
                                <Clock className="h-5 w-5" />
                              </motion.div>
                              Saving...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <CheckCircle2 className="h-5 w-5" />
                              Save
                            </span>
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
