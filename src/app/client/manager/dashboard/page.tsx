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

import { useEffect, useState, Suspense } from "react";
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
} from "lucide-react";
import { startOfWeek, endOfWeek, addWeeks, format, getDay } from "date-fns";
import type { Employee, TimesheetWithEmployee } from "@/types/database";
import { formatHoursAndMinutes } from "@/lib/timeUtils";
import { exportPayrollToCSV } from "@/lib/csvExport";

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
  const [employees, setEmployees] = useState<EmployeeWithPay[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetWithEmployee[]>([]);
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

  /**
   * Fetch employees
   */
  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/client/employees");
      const data = await response.json();

      if (response.ok) {
        return data?.employees ?? [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  };

  /**
   * Fetch timesheets for current date range
   */
  const fetchTimesheets = async () => {
    try {
      const startDate = format(actualStartDate, "yyyy-MM-dd");
      const endDate = format(actualEndDate, "yyyy-MM-dd");

      const response = await fetch(
        `/api/client/timesheets?startDate=${startDate}&endDate=${endDate}`,
      );
      const data = await response.json();

      if (response.ok) {
        return data?.timesheets ?? [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching timesheets:", error);
      return [];
    }
  };

  /**
   * Load all data
   */
  const loadData = async () => {
    setLoading(true);
    const [employeesData, timesheetsData] = await Promise.all([
      fetchEmployees(),
      fetchTimesheets(),
    ]);

    // Calculate hours by day type for each employee
    type PayDataEntry = {
      weekday: number;
      saturday: number;
      sunday: number;
      rawHours: number;
      breakMinutes: number;
    };
    const payData = timesheetsData.reduce(
      (acc: Record<string, PayDataEntry>, ts: TimesheetWithEmployee) => {
        if (!acc[ts.employee_id]) {
          acc[ts.employee_id] = {
            weekday: 0,
            saturday: 0,
            sunday: 0,
            rawHours: 0,
            breakMinutes: 0,
          };
        }

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

    // Merge employees with pay data
    const employeesWithPay: EmployeeWithPay[] = employeesData.map(
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
    employeesWithPay.sort((a, b) => b.totalPay - a.totalPay);

    setEmployees(employeesWithPay);
    setTimesheets(timesheetsData);
    setLoading(false);
  };

  // Load data on mount and when date range changes
  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStart, viewMode, customStartDate, customEndDate]);

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
   * Filter employees by search query
   */
  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      emp.first_name.toLowerCase().includes(searchLower) ||
      emp.last_name.toLowerCase().includes(searchLower)
    );
  });

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      document.cookie = "manager_session=; Max-Age=0; path=/";
      router.push("/client/manager/login");
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

  // Calculate summary stats
  const totalPay = employees.reduce((sum, emp) => sum + emp.totalPay, 0);
  const totalHours = employees.reduce((sum, emp) => sum + emp.totalHours, 0);

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="border-b border-neutral-700 bg-neutral-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="text-primary h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">
                  Payroll Dashboard<span className="text-primary">.</span>
                </h1>
                <p className="text-sm text-neutral-400">
                  {format(actualStartDate, "MMM dd")} -{" "}
                  {format(actualEndDate, "MMM dd, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/client/manager/settings")}
                className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

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
                  <Input
                    type="date"
                    value={format(customStartDate, "yyyy-MM-dd")}
                    onChange={(e) => setCustomStartDate(new Date(e.target.value))}
                    className="border-neutral-700 bg-neutral-900"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-neutral-400">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={format(customEndDate, "yyyy-MM-dd")}
                    onChange={(e) => setCustomEndDate(new Date(e.target.value))}
                    className="border-neutral-700 bg-neutral-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* shadow-xl shadow-blue-500/50 ring-blue-500/40 */}
            <div className="hover: hover:border-primary/50 rounded-lg border border-neutral-700 bg-neutral-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Payroll</p>
                  <p className="text-3xl font-bold">${totalPay.toFixed(2)}</p>
                </div>
                <DollarSign className="text-primary h-8 w-8" />
              </div>
            </div>
            <div className="hover: hover:border-primary/50 rounded-lg border border-neutral-700 bg-neutral-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Hours</p>
                  <p className="text-3xl font-bold">
                    {formatHoursAndMinutes(totalHours)}
                  </p>
                </div>
                <Clock className="text-primary h-8 w-8" />
              </div>
            </div>
            <div className="hover: hover:border-primary/50 rounded-lg border border-neutral-700 bg-neutral-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Employees</p>
                  <p className="text-3xl font-bold">{employees.length}</p>
                </div>
                <Users className="text-primary h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Search Bar and Export Button */}
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
            <Button
              onClick={handleExportCSV}
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={filteredEmployees.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </Button>
          </div>

          {/* Employee Cards */}
          {loading ? (
            <div className="py-12 text-center text-neutral-400">
              Loading employees...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              {searchQuery
                ? "No employees found matching your search"
                : "No employees yet. Add your first employee to get started."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredEmployees.map((emp) => {
                const params = new URLSearchParams({
                  viewMode,
                  startDate: format(actualStartDate, "yyyy-MM-dd"),
                  endDate: format(actualEndDate, "yyyy-MM-dd"),
                });
                return (
                  <div
                    key={emp.id}
                    onClick={() =>
                      router.push(
                        `/client/manager/employee/${emp.id}?${params.toString()}`,
                      )
                    }
                    className="hover:border-primary/50 cursor-pointer rounded-lg border border-neutral-700 bg-neutral-800 p-6 transition-colors"
                  >
                  {/* Employee Header with Total Pay */}
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="mb-1 text-xl font-semibold">
                        {emp.first_name} {emp.last_name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-primary text-3xl font-bold">
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

                  {/* Pay Rates */}
                  <div className="mb-4 text-sm text-neutral-400">
                    Weekday: ${emp.weekday_rate.toFixed(2)}/hr | Sat: $
                    {emp.saturday_rate.toFixed(2)}/hr | Sun: $
                    {emp.sunday_rate.toFixed(2)}/hr
                  </div>

                  {/* Day Boxes */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-blue-500/40 bg-blue-500/20 p-4 text-center">
                      <div className="mb-2 text-sm text-neutral-400">
                        Weekday
                      </div>
                      <div className="text-xl font-semibold">
                        {formatHoursAndMinutes(emp.weekdayHours)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-blue-500/40 bg-blue-500/20 p-4 text-center">
                      <div className="mb-2 text-sm text-neutral-400">
                        Saturday
                      </div>
                      <div className="text-xl font-semibold">
                        {formatHoursAndMinutes(emp.saturdayHours)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-blue-500/40 bg-blue-500/20 p-4 text-center">
                      <div className="mb-2 text-sm text-neutral-400">
                        Sunday
                      </div>
                      <div className="text-xl font-semibold">
                        {formatHoursAndMinutes(emp.sundayHours)}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
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
