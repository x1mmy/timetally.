"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printWeekSummary, printDayBreakdown, printClockTimesReport } from "@/lib/csvExport";
import type { ClockTimesEntry } from "@/lib/csvExport";
import type { Employee, TimesheetWithEmployee } from "@/types/database";
import { format, getDay } from "date-fns";
import { isPublicHoliday } from "@/lib/holidays";

interface PrintSelectModalProps {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
  timesheets: TimesheetWithEmployee[];
  weekStart: Date;
  weekEnd: Date;
}

type DayType = "weekday" | "saturday" | "sunday" | "public_holiday";

function getDayType(dateString: string): DayType {
  if (isPublicHoliday(dateString)) return "public_holiday";
  const d = getDay(new Date(dateString));
  if (d === 0) return "sunday";
  if (d === 6) return "saturday";
  return "weekday";
}

export function PrintSelectModal({
  open,
  onClose,
  employees,
  timesheets,
  weekStart,
  weekEnd,
}: PrintSelectModalProps) {
  const [selected, setSelected] = useState<"week-summary" | "day-breakdown" | "clock-times" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(
    new Map(
      employees
        .filter((e) => e.category != null)
        .map((e) => [e.category!.id, e.category!] as [string, { id: string; name: string }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filteredEmployees =
    selectedCategory === null
      ? employees
      : employees.filter((e) => e.category_id === selectedCategory);

  const handlePrint = () => {
    if (!selected) return;

    if (selected === "week-summary") {
      const empData = filteredEmployees.map((emp) => {
        const empTs = timesheets.filter((ts) => ts.employee_id === emp.id);
        let weekdayHours = 0, saturdayHours = 0, sundayHours = 0;
        const workedDates = new Set<string>();
        for (const ts of empTs) {
          const type = getDayType(ts.work_date);
          const h = parseFloat(ts.total_hours.toString());
          if (type === "saturday") saturdayHours += h;
          else if (type === "sunday") sundayHours += h;
          else weekdayHours += h;
          if (ts.end_time) workedDates.add(ts.work_date);
        }
        return {
          firstName: emp.first_name,
          lastName: emp.last_name,
          weekdayHours,
          saturdayHours,
          sundayHours,
          totalHours: weekdayHours + saturdayHours + sundayHours,
          daysWorked: workedDates.size,
        };
      }).filter((e) => e.totalHours > 0);

      printWeekSummary({ employees: empData, weekEndingDate: weekEnd });
    } else if (selected === "day-breakdown") {
      const empData = filteredEmployees.map((emp) => {
        const empTs = timesheets.filter((ts) => ts.employee_id === emp.id);
        const dailyHours: Record<string, number> = {};
        for (const ts of empTs) {
          const iso = format(new Date(ts.work_date), "yyyy-MM-dd");
          dailyHours[iso] = (dailyHours[iso] ?? 0) + parseFloat(ts.total_hours.toString());
        }
        return { firstName: emp.first_name, lastName: emp.last_name, dailyHours };
      }).filter((e) => Object.keys(e.dailyHours).length > 0);

      printDayBreakdown({ employees: empData, weekStart, weekEnd });
    } else {
      const empById = new Map(filteredEmployees.map((e) => [e.id, e]));
      const entries: ClockTimesEntry[] = timesheets
        .filter((ts) => empById.has(ts.employee_id))
        .map((ts) => {
          const emp = empById.get(ts.employee_id)!;
          return {
            date: format(new Date(ts.work_date), "yyyy-MM-dd"),
            firstName: emp.first_name,
            lastName: emp.last_name,
            categoryName: emp.category?.name ?? "",
            startTime: ts.original_start_time ?? ts.start_time,
            endTime: ts.original_end_time ?? ts.end_time ?? null,
            totalHours: parseFloat(ts.total_hours.toString()),
          };
        });

      printClockTimesReport({ entries, startDate: weekStart, endDate: weekEnd });
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative z-10 w-full max-w-sm rounded-2xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Select Print Format</h2>
              <button onClick={onClose} aria-label="Close modal" className="rounded-lg p-1 text-neutral-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {(["week-summary", "day-breakdown", "clock-times"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelected(opt)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                    selected === opt
                      ? "border-primary bg-primary/10 text-white"
                      : "border-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">
                      {opt === "week-summary" ? "Week Summary" : opt === "day-breakdown" ? "Day Breakdown" : "Clock Times"}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {opt === "week-summary"
                        ? "One row per employee — weekly hour totals"
                        : opt === "day-breakdown"
                          ? "One row per employee — hours per day across the week"
                          : "One row per shift — exact clock-in and clock-out times"}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {categories.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-neutral-300">Filter by category</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
                      selectedCategory === null
                        ? "border-primary bg-primary/10 text-white"
                        : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
                        selectedCategory === cat.id
                          ? "border-primary bg-primary/10 text-white"
                          : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handlePrint}
              disabled={!selected}
              className="mt-6 w-full bg-gradient-to-r from-primary to-blue-500 disabled:opacity-40"
            >
              Print
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
