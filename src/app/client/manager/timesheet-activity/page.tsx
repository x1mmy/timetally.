/**
 * Manager Timesheet Activity / Edit Log
 * Shows audit log of timesheet edits and deletions (who changed what, when).
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, LogOut, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { motion } from "framer-motion";
import { convert24to12 } from "@/lib/timeUtils";
import type { Employee } from "@/types/database";

interface LogEntry {
  id: string;
  timesheet_id: string | null;
  employee_id: string;
  work_date: string;
  action: "edit" | "delete";
  edited_at: string;
  edited_by: "employee" | "manager";
  previous_start_time: string | null;
  previous_end_time: string | null;
  new_start_time: string | null;
  new_end_time: string | null;
  employee: { first_name: string; last_name: string } | null;
}

/** Normalise DB time to HH:MM for convert24to12 */
function toAmPm(t: string | null): string {
  if (!t) return "—";
  const s = String(t).trim();
  const part = s.slice(0, 5);
  if (!/^\d{1,2}:\d{2}$/.test(part)) return "—";
  return convert24to12(part);
}

/** Format "HH:MM – HH:MM" in AM/PM */
function timeRangeAmPm(start: string | null, end: string | null): string {
  if (!start && !end) return "—";
  return `${toAmPm(start)} – ${toAmPm(end)}`;
}

export default function TimesheetActivityPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (filterEmployeeId) params.set("employeeId", filterEmployeeId);
      if (filterStartDate) params.set("startDate", filterStartDate);
      if (filterEndDate) params.set("endDate", filterEndDate);
      const res = await fetch(`/api/client/timesheet-edit-log?${params}`);
      const data = (await res.json()) as { logs?: LogEntry[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to load activity");
        return;
      }
      setLogs(data.logs ?? []);
    } catch {
      setError("Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [filterEmployeeId, filterStartDate, filterEndDate]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await fetch("/api/client/employees");
        const data = (await res.json()) as { employees?: Employee[] };
        setEmployees(data.employees ?? []);
      } catch {
        // ignore
      }
    };
    void loadEmployees();
  }, []);

  const setQuickRange = (range: "week" | "2weeks" | "month") => {
    const today = new Date();
    if (range === "week") {
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const end = endOfWeek(today, { weekStartsOn: 1 });
      setFilterStartDate(format(start, "yyyy-MM-dd"));
      setFilterEndDate(format(end, "yyyy-MM-dd"));
    } else if (range === "2weeks") {
      setFilterStartDate(format(subDays(today, 14), "yyyy-MM-dd"));
      setFilterEndDate(format(today, "yyyy-MM-dd"));
    } else {
      setFilterStartDate(format(subDays(today, 30), "yyyy-MM-dd"));
      setFilterEndDate(format(today, "yyyy-MM-dd"));
    }
  };

  const clearFilters = () => {
    setFilterEmployeeId("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  const handleLogout = () => {
    document.cookie = "manager_session=; Max-Age=0; path=/";
    router.push("/client");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-96 w-96 animate-pulse rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute -right-40 bottom-20 h-[500px] w-[500px] animate-pulse rounded-full bg-blue-400/5 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/client/manager/dashboard")}
                className="text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="rounded-xl bg-primary/10 p-2 ring-2 ring-primary/20">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  Timesheet activity
                </h1>
                <p className="text-sm text-neutral-400">
                  Edits and deletions by staff or manager
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400">
            {error}
          </div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
        >
          <div className="flex items-center gap-2 text-neutral-400">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter</span>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Employee</label>
            <select
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Work day from</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Work day to</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange("week")}
              className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
            >
              This week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange("2weeks")}
              className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
            >
              Last 14 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange("month")}
              className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
            >
              Last 30 days
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-neutral-400 hover:text-white"
          >
            Clear
          </Button>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12 text-neutral-400">
            Loading...
          </div>
        ) : logs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-neutral-400"
          >
            No timesheet edits or deletions match the filters.
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-700 bg-neutral-800/80">
                    <th className="px-4 py-3 font-medium text-neutral-300">Date</th>
                    <th className="px-4 py-3 font-medium text-neutral-300">Employee</th>
                    <th className="px-4 py-3 font-medium text-neutral-300">Work day</th>
                    <th className="px-4 py-3 font-medium text-neutral-300">Action</th>
                    <th className="px-4 py-3 font-medium text-neutral-300">By</th>
                    <th className="px-4 py-3 font-medium text-neutral-300">Previous times</th>
                    <th className="px-4 py-3 font-medium text-neutral-300">New times</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const name = log.employee
                      ? `${log.employee.first_name} ${log.employee.last_name}`.trim()
                      : "—";
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-neutral-800 hover:bg-neutral-800/50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-400">
                          {format(new Date(log.edited_at), "dd MMM yyyy, h:mm a")}
                        </td>
                        <td className="px-4 py-3 font-medium">{name}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-300">
                          {format(new Date(log.work_date), "EEE d MMM")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              log.action === "delete"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-primary/20 text-primary"
                            }`}
                          >
                            {log.action === "delete" ? "Deleted" : "Edited"}
                          </span>
                        </td>
                        <td className="px-4 py-3 capitalize text-neutral-400">
                          {log.edited_by}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-400">
                          {timeRangeAmPm(log.previous_start_time, log.previous_end_time)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-300">
                          {log.action === "delete"
                            ? "—"
                            : timeRangeAmPm(log.new_start_time, log.new_end_time)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
