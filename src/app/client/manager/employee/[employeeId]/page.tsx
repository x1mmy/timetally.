/**
 * Individual Employee Breakdown Page
 * Shows detailed shift breakdown for a single employee
 */
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  startOfWeek,
  endOfWeek,
  format,
  getDay,
  addDays,
  differenceInDays,
  parseISO,
} from "date-fns";
import type { Employee, TimesheetWithEmployee } from "@/types/database";
import { formatHoursAndMinutes } from "@/lib/timeUtils";
import { rateForDate } from "~/lib/payrollRates";
import { EditTimesheetDialog } from "./components/EditTimesheetDialog";
import { isPublicHoliday, getHolidayName } from "@/lib/holidays";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatAUD } from "@/lib/format";
import { cn } from "~/lib/utils";

interface DailyBreakdown {
  date: string;
  dayName: string;
  startTime: string | null;
  endTime: string | null;
  rawHours: number;
  breakMinutes: number;
  totalHours: number;
  pay: number;
  timesheetId: string | null;
  isHoliday: boolean;
  holidayName: string | null;
}

function EmployeeDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const employeeId = params.employeeId as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [dailyBreakdown, setDailyBreakdown] = useState<DailyBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState<DailyBreakdown | null>(null);

  // Get date range and view mode from URL params or default to current week
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const viewModeParam = searchParams.get("viewMode") as
    | "week"
    | "custom"
    | null;

  const currentWeekStart = startDateParam
    ? new Date(startDateParam)
    : startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endDateParam
    ? new Date(endDateParam)
    : endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  /**
   * Load employee and timesheet data
   */
  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch employee details
      const empResponse = await fetch("/api/client/employees");
      const empData = (await empResponse.json()) as { employees?: Employee[] };
      const emp = empData.employees?.find((e) => e.id === employeeId);

      if (!emp) {
        router.push("/client/manager/dashboard");
        return;
      }

      setEmployee(emp);

      // Fetch timesheets for this week
      const startDate = format(currentWeekStart, "yyyy-MM-dd");
      const endDate = format(weekEnd, "yyyy-MM-dd");

      const tsResponse = await fetch(
        `/api/client/timesheets?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`,
      );
      const tsData = (await tsResponse.json()) as {
        timesheets?: TimesheetWithEmployee[];
      };
      const sheets = tsData.timesheets ?? [];

      // Create daily breakdown for the date range
      const breakdown: DailyBreakdown[] = [];
      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const totalDays = differenceInDays(weekEnd, currentWeekStart) + 1;

      for (let i = 0; i < totalDays; i++) {
        const date = addDays(currentWeekStart, i);
        const dateString = format(date, "yyyy-MM-dd");
        const dayOfWeek = getDay(date);
        const dayName = daysOfWeek[dayOfWeek] ?? "";

        const timesheet = sheets.find((ts) => ts.work_date === dateString);
        const [dayIsHoliday, dayHolidayName] = await Promise.all([
          isPublicHoliday(dateString),
          getHolidayName(dateString),
        ]);

        if (timesheet?.start_time && timesheet?.end_time) {
          const rawHours =
            (new Date(`2000-01-01T${timesheet.end_time}`).getTime() -
              new Date(`2000-01-01T${timesheet.start_time}`).getTime()) /
            (1000 * 60 * 60);

          const totalHours = parseFloat(timesheet.total_hours.toString());
          const breakMinutes = timesheet.break_minutes ?? 0;
          const rate = await rateForDate(dateString, emp);

          // For day_rate employees, pay is the rate (1 day = 1 rate)
          // For hourly employees, pay is hours * rate
          const pay = emp.pay_type === "day_rate" ? rate : totalHours * rate;

          breakdown.push({
            date: dateString,
            dayName,
            startTime: timesheet.start_time,
            endTime: timesheet.end_time,
            rawHours,
            breakMinutes,
            totalHours,
            pay,
            timesheetId: timesheet.id,
            isHoliday: dayIsHoliday,
            holidayName: dayHolidayName,
          });
        } else {
          breakdown.push({
            date: dateString,
            dayName,
            startTime: null,
            endTime: null,
            rawHours: 0,
            breakMinutes: 0,
            totalHours: 0,
            pay: 0,
            timesheetId: null,
            isHoliday: dayIsHoliday,
            holidayName: dayHolidayName,
          });
        }
      }

      setDailyBreakdown(breakdown);
    } catch (error) {
      console.error("Error loading employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, startDateParam, endDateParam, viewModeParam]);

  /**
   * Handle logout (same as the payroll dashboard's)
   */
  const handleLogout = () => {
    document.cookie = "manager_session=; Max-Age=0; path=/";
    router.push("/client");
  };

  const header = (
    <header className="bg-card border-border border-b">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Logo />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/client/manager/timesheet-activity")}
          >
            <span className="hidden sm:inline">Timesheet activity</span>
            <span className="sm:hidden">Activity</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/client/manager/settings")}
          >
            Settings
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Log out
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );

  if (loading || !employee) {
    return (
      <>
        {header}
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
          <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
          Loading…
        </div>
      </>
    );
  }

  const totalPay = dailyBreakdown.reduce((sum, day) => sum + day.pay, 0);
  const totalHours = dailyBreakdown.reduce(
    (sum, day) => sum + day.totalHours,
    0,
  );
  const totalBreakMinutes = dailyBreakdown.reduce(
    (sum, day) => sum + day.breakMinutes,
    0,
  );
  const daysWorked = dailyBreakdown.filter(
    (day) => day.endTime !== null,
  ).length;

  // Function to navigate back with URL params
  const handleBackToDashboard = () => {
    const params = new URLSearchParams({
      viewMode: viewModeParam ?? "week",
      startDate: format(currentWeekStart, "yyyy-MM-dd"),
      endDate: format(weekEnd, "yyyy-MM-dd"),
    });
    router.push(`/client/manager/dashboard?${params.toString()}`);
  };

  const perUnit = employee.pay_type === "day_rate" ? "Per day" : "Per hour";
  const fmtTime = (t: string) =>
    format(new Date(`2000-01-01T${t}`), "h:mm aaa");
  const dash = <span className="text-muted-foreground">—</span>;
  const tint = (day: DailyBreakdown) =>
    day.dayName === "Sat"
      ? "bg-sat/[0.06]"
      : day.dayName === "Sun"
        ? "bg-sun/[0.06]"
        : "";
  const dayTitle = (day: DailyBreakdown) => (
    <>
      <span
        className={cn(
          "text-[15px] font-medium",
          day.dayName === "Sat" && "text-sat",
          day.dayName === "Sun" && "text-sun",
        )}
      >
        {format(parseISO(day.date), "EEEE")}
      </span>
      <span className={sub}>
        {format(parseISO(day.date), "d MMM yyyy")}
        {day.holidayName && (
          <span className="text-ph"> · {day.holidayName}</span>
        )}
      </span>
    </>
  );
  const editButton = (day: DailyBreakdown, hasHours: boolean) => (
    <button
      type="button"
      onClick={() => setEditingDay(day)}
      className="text-primary focus-visible:ring-ring inline-block rounded-sm py-2 text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2"
    >
      {hasHours ? "Edit" : "Add hours"}
    </button>
  );

  return (
    <>
      {header}

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <button
            type="button"
            onClick={handleBackToDashboard}
            className="text-muted-foreground hover:text-primary focus-visible:ring-ring inline-block rounded-sm py-2 text-sm transition-colors outline-none focus-visible:ring-2"
          >
            ‹ Back to payroll
          </button>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {employee.first_name} {employee.last_name}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {format(currentWeekStart, "d MMM")} –{" "}
            {format(weekEnd, "d MMM yyyy")} ·{" "}
            {employee.category?.name ?? "Uncategorised"}
          </p>
        </div>

        {/* Rates and total pay */}
        <div className="bg-card border-border grid grid-cols-2 rounded-lg border lg:grid-cols-4">
          {(
            [
              ["Weekday rate", "text-wk", employee.weekday_rate],
              ["Saturday rate", "text-sat", employee.saturday_rate],
              ["Sunday rate", "text-sun", employee.sunday_rate],
            ] as const
          ).map(([label, color, rate], i) => (
            <div
              key={label}
              className={cn(
                "border-border min-w-0 p-4",
                i > 0 && "border-l",
                i === 2 && "border-t border-l-0 lg:border-t-0 lg:border-l",
              )}
            >
              <p className={cn(micro, color)}>{label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {formatAUD(rate)}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[12.5px]">
                {perUnit}
              </p>
            </div>
          ))}
          <div className="border-border min-w-0 border-t border-l p-4 lg:border-t-0">
            <p className={micro}>Total pay</p>
            <p className="text-primary mt-1 text-3xl font-semibold tracking-tight tabular-nums">
              {formatAUD(totalPay)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[12.5px]">
              {formatHoursAndMinutes(totalHours)} paid
            </p>
          </div>
        </div>

        {/* sm and up: one table of the days */}
        <div className="bg-card border-border hidden overflow-x-auto rounded-lg border sm:block">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-border border-b">
                <th className={th}>Day</th>
                <th className={th}>Shift</th>
                <th className={cn(th, "text-right")}>Hours</th>
                <th className={cn(th, "text-right")}>Break</th>
                <th className={cn(th, "text-right")}>Paid hours</th>
                <th className={cn(th, "text-right")}>Pay</th>
                <th className={cn(th, "text-right")}>
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {dailyBreakdown.map((day) => {
                const hasHours = !!(day.startTime && day.endTime);
                return (
                  <tr key={day.date} className={tint(day)}>
                    <td className={cn(td, "font-sans whitespace-nowrap")}>
                      {dayTitle(day)}
                    </td>
                    <td className={cn(td, "whitespace-nowrap")}>
                      {hasHours ? (
                        `${fmtTime(day.startTime!)} – ${fmtTime(day.endTime!)}`
                      ) : (
                        <span className="text-muted-foreground font-sans text-sm">
                          No hours logged
                        </span>
                      )}
                    </td>
                    <td className={cn(td, "text-right")}>
                      {hasHours ? formatHoursAndMinutes(day.rawHours) : dash}
                    </td>
                    <td className={cn(td, "text-right")}>
                      {hasHours ? `${day.breakMinutes} min` : dash}
                    </td>
                    <td className={cn(td, "text-right")}>
                      {hasHours ? formatHoursAndMinutes(day.totalHours) : dash}
                    </td>
                    <td className={cn(td, "text-right")}>
                      {hasHours ? (
                        <>
                          {formatAUD(day.pay)}
                          {day.isHoliday && (
                            <span className={cn(sub, "text-ph")}>PH rate</span>
                          )}
                        </>
                      ) : (
                        dash
                      )}
                    </td>
                    <td className={cn(td, "py-1 text-right")}>
                      {editButton(day, hasHours)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Below sm: the same days as stacked cards */}
        <div className="bg-card border-border divide-border divide-y rounded-lg border sm:hidden">
          {dailyBreakdown.map((day) => {
            const hasHours = !!(day.startTime && day.endTime);
            return (
              <div
                key={day.date}
                className={cn(
                  "grid grid-cols-3 gap-x-3 gap-y-2.5 px-4 py-3.5",
                  tint(day),
                )}
              >
                <div className="col-span-2 min-w-0">{dayTitle(day)}</div>
                <div className="text-right">{editButton(day, hasHours)}</div>
                {hasHours ? (
                  <>
                    <div className="col-span-3 min-w-0">
                      <p className={micro}>Shift</p>
                      <p className="font-mono text-[13px] tabular-nums">
                        {fmtTime(day.startTime!)} – {fmtTime(day.endTime!)}
                      </p>
                    </div>
                    <StackFigure
                      label="Hours"
                      value={formatHoursAndMinutes(day.rawHours)}
                    />
                    <StackFigure
                      label="Break"
                      value={`${day.breakMinutes} min`}
                    />
                    <StackFigure
                      label="Paid hours"
                      value={formatHoursAndMinutes(day.totalHours)}
                    />
                    <div className="col-span-3 min-w-0">
                      <p className={micro}>Pay</p>
                      <p className="text-[17px] font-semibold tabular-nums">
                        {formatAUD(day.pay)}
                        {day.isHoliday && (
                          <span className="text-ph ml-2 font-mono text-[11px] font-normal">
                            PH rate
                          </span>
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground col-span-3 text-sm">
                    No hours logged
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Week summary */}
        <div className="bg-card border-border grid grid-cols-2 rounded-lg border lg:grid-cols-4">
          <div className="min-w-0 p-4">
            <p className={micro}>Days worked</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {daysWorked}
            </p>
          </div>
          <div className="border-border min-w-0 border-l p-4">
            <p className={micro}>Total paid hours</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {formatHoursAndMinutes(totalHours)}
            </p>
          </div>
          <div className="border-border min-w-0 border-t p-4 lg:border-t-0 lg:border-l">
            <p className={micro}>Break time</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {totalBreakMinutes} min
            </p>
          </div>
          <div className="border-border min-w-0 border-t border-l p-4 lg:border-t-0">
            <p className={micro}>Total pay</p>
            <p className="text-primary mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {formatAUD(totalPay)}
            </p>
          </div>
        </div>
      </main>

      {/* Edit Timesheet Dialog */}
      {/* // Show EditTimesheetDialog only when both an editingDay and employee are set */}
      {editingDay && employee && (
        <EditTimesheetDialog
          // Dialog is open if editingDay is not null
          open={editingDay !== null}
          // When dialog is closed, clear the editingDay to hide the dialog
          onOpenChange={(open) => {
            if (!open) {
              setEditingDay(null);
            }
          }}
          // Pass the employee ID for whom the timesheet is being edited
          employeeId={employeeId}
          employeeName={`${employee.first_name} ${employee.last_name}`}
          // The work date of the timesheet entry being edited
          workDate={editingDay.date}
          // Current start time (can be null if not set)
          startTime={editingDay.startTime}
          // Current end time (can be null if not set)
          endTime={editingDay.endTime}
          // On successful dialog update, close the dialog and reload employee data
          onSuccess={() => {
            setEditingDay(null);
            void loadData();
          }}
        />
      )}
    </>
  );
}

/** Micro label: table heads and stat labels */
const micro =
  "text-muted-foreground font-mono text-[11px] tracking-[0.1em] uppercase";
const th = `${micro} px-3.5 py-3 font-normal whitespace-nowrap`;
const td =
  "border-border border-b px-3.5 py-3 align-middle font-mono text-[13px] tabular-nums";
const sub =
  "text-muted-foreground mt-px block font-mono text-[11px] font-normal";

/** One labelled value in a stacked (phone) row */
function StackFigure({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className={micro}>{label}</p>
      <p className="font-mono text-[13px] tabular-nums">{value}</p>
    </div>
  );
}

export default function EmployeeDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex min-h-screen items-center justify-center text-sm">
          Loading employee details…
        </div>
      }
    >
      <EmployeeDetailContent />
    </Suspense>
  );
}
