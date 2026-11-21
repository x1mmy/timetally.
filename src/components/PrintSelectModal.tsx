"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "~/lib/utils";
import {
  printWeekSummary,
  printDayBreakdown,
  printClockTimesReport,
} from "@/lib/csvExport";
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

async function getDayType(dateString: string): Promise<DayType> {
  if (await isPublicHoliday(dateString)) return "public_holiday";
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
  const [selected, setSelected] = useState<
    "week-summary" | "day-breakdown" | "clock-times" | null
  >(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(
    new Map(
      employees
        .filter((e) => e.category != null)
        .map(
          (e) =>
            [e.category!.id, e.category!] as [
              string,
              { id: string; name: string },
            ],
        ),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filteredEmployees =
    selectedCategory === null
      ? employees
      : employees.filter((e) => e.category_id === selectedCategory);

  const handlePrint = async () => {
    if (!selected) return;

    if (selected === "week-summary") {
      const empData = (
        await Promise.all(
          filteredEmployees.map(async (emp) => {
            const empTs = timesheets.filter(
              (ts) => ts.employee_id === emp.id,
            );
            let weekdayHours = 0,
              saturdayHours = 0,
              sundayHours = 0;
            const workedDates = new Set<string>();
            for (const ts of empTs) {
              const type = await getDayType(ts.work_date);
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
          }),
        )
      ).filter((e) => e.totalHours > 0);

      printWeekSummary({ employees: empData, weekEndingDate: weekEnd });
    } else if (selected === "day-breakdown") {
      const empData = filteredEmployees
        .map((emp) => {
          const empTs = timesheets.filter((ts) => ts.employee_id === emp.id);
          const dailyHours: Record<string, number> = {};
          for (const ts of empTs) {
            const iso = format(new Date(ts.work_date), "yyyy-MM-dd");
            dailyHours[iso] =
              (dailyHours[iso] ?? 0) + parseFloat(ts.total_hours.toString());
          }
          return {
            firstName: emp.first_name,
            lastName: emp.last_name,
            dailyHours,
          };
        })
        .filter((e) => Object.keys(e.dailyHours).length > 0);

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

      printClockTimesReport({
        entries,
        startDate: weekStart,
        endDate: weekEnd,
      });
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="gap-5 sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>Select print format</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a layout and category, then print
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {(["week-summary", "day-breakdown", "clock-times"] as const).map(
            (opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSelected(opt)}
                aria-pressed={selected === opt}
                className={cn(
                  "focus-visible:ring-ring grid w-full gap-0.5 rounded-lg border p-3.5 text-left transition-colors outline-none focus-visible:ring-2",
                  selected === opt
                    ? "border-primary bg-secondary"
                    : "border-border bg-card hover:border-primary",
                )}
              >
                <span className="font-medium">
                  {opt === "week-summary"
                    ? "Week summary"
                    : opt === "day-breakdown"
                      ? "Day breakdown"
                      : "Clock times"}
                </span>
                <span className="text-muted-foreground text-[13px]">
                  {opt === "week-summary"
                    ? "One row per employee, weekly hour totals"
                    : opt === "day-breakdown"
                      ? "One row per employee, hours per day across the week"
                      : "One row per shift, exact clock-in and clock-out times"}
                </span>
              </button>
            ),
          )}
        </div>

        {categories.length > 0 && (
          <div className="grid gap-2">
            <p className="text-muted-foreground text-[13px]">
              Filter by category
            </p>
            <div className="flex flex-wrap gap-0.5">
              {[{ id: null, name: "All" }, ...categories].map((cat) => (
                <button
                  key={cat.id ?? "all"}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  aria-pressed={selectedCategory === cat.id}
                  className={cn(
                    "focus-visible:ring-ring min-h-10 rounded-lg border px-2.5 text-[13px] transition-colors outline-none focus-visible:ring-2",
                    selectedCategory === cat.id
                      ? "border-input bg-card text-foreground"
                      : "text-muted-foreground hover:text-foreground border-transparent",
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void handlePrint()} disabled={!selected}>
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
