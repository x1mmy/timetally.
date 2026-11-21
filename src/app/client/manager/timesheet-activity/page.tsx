/**
 * Manager Timesheet Activity / Edit Log
 * Shows audit log of timesheet edits and deletions (who changed what, when).
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "~/lib/utils";
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

  const hasFilters = !!(filterEmployeeId || filterStartDate || filterEndDate);

  return (
    <>
      <header className="bg-card border-border border-b">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex flex-wrap items-center gap-2">
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
        <div>
          <button
            type="button"
            onClick={() => router.push("/client/manager/dashboard")}
            className="text-muted-foreground hover:text-primary focus-visible:ring-ring inline-block rounded-sm py-2 text-sm transition-colors outline-none focus-visible:ring-2"
          >
            ‹ Back to payroll
          </button>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Timesheet activity
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Edits and deletions by staff or manager
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="bg-warn/10 text-warn rounded-lg px-3 py-2 text-sm"
          >
            {error}
          </p>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-0 gap-1">
            <label
              htmlFor="activity-employee"
              className="text-muted-foreground text-[12.5px]"
            >
              Employee
            </label>
            <select
              id="activity-employee"
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              className={field}
            >
              <option value="">All employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid min-w-0 gap-1">
            <label
              htmlFor="activity-from"
              className="text-muted-foreground text-[12.5px]"
            >
              From
            </label>
            <input
              id="activity-from"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className={cn(field, "font-mono text-[13.5px]")}
            />
          </div>
          <div className="grid min-w-0 gap-1">
            <label
              htmlFor="activity-to"
              className="text-muted-foreground text-[12.5px]"
            >
              To
            </label>
            <input
              id="activity-to"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className={cn(field, "font-mono text-[13.5px]")}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => setQuickRange("week")}
            >
              This week
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => setQuickRange("2weeks")}
            >
              Last 14 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => setQuickRange("month")}
            >
              Last 30 days
            </Button>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-primary focus-visible:ring-ring inline-block rounded-sm py-2 text-sm transition-colors outline-none focus-visible:ring-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
            <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
            Loading…
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-card border-border text-muted-foreground rounded-lg border px-4 py-10 text-center text-sm">
            No timesheet edits or deletions match the filters
          </div>
        ) : (
          <>
            {/* sm and up: table */}
            <div className="bg-card border-border hidden overflow-x-auto rounded-lg border sm:block">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-border border-b">
                    <th className={th}>When</th>
                    <th className={th}>Employee</th>
                    <th className={th}>Shift date</th>
                    <th className={th}>Change</th>
                    <th className={th}>Times</th>
                    <th className={th}>By</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:last-child>td]:border-b-0">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className={cn(td, "whitespace-nowrap")}>
                        {format(new Date(log.edited_at), "EEE d MMM yyyy")}
                        <span className={sub}>
                          {format(new Date(log.edited_at), "h:mm a")}
                        </span>
                      </td>
                      <td className={cn(td, "font-sans text-sm font-medium")}>
                        {employeeName(log)}
                      </td>
                      <td className={cn(td, "whitespace-nowrap")}>
                        {format(new Date(log.work_date), "EEE d MMM")}
                      </td>
                      <td className={td}>
                        <ChangeTag action={log.action} />
                      </td>
                      <td className={cn(td, "whitespace-nowrap")}>
                        <TimesChange log={log} />
                      </td>
                      <td
                        className={cn(
                          td,
                          "text-muted-foreground font-sans text-sm capitalize",
                        )}
                      >
                        {log.edited_by}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Below sm: stacked cards */}
            <div className="bg-card border-border divide-border divide-y rounded-lg border sm:hidden">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-3 gap-x-3 gap-y-2.5 px-4 py-3.5"
                >
                  <p className="col-span-3 text-[15px] font-medium">
                    {employeeName(log)}
                  </p>
                  <div className="min-w-0">
                    <p className={micro}>When</p>
                    <p className="font-mono text-[13px] tabular-nums">
                      {format(new Date(log.edited_at), "d MMM")}
                    </p>
                    <p className={sub}>
                      {format(new Date(log.edited_at), "h:mm a")}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className={micro}>Shift date</p>
                    <p className="font-mono text-[13px] tabular-nums">
                      {format(new Date(log.work_date), "EEE d MMM")}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className={micro}>Change</p>
                    <ChangeTag action={log.action} />
                  </div>
                  <div className="col-span-2 min-w-0">
                    <p className={micro}>Times</p>
                    <p className="font-mono text-[13px] tabular-nums">
                      <TimesChange log={log} />
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className={micro}>By</p>
                    <p className="text-muted-foreground text-sm capitalize">
                      {log.edited_by}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}

function employeeName(log: LogEntry): string {
  return log.employee
    ? `${log.employee.first_name} ${log.employee.last_name}`.trim()
    : "—";
}

function ChangeTag({ action }: { action: LogEntry["action"] }) {
  return action === "delete" ? (
    <span className="text-warn bg-warn/10 rounded-lg px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap">
      Deleted
    </span>
  ) : (
    <span className="border-input text-muted-foreground rounded-lg border px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap">
      Edited
    </span>
  );
}

/** Old range struck through, then the new one (none for a deletion) */
function TimesChange({ log }: { log: LogEntry }) {
  const previous = timeRangeAmPm(
    log.previous_start_time,
    log.previous_end_time,
  );
  const next =
    log.action === "delete"
      ? null
      : timeRangeAmPm(log.new_start_time, log.new_end_time);
  return (
    <>
      <span className="text-muted-foreground line-through">{previous}</span>
      {next && <> → {next}</>}
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
/** Native select / date input, styled like <Input> */
const field =
  "bg-card text-foreground border-input focus-visible:border-primary focus-visible:ring-primary/15 h-10 min-w-0 rounded-lg border px-3 text-sm transition-[border-color,box-shadow] outline-none focus-visible:ring-[3px]";
