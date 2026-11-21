/**
 * Manager Dashboard Page - Payroll View
 *
 * Main payroll dashboard showing employee hours and pay calculations for the week.
 * Read-only view focused on payroll tracking and employee time data.
 *
 * Features:
 * - Employee table with pay rates and hours breakdown by calendar day (weekday/Saturday/Sunday); PH uses rate only
 * - Weekly pay calculations with break deductions
 * - Search employees by name
 * - Week navigator (previous/next week)
 * - Settings access (for employee management and break rules)
 * - Click an employee row to view detailed daily breakdown
 *
 * Note: Employee CRUD operations (add/edit/delete) are handled in Settings page.
 * This dashboard focuses on viewing payroll data and navigating between weeks.
 */
"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WeekNavigator } from "@/components/WeekNavigator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, Loader2, Search } from "lucide-react";
import { startOfWeek, endOfWeek, addWeeks, format, getDay } from "date-fns";
import type {
  Employee,
  EmployeeCategory,
  TimesheetWithEmployee,
} from "@/types/database";
import { formatHoursAndMinutes } from "@/lib/timeUtils";
import { exportPayrollToCSV } from "@/lib/csvExport";
import { PrintSelectModal } from "@/components/PrintSelectModal";
import { payrollForPeriod } from "~/lib/payrollRates";
import { DatePicker } from "@/components/ui/date-picker";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatAUD } from "@/lib/format";
import { cn } from "~/lib/utils";

function getCalendarDayBucket(
  dateString: string,
): "weekday" | "saturday" | "sunday" {
  const dayOfWeek = getDay(new Date(dateString));
  if (dayOfWeek === 0) return "sunday";
  if (dayOfWeek === 6) return "saturday";
  return "weekday";
}

interface EmployeeWithPay extends Employee {
  weekdayHours: number;
  saturdayHours: number;
  sundayHours: number;
  totalPay: number;
  totalHours: number;
  rawHours: number; // Total hours before break deductions
  breakMinutes: number; // Total break minutes
  daysWorked: number; // Total unique days worked (for day_rate employees)
}

function ManagerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial state from URL params
  const urlViewMode = searchParams.get("viewMode") as "week" | "custom" | null;
  const urlStartDate = searchParams.get("startDate");
  const urlEndDate = searchParams.get("endDate");

  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  // Raw data from API
  const [rawEmployees, setRawEmployees] = useState<Employee[]>([]);
  const [rawTimesheets, setRawTimesheets] = useState<TimesheetWithEmployee[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<EmployeeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Date range picker state - initialize from URL if available
  const [viewMode, setViewMode] = useState<"week" | "custom">(
    urlViewMode ?? "week",
  );
  const [customStartDate, setCustomStartDate] = useState<Date>(
    urlStartDate
      ? new Date(urlStartDate)
      : startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [customEndDate, setCustomEndDate] = useState<Date>(
    urlEndDate
      ? new Date(urlEndDate)
      : endOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  // Get the actual date range based on view mode
  const actualStartDate =
    viewMode === "week" ? currentWeekStart : customStartDate;
  const actualEndDate = viewMode === "week" ? weekEnd : customEndDate;

  // Memoize date strings to use as stable dependencies
  const startDateStr = format(actualStartDate, "yyyy-MM-dd");
  const endDateStr = format(actualEndDate, "yyyy-MM-dd");

  /**
   * Load all data - fetches employees and timesheets
   */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const [employeesData, timesheetsData, categoriesData] = await Promise.all(
        [
          // Fetch employees
          fetch("/api/client/employees")
            .then((res) => res.json() as Promise<{ employees?: Employee[] }>)
            .then((data) => data?.employees ?? [])
            .catch((error) => {
              console.error("Error fetching employees:", error);
              return [] as Employee[];
            }),
          // Fetch timesheets
          fetch(
            `/api/client/timesheets?startDate=${startDateStr}&endDate=${endDateStr}`,
          )
            .then(
              (res) =>
                res.json() as Promise<{ timesheets?: TimesheetWithEmployee[] }>,
            )
            .then((data) => data?.timesheets ?? [])
            .catch((error) => {
              console.error("Error fetching timesheets:", error);
              return [] as TimesheetWithEmployee[];
            }),
          // Fetch categories
          fetch("/api/client/categories")
            .then(
              (res) =>
                res.json() as Promise<{ categories?: EmployeeCategory[] }>,
            )
            .then((data) => data?.categories ?? [])
            .catch(() => [] as EmployeeCategory[]),
        ],
      );

      setRawEmployees(employeesData);
      setRawTimesheets(timesheetsData);
      setCategories(categoriesData);
      setLoading(false);
    };

    void loadData();
  }, [startDateStr, endDateStr]);

  /**
   * Memoized: Hour buckets by calendar day + raw/break totals (pay uses payrollForPeriod)
   */
  type PayDataEntry = {
    weekday: number;
    saturday: number;
    sunday: number;
    rawHours: number;
    breakMinutes: number;
  };

  const payData = useMemo(() => {
    return rawTimesheets.reduce(
      (acc: Record<string, PayDataEntry>, ts: TimesheetWithEmployee) => {
        acc[ts.employee_id] ??= {
          weekday: 0,
          saturday: 0,
          sunday: 0,
          rawHours: 0,
          breakMinutes: 0,
        };

        const entry = acc[ts.employee_id]!;
        const bucket = getCalendarDayBucket(ts.work_date);
        const hours = parseFloat(ts.total_hours.toString());
        const breakMins = ts.break_minutes ?? 0;

        let rawHours = hours;
        if (ts.start_time && ts.end_time) {
          const start = new Date(`2000-01-01T${ts.start_time}`);
          const end = new Date(`2000-01-01T${ts.end_time}`);
          rawHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }

        entry[bucket] += hours;
        entry.rawHours += rawHours;
        entry.breakMinutes += breakMins;

        return acc;
      },
      {},
    );
  }, [rawTimesheets]);

  const timesheetsByEmployeeId = useMemo(() => {
    const m = new Map<string, TimesheetWithEmployee[]>();
    for (const ts of rawTimesheets) {
      const list = m.get(ts.employee_id) ?? [];
      list.push(ts);
      m.set(ts.employee_id, list);
    }
    return m;
  }, [rawTimesheets]);

  /**
   * Merge employees with pay data and sort.
   * payrollForPeriod is async (it lazy-loads the holiday-rate library on
   * first use), so this can't be a useMemo — it recomputes in an effect
   * whenever the underlying data changes, guarded against stale overwrites
   * if the user navigates weeks again before a previous computation lands.
   */
  const [employees, setEmployees] = useState<EmployeeWithPay[]>([]);
  const [computingPay, setComputingPay] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setComputingPay(true);

    const computeEmployees = async () => {
      const employeesWithPay: EmployeeWithPay[] = await Promise.all(
        rawEmployees.map(async (emp: Employee) => {
          const empData = payData[emp.id];
          const weekdayHours = empData?.weekday ?? 0;
          const saturdayHours = empData?.saturday ?? 0;
          const sundayHours = empData?.sunday ?? 0;
          const rawHours = empData?.rawHours ?? 0;
          const breakMinutes = empData?.breakMinutes ?? 0;

          const sheets = timesheetsByEmployeeId.get(emp.id) ?? [];
          const { totalPay, daysWorked } = await payrollForPeriod(
            emp,
            sheets,
          );

          return {
            ...emp,
            weekdayHours,
            saturdayHours,
            sundayHours,
            totalHours: weekdayHours + saturdayHours + sundayHours,
            totalPay,
            rawHours,
            breakMinutes,
            daysWorked,
          };
        }),
      );

      if (cancelled) return;
      // Sort by total pay (descending)
      setEmployees(employeesWithPay.sort((a, b) => b.totalPay - a.totalPay));
      setComputingPay(false);
    };

    void computeEmployees();
    return () => {
      cancelled = true;
    };
  }, [rawEmployees, payData, timesheetsByEmployeeId]);

  // Update URL when view mode or date range changes
  // Only update if values actually changed to prevent infinite loop
  useEffect(() => {
    const startDateStr = format(actualStartDate, "yyyy-MM-dd");
    const endDateStr = format(actualEndDate, "yyyy-MM-dd");

    // Check if URL already matches current state
    const currentParams = new URLSearchParams(window.location.search);
    const currentViewMode = currentParams.get("viewMode");
    const currentStartDate = currentParams.get("startDate");
    const currentEndDate = currentParams.get("endDate");

    if (
      currentViewMode === viewMode &&
      currentStartDate === startDateStr &&
      currentEndDate === endDateStr
    ) {
      return; // URL already matches, no update needed
    }

    const params = new URLSearchParams();
    params.set("viewMode", viewMode);
    params.set("startDate", startDateStr);
    params.set("endDate", endDateStr);

    router.replace(`/client/manager/dashboard?${params.toString()}`, {
      scroll: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, currentWeekStart, customStartDate, customEndDate]);

  /**
   * Memoized: Filter employees by search query
   */
  const filteredEmployees = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return employees.filter((emp) => {
      const matchesSearch =
        emp.first_name.toLowerCase().includes(searchLower) ||
        emp.last_name.toLowerCase().includes(searchLower);
      const matchesCategory =
        selectedCategory === null || emp.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [employees, searchQuery, selectedCategory]);

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      document.cookie = "manager_session=; Max-Age=0; path=/";
      router.push("/client");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  /**
   * Handle CSV export - Payroll-ready universal format
   */
  const handleExportCSV = () => {
    const employeeData = filteredEmployees.map((emp) => ({
      firstName: emp.first_name,
      lastName: emp.last_name,
      weekdayHours: emp.weekdayHours,
      saturdayHours: emp.saturdayHours,
      sundayHours: emp.sundayHours,
      totalHours: emp.totalHours,
      payType: emp.pay_type,
      breakMinutes: emp.breakMinutes,
      applyBreakRules: emp.apply_break_rules,
    }));

    exportPayrollToCSV({
      employees: employeeData,
      weekEndingDate: actualEndDate, // Use end date as week-ending date
    });
  };

  // Memoized: Calculate summary stats
  const { totalPay, totalHours } = useMemo(
    () => ({
      totalPay: employees.reduce((sum, emp) => sum + emp.totalPay, 0),
      totalHours: employees.reduce((sum, emp) => sum + emp.totalHours, 0),
    }),
    [employees],
  );

  // Column totals for the table footer (the rows currently shown)
  const tableTotals = useMemo(
    () =>
      filteredEmployees.reduce(
        (t, emp) => ({
          weekday: t.weekday + emp.weekdayHours,
          saturday: t.saturday + emp.saturdayHours,
          sunday: t.sunday + emp.sundayHours,
          paid: t.paid + emp.totalHours,
          breakMinutes: t.breakMinutes + emp.breakMinutes,
          pay: t.pay + emp.totalPay,
        }),
        { weekday: 0, saturday: 0, sunday: 0, paid: 0, breakMinutes: 0, pay: 0 },
      ),
    [filteredEmployees],
  );

  const openEmployee = (employeeId: string) => {
    const params = new URLSearchParams({
      viewMode,
      startDate: format(actualStartDate, "yyyy-MM-dd"),
      endDate: format(actualEndDate, "yyyy-MM-dd"),
    });
    router.push(`/client/manager/employee/${employeeId}?${params.toString()}`);
  };

  return (
    <>
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

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Page head: title, range, view switch, week navigator, actions */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Payroll dashboard
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {format(actualStartDate, "d MMM")} –{" "}
              {format(actualEndDate, "d MMM yyyy")}
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div
                role="group"
                aria-label="View"
                className="border-input bg-card inline-flex overflow-hidden rounded-lg border"
              >
                {(
                  [
                    ["week", "Week view"],
                    ["custom", "Custom range"],
                  ] as const
                ).map(([mode, label], i) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={viewMode === mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "focus-visible:ring-ring min-h-10 px-3 text-[13.5px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset",
                      i > 0 && "border-border border-l",
                      viewMode === mode
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {viewMode === "week" ? (
                <WeekNavigator
                  weekStart={currentWeekStart}
                  weekEnd={weekEnd}
                  onPrevious={() =>
                    setCurrentWeekStart(addWeeks(currentWeekStart, -1))
                  }
                  onNext={() =>
                    setCurrentWeekStart(addWeeks(currentWeekStart, 1))
                  }
                />
              ) : (
                <>
                  <div className="grid gap-1">
                    <span className="text-muted-foreground text-[12.5px]">
                      Start date
                    </span>
                    <DatePicker
                      value={customStartDate}
                      onChange={setCustomStartDate}
                      className="w-44"
                    />
                  </div>
                  <div className="grid gap-1">
                    <span className="text-muted-foreground text-[12.5px]">
                      End date
                    </span>
                    <DatePicker
                      value={customEndDate}
                      onChange={setCustomEndDate}
                      className="w-44"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setPrintModalOpen(true)}
              disabled={filteredEmployees.length === 0}
            >
              Print
            </Button>
            <Button
              onClick={handleExportCSV}
              disabled={filteredEmployees.length === 0}
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="bg-card border-border grid grid-cols-2 rounded-lg border sm:grid-cols-3">
          <div className="col-span-2 min-w-0 p-4 sm:col-span-1">
            <p className={micro}>Total payroll</p>
            <p className="text-primary mt-1 text-3xl font-semibold tracking-tight tabular-nums">
              {formatAUD(totalPay)}
            </p>
          </div>
          <div className="border-border min-w-0 border-t p-4 sm:border-t-0 sm:border-l">
            <p className={micro}>Total hours</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {formatHoursAndMinutes(totalHours)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[12.5px]">
              After breaks
            </p>
          </div>
          <div className="border-border min-w-0 border-t border-l p-4 sm:border-t-0">
            <p className={micro}>Employees</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {employees.length}
            </p>
          </div>
        </div>

        {/* Search and category filter */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative w-full sm:w-64">
              <span className="sr-only">Search employees</span>
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                strokeWidth={1.5}
              />
              <Input
                placeholder="Search employees"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </label>
            {categories.length > 0 && (
              <div
                role="group"
                aria-label="Category"
                className="flex flex-wrap gap-0.5"
              >
                <button
                  type="button"
                  aria-pressed={selectedCategory === null}
                  onClick={() => setSelectedCategory(null)}
                  className={chipClass(selectedCategory === null)}
                >
                  All
                  <span className="text-muted-foreground ml-1 font-mono text-[11px]">
                    {rawEmployees.length}
                  </span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={selectedCategory === cat.id}
                    onClick={() =>
                      setSelectedCategory(
                        cat.id === selectedCategory ? null : cat.id,
                      )
                    }
                    className={chipClass(selectedCategory === cat.id)}
                  >
                    {cat.name}
                    <span className="text-muted-foreground ml-1 font-mono text-[11px]">
                      {
                        rawEmployees.filter((e) => e.category_id === cat.id)
                          .length
                      }
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {categories.length > 0 && (
            <p className="text-muted-foreground text-[12.5px]">
              Filter by department. Manage categories in Settings
            </p>
          )}
        </div>

        {/* Employees */}
        {loading || computingPay ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
            <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
            Loading employees…
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="bg-card border-border text-muted-foreground rounded-lg border px-4 py-10 text-center text-sm">
            {searchQuery
              ? "No employees found matching your search"
              : "No employees yet. Add your first employee to get started"}
          </div>
        ) : (
          <>
            {/* sm and up: one table */}
            <div className="bg-card border-border hidden overflow-x-auto rounded-lg border sm:block">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-border border-b">
                    <th className={th}>Employee</th>
                    <th className={cn(th, "text-wk")}>Weekday</th>
                    <th className={cn(th, "bg-sat/[0.06] text-sat")}>
                      Saturday
                    </th>
                    <th className={cn(th, "bg-sun/[0.06] text-sun")}>
                      Sunday
                    </th>
                    <th className={cn(th, "text-right")}>Paid hours</th>
                    <th className={cn(th, "text-right")}>Break</th>
                    <th className={cn(th, "text-right")}>Pay</th>
                    <th className={cn(th, "w-10")}>
                      <span className="sr-only">View details</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="[&>tr:last-child>td]:border-b-0">
                  {filteredEmployees.map((emp) => {
                    const unit = emp.pay_type === "day_rate" ? "/day" : "/hr";
                    return (
                      <tr
                        key={emp.id}
                        tabIndex={0}
                        onClick={() => openEmployee(emp.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") openEmployee(emp.id);
                        }}
                        className="group hover:bg-secondary focus-visible:bg-secondary focus-visible:ring-ring cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset"
                      >
                        <td className={cn(td, "font-sans whitespace-nowrap")}>
                          <span className="group-hover:text-primary text-[15px] font-medium transition-colors">
                            {emp.first_name} {emp.last_name}
                          </span>
                          <span className={sub}>
                            {emp.category?.name ?? "Uncategorised"}
                          </span>
                        </td>
                        <td className={td}>
                          {formatHoursAndMinutes(emp.weekdayHours)}
                          <span className={sub}>
                            {formatAUD(emp.weekday_rate)}
                            {unit}
                          </span>
                        </td>
                        <td className={cn(td, "bg-sat/[0.06]")}>
                          {formatHoursAndMinutes(emp.saturdayHours)}
                          <span className={sub}>
                            {formatAUD(emp.saturday_rate)}
                            {unit}
                          </span>
                        </td>
                        <td className={cn(td, "bg-sun/[0.06]")}>
                          {formatHoursAndMinutes(emp.sundayHours)}
                          <span className={sub}>
                            {formatAUD(emp.sunday_rate)}
                            {unit}
                          </span>
                        </td>
                        <td className={cn(td, "text-right")}>
                          {formatHoursAndMinutes(emp.totalHours)}
                          <span className={sub}>
                            {formatHoursAndMinutes(emp.rawHours)} logged
                          </span>
                        </td>
                        <td className={cn(td, "text-right")}>
                          {emp.breakMinutes} min
                        </td>
                        <td className={cn(td, "text-right")}>
                          {formatAUD(emp.totalPay)}
                          {emp.pay_type === "day_rate" && (
                            <span className={sub}>
                              {emp.daysWorked}{" "}
                              {emp.daysWorked === 1 ? "day" : "days"} worked ·{" "}
                              {emp.totalHours.toFixed(1)}h total
                            </span>
                          )}
                        </td>
                        <td className="text-muted-foreground w-10 pr-3 text-right">
                          <ChevronRight
                            aria-hidden
                            strokeWidth={1.5}
                            className="inline size-[18px]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-input border-t">
                    <td className={cn(tf, micro)}>Total</td>
                    <td className={tf}>
                      {formatHoursAndMinutes(tableTotals.weekday)}
                    </td>
                    <td className={cn(tf, "bg-sat/[0.06]")}>
                      {formatHoursAndMinutes(tableTotals.saturday)}
                    </td>
                    <td className={cn(tf, "bg-sun/[0.06]")}>
                      {formatHoursAndMinutes(tableTotals.sunday)}
                    </td>
                    <td className={cn(tf, "text-right")}>
                      {formatHoursAndMinutes(tableTotals.paid)}
                    </td>
                    <td className={cn(tf, "text-right")}>
                      {tableTotals.breakMinutes} min
                    </td>
                    <td className="text-primary px-3.5 py-3 text-right text-xl font-semibold tracking-tight whitespace-nowrap tabular-nums">
                      {formatAUD(tableTotals.pay)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Below sm: the same rows as stacked cards */}
            <div className="bg-card border-border divide-border divide-y rounded-lg border sm:hidden">
              {filteredEmployees.map((emp) => {
                const unit = emp.pay_type === "day_rate" ? "/day" : "/hr";
                return (
                  <div
                    key={emp.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => openEmployee(emp.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") openEmployee(emp.id);
                    }}
                    className="hover:bg-secondary focus-visible:bg-secondary focus-visible:ring-ring grid cursor-pointer grid-cols-3 gap-x-3 gap-y-2.5 px-4 py-3.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset"
                  >
                    <div className="col-span-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[15px] font-medium">
                          {emp.first_name} {emp.last_name}
                        </span>
                        <span className={sub}>
                          {emp.category?.name ?? "Uncategorised"}
                        </span>
                      </div>
                      <span className="text-muted-foreground inline-flex shrink-0 items-center gap-0.5 text-[13px]">
                        View details
                        <ChevronRight
                          aria-hidden
                          strokeWidth={1.5}
                          className="size-4"
                        />
                      </span>
                    </div>
                    <StackFigure
                      label="Weekday"
                      labelClass="text-wk"
                      value={formatHoursAndMinutes(emp.weekdayHours)}
                      sub={`${formatAUD(emp.weekday_rate)}${unit}`}
                    />
                    <StackFigure
                      label="Saturday"
                      labelClass="text-sat"
                      value={formatHoursAndMinutes(emp.saturdayHours)}
                      sub={`${formatAUD(emp.saturday_rate)}${unit}`}
                    />
                    <StackFigure
                      label="Sunday"
                      labelClass="text-sun"
                      value={formatHoursAndMinutes(emp.sundayHours)}
                      sub={`${formatAUD(emp.sunday_rate)}${unit}`}
                    />
                    <StackFigure
                      label="Paid hours"
                      value={formatHoursAndMinutes(emp.totalHours)}
                      sub={`${formatHoursAndMinutes(emp.rawHours)} logged`}
                    />
                    <StackFigure
                      label="Break"
                      value={`${emp.breakMinutes} min`}
                    />
                    <StackFigure
                      label="Pay"
                      value={formatAUD(emp.totalPay)}
                      valueClass="font-sans text-[17px] font-semibold"
                      sub={
                        emp.pay_type === "day_rate"
                          ? `${emp.daysWorked} ${emp.daysWorked === 1 ? "day" : "days"} worked · ${emp.totalHours.toFixed(1)}h total`
                          : undefined
                      }
                    />
                  </div>
                );
              })}
              <div className="grid grid-cols-3 gap-x-3 gap-y-2.5 px-4 py-3.5">
                <p className={cn(micro, "col-span-3")}>Total</p>
                <StackFigure
                  label="Weekday"
                  labelClass="text-wk"
                  value={formatHoursAndMinutes(tableTotals.weekday)}
                />
                <StackFigure
                  label="Saturday"
                  labelClass="text-sat"
                  value={formatHoursAndMinutes(tableTotals.saturday)}
                />
                <StackFigure
                  label="Sunday"
                  labelClass="text-sun"
                  value={formatHoursAndMinutes(tableTotals.sunday)}
                />
                <StackFigure
                  label="Paid hours"
                  value={formatHoursAndMinutes(tableTotals.paid)}
                />
                <StackFigure
                  label="Break"
                  value={`${tableTotals.breakMinutes} min`}
                />
                <StackFigure
                  label="Total pay"
                  value={formatAUD(tableTotals.pay)}
                  valueClass="text-primary font-sans text-xl font-semibold"
                />
              </div>
            </div>

            <p className="text-muted-foreground text-right text-[13px]">
              Select an employee to see their shifts
            </p>
          </>
        )}
      </main>

      <PrintSelectModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        employees={rawEmployees}
        timesheets={rawTimesheets}
        weekStart={actualStartDate}
        weekEnd={actualEndDate}
      />
    </>
  );
}

/** Micro label: table heads and stat labels */
const micro =
  "text-muted-foreground font-mono text-[11px] tracking-[0.1em] uppercase";
const th = `${micro} px-3.5 py-3 font-normal whitespace-nowrap`;
const td =
  "border-border border-b px-3.5 py-3 align-middle font-mono text-[13px] tabular-nums";
const tf = "px-3.5 py-3 font-mono text-[13px] whitespace-nowrap tabular-nums";
const sub = "text-muted-foreground mt-px block font-mono text-[11px] font-normal";

function chipClass(selected: boolean): string {
  return cn(
    "focus-visible:ring-ring min-h-10 rounded-lg border px-2.5 text-[13px] transition-colors outline-none focus-visible:ring-2",
    selected
      ? "border-input bg-card text-foreground"
      : "text-muted-foreground hover:text-foreground border-transparent",
  );
}

/** One labelled value in a stacked (phone) row */
function StackFigure({
  label,
  labelClass,
  value,
  valueClass,
  sub: subText,
}: {
  label: string;
  labelClass?: string;
  value: string;
  valueClass?: string;
  sub?: string;
}) {
  return (
    <div className="min-w-0">
      <p className={cn(micro, labelClass)}>{label}</p>
      <p className={cn("font-mono text-[13px] tabular-nums", valueClass)}>
        {value}
      </p>
      {subText && <p className={sub}>{subText}</p>}
    </div>
  );
}

export default function ManagerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex min-h-screen items-center justify-center text-sm">
          Loading dashboard…
        </div>
      }
    >
      <ManagerDashboardContent />
    </Suspense>
  );
}
