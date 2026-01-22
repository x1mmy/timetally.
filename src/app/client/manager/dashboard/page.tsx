/**
 * Manager Dashboard Page - Payroll View
 *
 * Main payroll dashboard showing employee hours and pay calculations for the week.
 * Read-only view focused on payroll tracking and employee time data.
 *
 * Features:
 * - Employee cards with pay rates and hours breakdown (weekday/Saturday/Sunday)
 * - Weekly pay calculations with break deductions
 * - Search employees by name
 * - Week navigator (previous/next week)
 * - Settings access (for employee management and break rules)
 * - Click employee card to view detailed daily breakdown
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
import {
  DollarSign,
  Search,
  LogOut,
  Settings,
  Users,
  Clock,
  Calendar,
  Download,
  TrendingUp,
  ArrowRight,
  Printer,
} from "lucide-react";
import { startOfWeek, endOfWeek, addWeeks, format, getDay } from "date-fns";
import type { Employee, TimesheetWithEmployee } from "@/types/database";
import { formatHoursAndMinutes } from "@/lib/timeUtils";
import { exportPayrollToCSV, printPayrollCSV } from "@/lib/csvExport";
import { motion, AnimatePresence } from "framer-motion";
import { DatePicker } from "@/components/ui/date-picker";

interface EmployeeWithPay extends Employee {
  weekdayHours: number;
  saturdayHours: number;
  sundayHours: number;
  totalPay: number;
  totalHours: number;
  rawHours: number; // Total hours before break deductions
  breakMinutes: number; // Total break minutes
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
  const [rawTimesheets, setRawTimesheets] = useState<TimesheetWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Date range picker state - initialize from URL if available
  const [viewMode, setViewMode] = useState<"week" | "custom">(
    urlViewMode ?? "week"
  );
  const [customStartDate, setCustomStartDate] = useState<Date>(
    urlStartDate
      ? new Date(urlStartDate)
      : startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [customEndDate, setCustomEndDate] = useState<Date>(
    urlEndDate
      ? new Date(urlEndDate)
      : endOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  // Get the actual date range based on view mode
  const actualStartDate = viewMode === "week" ? currentWeekStart : customStartDate;
  const actualEndDate = viewMode === "week" ? weekEnd : customEndDate;

  /**
   * Calculate day type (weekday, saturday, sunday)
   */
  const getDayType = (
    dateString: string,
  ): "weekday" | "saturday" | "sunday" => {
    const date = new Date(dateString);
    const dayOfWeek = getDay(date);

    if (dayOfWeek === 0) return "sunday";
    if (dayOfWeek === 6) return "saturday";
    return "weekday";
  };

  // Memoize date strings to use as stable dependencies
  const startDateStr = format(actualStartDate, "yyyy-MM-dd");
  const endDateStr = format(actualEndDate, "yyyy-MM-dd");

  /**
   * Load all data - fetches employees and timesheets
   */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const [employeesData, timesheetsData] = await Promise.all([
        // Fetch employees
        fetch("/api/client/employees")
          .then(res => res.json() as Promise<{ employees?: Employee[] }>)
          .then(data => data?.employees ?? [])
          .catch((error) => {
            console.error("Error fetching employees:", error);
            return [] as Employee[];
          }),
        // Fetch timesheets
        fetch(`/api/client/timesheets?startDate=${startDateStr}&endDate=${endDateStr}`)
          .then(res => res.json() as Promise<{ timesheets?: TimesheetWithEmployee[] }>)
          .then(data => data?.timesheets ?? [])
          .catch((error) => {
            console.error("Error fetching timesheets:", error);
            return [] as TimesheetWithEmployee[];
          }),
      ]);

      setRawEmployees(employeesData);
      setRawTimesheets(timesheetsData);
      setLoading(false);
    };

    void loadData();
  }, [startDateStr, endDateStr]);

  /**
   * Memoized: Calculate pay data from timesheets
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
        const dayType = getDayType(ts.work_date);
        const hours = parseFloat(ts.total_hours.toString());
        const breakMins = ts.break_minutes ?? 0;

        // Calculate raw hours from start/end time if available
        let rawHours = hours;
        if (ts.start_time && ts.end_time) {
          const start = new Date(`2000-01-01T${ts.start_time}`);
          const end = new Date(`2000-01-01T${ts.end_time}`);
          rawHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }

        entry[dayType] += hours;
        entry.rawHours += rawHours;
        entry.breakMinutes += breakMins;
        return acc;
      },
      {},
    );
  }, [rawTimesheets]);

  /**
   * Memoized: Merge employees with pay data and sort
   */
  const employees = useMemo(() => {
    const employeesWithPay: EmployeeWithPay[] = rawEmployees.map(
      (emp: Employee) => {
        const empData = payData[emp.id];
        const weekdayHours = empData?.weekday ?? 0;
        const saturdayHours = empData?.saturday ?? 0;
        const sundayHours = empData?.sunday ?? 0;
        const rawHours = empData?.rawHours ?? 0;
        const breakMinutes = empData?.breakMinutes ?? 0;

        const totalPay =
          weekdayHours * emp.weekday_rate +
          saturdayHours * emp.saturday_rate +
          sundayHours * emp.sunday_rate;

        return {
          ...emp,
          weekdayHours,
          saturdayHours,
          sundayHours,
          totalHours: weekdayHours + saturdayHours + sundayHours,
          totalPay,
          rawHours,
          breakMinutes,
        };
      },
    );

    // Sort by total pay (descending)
    return employeesWithPay.sort((a, b) => b.totalPay - a.totalPay);
  }, [rawEmployees, payData]);

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
    return employees.filter((emp) =>
      emp.first_name.toLowerCase().includes(searchLower) ||
      emp.last_name.toLowerCase().includes(searchLower)
    );
  }, [employees, searchQuery]);

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
    }));

    exportPayrollToCSV({
      employees: employeeData,
      weekEndingDate: actualEndDate, // Use end date as week-ending date
    });
  };

  /**
   * Handle print payroll
   */
  const handlePrintCSV = () => {
    const employeeData = filteredEmployees.map((emp) => ({
      firstName: emp.first_name,
      lastName: emp.last_name,
      weekdayHours: emp.weekdayHours,
      saturdayHours: emp.saturdayHours,
      sundayHours: emp.sundayHours,
    }));

    printPayrollCSV({
      employees: employeeData,
      weekEndingDate: actualEndDate, // Use end date as week-ending date
    });
  };

  // Memoized: Calculate summary stats
  const { totalPay, totalHours } = useMemo(() => ({
    totalPay: employees.reduce((sum, emp) => sum + emp.totalPay, 0),
    totalHours: employees.reduce((sum, emp) => sum + emp.totalHours, 0),
  }), [employees]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-96 w-96 animate-pulse rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute -right-40 bottom-20 h-[500px] w-[500px] animate-pulse rounded-full bg-blue-400/5 blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-xl"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="rounded-xl bg-primary/10 p-2 ring-2 ring-primary/20">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Payroll Dashboard<span className="text-primary">.</span>
                </h1>
                <p className="text-sm text-neutral-400">
                  {format(actualStartDate, "MMM dd")} -{" "}
                  {format(actualEndDate, "MMM dd, yyyy")}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex gap-2"
            >
              <Button
                variant="outline"
                onClick={() => router.push("/client/manager/settings")}
                className="border-neutral-700 bg-neutral-800/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-neutral-800"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-neutral-700 bg-neutral-800/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-neutral-800"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                onClick={() => setViewMode("week")}
                className={
                  viewMode === "week"
                    ? "bg-primary text-white"
                    : "border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
                }
              >
                <Calendar className="mr-2 h-4 w-4" />
                Week View
              </Button>
              <Button
                variant={viewMode === "custom" ? "default" : "outline"}
                onClick={() => setViewMode("custom")}
                className={
                  viewMode === "custom"
                    ? "bg-primary text-white"
                    : "border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
                }
              >
                <Calendar className="mr-2 h-4 w-4" />
                Custom Range
              </Button>
            </div>
          </div>

          {/* Week Navigator - Show only in week mode */}
          {viewMode === "week" && (
            <WeekNavigator
              weekStart={currentWeekStart}
              weekEnd={weekEnd}
              onPrevious={() =>
                setCurrentWeekStart(addWeeks(currentWeekStart, -1))
              }
              onNext={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            />
          )}

          {/* Custom Date Range Picker - Show only in custom mode */}
          {viewMode === "custom" && (
            <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-neutral-400">
                    Start Date
                  </label>
                  <DatePicker
                    value={customStartDate}
                    onChange={setCustomStartDate}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-neutral-400">
                    End Date
                  </label>
                  <DatePicker
                    value={customEndDate}
                    onChange={setCustomEndDate}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            {/* Total Payroll */}
            <motion.div
              whileHover={{ y: -5 }}
              className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-linear-to-br from-neutral-900/90 to-neutral-900/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
            >
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="mb-2 text-sm font-medium text-neutral-400">Total Payroll</p>
                  <p className="text-4xl font-bold text-primary">
                    ${totalPay.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3 ring-2 ring-primary/20 transition-all group-hover:scale-110 group-hover:ring-primary/40">
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </div>
            </motion.div>

            {/* Total Hours */}
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ delay: 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-linear-to-br from-neutral-900/90 to-neutral-900/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
            >
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="mb-2 text-sm font-medium text-neutral-400">Total Hours</p>
                  <p className="text-4xl font-bold">
                    {formatHoursAndMinutes(totalHours)}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-500/10 p-3 ring-2 ring-blue-500/20 transition-all group-hover:scale-110 group-hover:ring-blue-500/40">
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </motion.div>

            {/* Employees Count */}
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ delay: 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-linear-to-br from-neutral-900/90 to-neutral-900/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
            >
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-purple-500/10 blur-2xl transition-all group-hover:bg-purple-500/20" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="mb-2 text-sm font-medium text-neutral-400">Employees</p>
                  <p className="text-4xl font-bold">{employees.length}</p>
                </div>
                <div className="rounded-xl bg-purple-500/10 p-3 ring-2 ring-purple-500/20 transition-all group-hover:scale-110 group-hover:ring-purple-500/40">
                  <Users className="h-8 w-8 text-purple-400" />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Search Bar and Export Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Search employees by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-neutral-700 bg-neutral-800 pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePrintCSV}
                variant="outline"
                className="border-neutral-700 bg-neutral-800/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-neutral-800"
                disabled={filteredEmployees.length === 0}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button
                onClick={handleExportCSV}
                className="bg-primary hover:bg-primary/90 text-white"
                disabled={filteredEmployees.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
              </Button>
            </div>
          </div>

          {/* Employee Cards */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Clock className="h-12 w-12 text-primary" />
              </motion.div>
              <p className="mt-4 text-neutral-400">Loading employees...</p>
            </motion.div>
          ) : filteredEmployees.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-12 text-center text-neutral-400 backdrop-blur-sm"
            >
              <Users className="mx-auto mb-4 h-16 w-16 text-neutral-600" />
              <p className="text-lg">
                {searchQuery
                  ? "No employees found matching your search"
                  : "No employees yet. Add your first employee to get started."}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {filteredEmployees.map((emp, index) => {
                  const params = new URLSearchParams({
                    viewMode,
                    startDate: format(actualStartDate, "yyyy-MM-dd"),
                    endDate: format(actualEndDate, "yyyy-MM-dd"),
                  });
                  return (
                    <motion.div
                      key={emp.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -5 }}
                      onClick={() =>
                        router.push(
                          `/client/manager/employee/${emp.id}?${params.toString()}`,
                        )
                      }
                      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-neutral-800 bg-linear-to-br from-neutral-900/90 to-neutral-900/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
                    >
                      {/* Gradient overlay */}
                      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent" />
                      </div>

                      {/* Employee Header with Total Pay */}
                      <div className="relative mb-4 flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="mb-1 text-xl font-bold">
                            {emp.first_name} {emp.last_name}
                          </h3>
                          <p className="text-sm text-neutral-400">
                            Weekday: ${emp.weekday_rate.toFixed(2)}/hr | Sat: $
                            {emp.saturday_rate.toFixed(2)}/hr | Sun: $
                            {emp.sunday_rate.toFixed(2)}/hr
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="mb-1 text-3xl font-bold text-primary">
                            ${emp.totalPay.toFixed(2)}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {formatHoursAndMinutes(emp.rawHours)} →{" "}
                            {formatHoursAndMinutes(emp.totalHours)}
                          </div>
                          <div className="text-xs text-neutral-500">
                            ({emp.breakMinutes} min break)
                          </div>
                        </div>
                      </div>

                      {/* Day Boxes */}
                      <div className="relative grid grid-cols-3 gap-3">
                        <motion.div
                          whileHover={{ y: -3 }}
                          className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-center backdrop-blur-sm transition-all hover:border-blue-500/50 hover:bg-blue-500/20"
                        >
                          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                            Weekday
                          </div>
                          <div className="text-xl font-bold">
                            {formatHoursAndMinutes(emp.weekdayHours)}
                          </div>
                        </motion.div>
                        <motion.div
                          whileHover={{ y: -3 }}
                          className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-center backdrop-blur-sm transition-all hover:border-purple-500/50 hover:bg-purple-500/20"
                        >
                          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                            Saturday
                          </div>
                          <div className="text-xl font-bold">
                            {formatHoursAndMinutes(emp.saturdayHours)}
                          </div>
                        </motion.div>
                        <motion.div
                          whileHover={{ y: -3 }}
                          className="rounded-xl border border-pink-500/30 bg-pink-500/10 p-4 text-center backdrop-blur-sm transition-all hover:border-pink-500/50 hover:bg-pink-500/20"
                        >
                          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                            Sunday
                          </div>
                          <div className="text-xl font-bold">
                            {formatHoursAndMinutes(emp.sundayHours)}
                          </div>
                        </motion.div>
                      </div>

                      {/* View Details Indicator */}
                      <div className="relative mt-4 flex items-center justify-end gap-2 text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        <span>View Details</span>
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ManagerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-white">
          <div className="text-center">
            <div className="mb-4 text-xl">Loading dashboard...</div>
          </div>
        </div>
      }
    >
      <ManagerDashboardContent />
    </Suspense>
  );
}
