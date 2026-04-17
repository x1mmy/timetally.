"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printWeekSummary, printDayBreakdown } from "@/lib/csvExport";
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
  const [selected, setSelected] = useState<"week-summary" | "day-breakdown" | null>(null);

  const handlePrint = () => {
    if (!selected) return;

    if (selected === "week-summary") {
      const empData = employees.map((emp) => {
        const empTs = timesheets.filter((ts) => ts.employee_id === emp.id);
        let weekdayHours = 0, saturdayHours = 0, sundayHours = 0;
        for (const ts of empTs) {
          const type = getDayType(ts.work_date);
          const h = parseFloat(ts.total_hours.toString());
          if (type === "saturday") saturdayHours += h;
          else if (type === "sunday") sundayHours += h;
          else weekdayHours += h;
        }
        return {
          firstName: emp.first_name,
          lastName: emp.last_name,
          weekdayHours,
          saturdayHours,
          sundayHours,
          totalHours: weekdayHours + saturdayHours + sundayHours,
        };
      }).filter((e) => e.totalHours > 0);

      printWeekSummary({ employees: empData, weekEndingDate: weekEnd });
    } else {
      const empData = employees.map((emp) => {
        const empTs = timesheets.filter((ts) => ts.employee_id === emp.id);
        const dailyHours: Record<string, number> = {};
        for (const ts of empTs) {
          const iso = format(new Date(ts.work_date), "yyyy-MM-dd");
          dailyHours[iso] = (dailyHours[iso] ?? 0) + parseFloat(ts.total_hours.toString());
        }
        return { firstName: emp.first_name, lastName: emp.last_name, dailyHours };
      }).filter((e) => Object.keys(e.dailyHours).length > 0);

      printDayBreakdown({ employees: empData, weekStart, weekEnd });
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative z-10 w-full max-w-sm rounded-2xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Select Print Format</h2>
              <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {(["week-summary", "day-breakdown"] as const).map((opt) => (
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
                      {opt === "week-summary" ? "Week Summary" : "Day Breakdown"}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {opt === "week-summary"
                        ? "One row per employee — weekly hour totals"
                        : "One row per employee — hours per day across the week"}
                    </p>
                  </div>
                </button>
              ))}
            </div>

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
