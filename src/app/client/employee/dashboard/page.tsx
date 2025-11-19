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
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import {
  format,
  addWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { useRouter } from "next/navigation";
import type { Timesheet } from "@/types/database";
import { formatHoursAndMinutes } from "@/lib/timeUtils";

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
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome,{" "}
                <span className="text-primary underline">{employeeName}</span>
              </h1>
              <p className="mt-1 text-neutral-400">
                Enter your hours for the week
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2 transition-colors hover:bg-neutral-800"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-6 py-8">
        {/* Week Navigation */}
        <div className="mb-6 rounded-2xl bg-neutral-900 p-6 shadow-xl ring-1 shadow-blue-500/50 ring-blue-500/40">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => navigateWeek("prev")}
              className="flex items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 transition-colors hover:bg-neutral-700"
            >
              <ChevronLeft className="h-5 w-5" />
              Previous Week
            </button>

            <div className="text-center">
              <h2 className="text-xl font-semibold">
                {format(weekStart, "d MMM")} - {format(weekEnd, "d MMM yyyy")}
              </h2>
            </div>

            <button
              onClick={() => navigateWeek("next")}
              className="flex items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 transition-colors hover:bg-neutral-700"
            >
              Next Week
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Total Hours */}
          <div className="flex justify-center">
            <div className="bg-primary rounded-full px-6 py-3">
              <p className="text-lg font-semibold">
                Total: {formatHoursAndMinutes(weeklyHours)}
              </p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-500">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Days List */}
        <div className="space-y-4">
          {weekDays.map((day, index) => {
            const dateStr = format(day.date, "yyyy-MM-dd");
            const isLoading = loading === dateStr;

            return (
              <div
                key={dateStr}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-6"
              >
                <div className="flex items-start gap-6">
                  {/* Day Number */}
                  <div className="flex min-w-[60px] flex-col items-center justify-center rounded-lg bg-neutral-800 px-4 py-2">
                    <div className="text-3xl font-bold">{day.dayNumber}</div>
                  </div>

                  {/* Day Info and Times */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold">{day.dayName}</h3>
                      <p className="text-sm text-neutral-400">
                        {day.dayName.slice(0, 3)}, {day.dayNumber}{" "}
                        {day.monthName}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Start Time */}
                      <div>
                        <label className="mb-2 block text-sm font-medium">
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
                        <label className="mb-2 block text-sm font-medium">
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
                      <Button
                        onClick={() => saveDay(day)}
                        disabled={isLoading || (!day.startTime && !day.endTime)}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isLoading ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
