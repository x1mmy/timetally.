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

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WeekNavigator } from "@/components/WeekNavigator";
import { AnimatedStatCard } from "@/components/AnimatedStatCard";
import { AnimatedCard } from "@/components/AnimatedCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  Search,
  LogOut,
  Settings,
  Users,
  Clock,
} from "lucide-react";
import { startOfWeek, endOfWeek, addWeeks, format, getDay } from "date-fns";
import type { Employee, TimesheetWithEmployee } from "@/types/database";
import { formatHoursAndMinutes } from "@/lib/timeUtils";

interface EmployeeWithPay extends Employee {
  weekdayHours: number;
  saturdayHours: number;
  sundayHours: number;
  totalPay: number;
  totalHours: number;
  rawHours: number; // Total hours before break deductions
  breakMinutes: number; // Total break minutes
}

export default function ManagerDashboardPage() {
  const router = useRouter();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [employees, setEmployees] = useState<EmployeeWithPay[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

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
   * Fetch timesheets for current week
   */
  const fetchTimesheets = async () => {
    try {
      const startDate = format(currentWeekStart, "yyyy-MM-dd");
      const endDate = format(weekEnd, "yyyy-MM-dd");

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

  // Load data on mount and when week changes
  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStart]);

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

  // Calculate summary stats
  const totalPay = employees.reduce((sum, emp) => sum + emp.totalPay, 0);
  const totalHours = employees.reduce((sum, emp) => sum + emp.totalHours, 0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Animated Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 right-20 h-96 w-96 animate-pulse-slow rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl" />
        <div className="absolute -bottom-40 left-20 h-96 w-96 animate-pulse-slower rounded-full bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="text-primary h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">
                  Payroll Dashboard<span className="text-primary">.</span>
                </h1>
                <p className="text-sm text-neutral-400">
                  {format(currentWeekStart, "MMM dd")} -{" "}
                  {format(weekEnd, "MMM dd, yyyy")}
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
          {/* Week Navigator */}
          <WeekNavigator
            weekStart={currentWeekStart}
            weekEnd={weekEnd}
            onPrevious={() =>
              setCurrentWeekStart(addWeeks(currentWeekStart, -1))
            }
            onNext={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
          />

          {/* Summary Stats - Animated */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <AnimatedStatCard
              label="Total Payroll"
              value={totalPay}
              prefix="$"
              decimals={2}
              icon={DollarSign}
              iconColor="text-green-400"
              animate={true}
              duration={2000}
            />
            <AnimatedStatCard
              label="Total Hours"
              value={formatHoursAndMinutes(totalHours)}
              icon={Clock}
              iconColor="text-blue-400"
              animate={false}
            />
            <AnimatedStatCard
              label="Employees"
              value={employees.length}
              icon={Users}
              iconColor="text-purple-400"
              animate={true}
              duration={1500}
            />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search employees by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-neutral-700 bg-neutral-800 pl-10"
            />
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
              {filteredEmployees.map((emp, index) => (
                <AnimatedCard
                  key={emp.id}
                  onClick={() =>
                    router.push(`/client/manager/employee/${emp.id}`)
                  }
                  gradient="from-blue-500 to-cyan-500"
                  glowColor="blue"
                  className="p-8 transition-all duration-500"
                >
                  {/* Employee Header with Total Pay */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="mb-2 text-2xl font-bold tracking-tight">
                        {emp.first_name} {emp.last_name}
                      </h3>
                      <div className="text-sm text-neutral-400">
                        Weekday: <span className="font-semibold text-neutral-300">${emp.weekday_rate.toFixed(2)}/hr</span> | Sat: <span className="font-semibold text-neutral-300">${emp.saturday_rate.toFixed(2)}/hr</span> | Sun: <span className="font-semibold text-neutral-300">${emp.sunday_rate.toFixed(2)}/hr</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-gradient-to-br from-green-400 to-emerald-400 bg-clip-text text-4xl font-black tabular-nums tracking-tight text-transparent">
                        ${emp.totalPay.toFixed(2)}
                      </div>
                      <div className="mt-1 text-xs text-neutral-500">
                        <span className="text-neutral-400">{formatHoursAndMinutes(emp.rawHours)}</span> → <span className="text-green-400">{formatHoursAndMinutes(emp.totalHours)}</span>
                      </div>
                      <div className="text-xs text-neutral-500">
                        ({emp.breakMinutes} min break)
                      </div>
                    </div>
                  </div>

                  {/* Day Boxes with enhanced styling */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="group/day rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-4 text-center transition-all duration-300 hover:scale-105 hover:border-blue-400/50 hover:from-blue-500/20 hover:to-blue-600/20 hover:shadow-lg hover:shadow-blue-500/20">
                      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-400 group-hover/day:text-neutral-300">
                        Weekday
                      </div>
                      <div className="text-xl font-bold tabular-nums text-blue-300 group-hover/day:text-blue-200">
                        {formatHoursAndMinutes(emp.weekdayHours)}
                      </div>
                    </div>
                    <div className="group/day rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-4 text-center transition-all duration-300 hover:scale-105 hover:border-purple-400/50 hover:from-purple-500/20 hover:to-purple-600/20 hover:shadow-lg hover:shadow-purple-500/20">
                      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-400 group-hover/day:text-neutral-300">
                        Saturday
                      </div>
                      <div className="text-xl font-bold tabular-nums text-purple-300 group-hover/day:text-purple-200">
                        {formatHoursAndMinutes(emp.saturdayHours)}
                      </div>
                    </div>
                    <div className="group/day rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-600/10 p-4 text-center transition-all duration-300 hover:scale-105 hover:border-amber-400/50 hover:from-amber-500/20 hover:to-amber-600/20 hover:shadow-lg hover:shadow-amber-500/20">
                      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-400 group-hover/day:text-neutral-300">
                        Sunday
                      </div>
                      <div className="text-xl font-bold tabular-nums text-amber-300 group-hover/day:text-amber-200">
                        {formatHoursAndMinutes(emp.sundayHours)}
                      </div>
                    </div>
                  </div>

                  {/* Click indicator */}
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span>Click to view details</span>
                    <svg className="h-3 w-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
