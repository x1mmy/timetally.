/**
 * Manager Settings Page
 *
 * Central hub for configuring break rules and managing employees.
 * Provides full CRUD (Create, Read, Update, Delete) operations for employees.
 *
 * Features:
 * - Break rules configuration (automatic break deductions by hours worked)
 * - Employee categories management (create, rename, delete departments)
 * - Bulk employee category assignment
 * - Employee management with full CRUD operations
 * - Pay rate management (weekday, Saturday, Sunday rates)
 * - 4-digit PIN assignment with uniqueness validation
 * - Real-time data refresh after operations
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChevronDown, ChevronLeft, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAUD } from "@/lib/format";
import type { Employee, EmployeeCategory } from "@/types/database";
import { EmployeeDialog } from "./components/EmployeeDialog";

// Shared classes for this page's segmented controls and text links
const segGroup =
  "inline-flex divide-x divide-input overflow-hidden rounded-lg border border-input bg-card";
const segBtn = (on: boolean): string =>
  cn(
    "min-h-10 px-3 text-[13.5px] transition-colors disabled:opacity-50 sm:min-h-9",
    on
      ? "bg-secondary text-foreground"
      : "text-muted-foreground hover:text-foreground",
  );
const textLink =
  "inline-block py-2 text-sm text-muted-foreground transition-colors hover:text-primary";
const warnLink =
  "inline-block py-2 text-sm text-warn transition-colors hover:text-warn/80";
const selectCls =
  "h-10 rounded-lg border border-input bg-card px-2 text-sm text-foreground outline-none focus-visible:border-primary sm:h-9";

export default function ManagerSettingsPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Break rules state
  const [breakRules, setBreakRules] = useState({
    underFiveHours: 0,
    fiveToSevenHours: 30,
    overSevenHours: 60,
  });

  // Categories state
  const [categories, setCategories] = useState<EmployeeCategory[]>([]);
  const [categoryEmployeeCounts, setCategoryEmployeeCounts] = useState<
    Record<string, number>
  >({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  // rounding in minutes per category (0 = no rounding); backend not connected yet
  const [categoryRounding, setCategoryRounding] = useState<
    Record<string, number>
  >({});

  // Bulk assign state
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(
    new Set(),
  );
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("__none__");
  const [bulkApplying, setBulkApplying] = useState(false);
  const [bulkPage, setBulkPage] = useState(0);
  const [bulkOpen, setBulkOpen] = useState(false);
  const BULK_PAGE_SIZE = 10;

  // Preview panel state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewView, setPreviewView] = useState<"weekly" | "today_only">(
    "weekly",
  );

  // Per-category view update loading state
  const [updatingViewId, setUpdatingViewId] = useState<string | null>(null);

  /**
   * Fetch employees
   */
  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/client/employees");
      const data = (await response.json()) as { employees?: Employee[] };
      if (response.ok) {
        setEmployees(data.employees ?? []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch categories
   */
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/client/categories");
      const data = (await response.json()) as {
        categories?: Array<EmployeeCategory & { employee_count: number }>;
      };
      if (response.ok) {
        setCategories(data.categories ?? []);
        const counts: Record<string, number> = {};
        const rounding: Record<string, number> = {};
        for (const cat of data.categories ?? []) {
          counts[cat.id] = cat.employee_count;
          rounding[cat.id] = cat.clock_in_rounding_minutes;
        }
        setCategoryEmployeeCounts(counts);
        setCategoryRounding(rounding);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  /**
   * Fetch break rules
   */
  const fetchBreakRules = async () => {
    try {
      const response = await fetch("/api/client/break-rules");
      const data = (await response.json()) as {
        rules?: Array<{ min_hours: number; break_minutes: number }>;
      };

      if (response.ok && data.rules) {
        const rules = data.rules;
        const underFive = rules.find((r) => r.min_hours === 0);
        const fiveToSeven = rules.find((r) => r.min_hours === 5);
        const overSeven = rules.find((r) => r.min_hours === 7);

        setBreakRules({
          underFiveHours: underFive?.break_minutes ?? 0,
          fiveToSevenHours: fiveToSeven?.break_minutes ?? 30,
          overSevenHours: overSeven?.break_minutes ?? 30,
        });
      }
    } catch (error) {
      console.error("Error fetching break rules:", error);
    }
  };

  useEffect(() => {
    void fetchEmployees();
    void fetchBreakRules();
    void fetchCategories();
  }, []);

  /**
   * Save break rules
   */
  const handleSaveBreakRules = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/client/break-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          underFiveHours: breakRules.underFiveHours,
          fiveToSevenHours: breakRules.fiveToSevenHours,
          overSevenHours: breakRules.overSevenHours,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        recalculated?: boolean;
      };

      if (response.ok && data.success) {
        const message = data.recalculated
          ? "Break rules saved. All existing timesheets have been recalculated with the new rules."
          : "Break rules saved";
        alert(message);
        await fetchBreakRules();
      } else {
        alert(`Failed to save break rules: ${data.error ?? "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error saving break rules:", error);
      alert("Failed to save break rules");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Delete employee
   */
  const handleDeleteEmployee = async (employeeId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this employee? This action cannot be undone.",
      )
    )
      return;

    try {
      const response = await fetch(`/api/client/employees/${employeeId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (response.ok && data.success) {
        alert("Employee deleted");
        await fetchEmployees();
        await fetchCategories(); // refresh counts
      } else {
        alert(`Failed to delete employee: ${data.error ?? "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Failed to delete employee");
    }
  };

  /**
   * Add category
   */
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    try {
      const response = await fetch("/api/client/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = (await response.json()) as {
        category?: EmployeeCategory;
        error?: string;
      };
      if (response.ok) {
        setNewCategoryName("");
        await fetchCategories();
      } else {
        alert(data.error ?? "Failed to create category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setAddingCategory(false);
    }
  };

  /**
   * Rename category
   */
  const handleRenameCategory = async (id: string) => {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      const response = await fetch(`/api/client/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      const data = (await response.json()) as { error?: string };
      if (response.ok) {
        setRenamingId(null);
        await fetchCategories();
      } else {
        alert(data.error ?? "Failed to rename category");
      }
    } catch (error) {
      console.error("Error renaming category:", error);
    }
  };

  /**
   * Delete category
   */
  const handleDeleteCategory = async (id: string, name: string) => {
    if (
      !confirm(
        `Delete category "${name}"? This will unassign all employees from it. The employees themselves will not be affected.`,
      )
    )
      return;
    try {
      const response = await fetch(`/api/client/categories/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchCategories();
        await fetchEmployees(); // refresh so category badges update
      } else {
        const data = (await response.json()) as { error?: string };
        alert(data.error ?? "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  /**
   * Update dashboard view for a category (auto-saves on toggle)
   */
  const handleUpdateDashboardView = async (
    id: string,
    view: "weekly" | "today_only",
  ) => {
    setUpdatingViewId(id);
    try {
      const response = await fetch(`/api/client/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardView: view }),
      });
      if (response.ok) {
        await fetchCategories();
      } else {
        const data = (await response.json()) as { error?: string };
        alert(data.error ?? "Failed to update view");
      }
    } catch (error) {
      console.error("Error updating dashboard view:", error);
    } finally {
      setUpdatingViewId(null);
    }
  };

  /**
   * Update clock-in rounding for a category (optimistic, auto-saves on change)
   */
  const handleUpdateRounding = async (id: string, minutes: number) => {
    setCategoryRounding((prev) => ({ ...prev, [id]: minutes }));
    try {
      const response = await fetch(`/api/client/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundingMinutes: minutes }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        alert(data.error ?? "Failed to update rounding");
        await fetchCategories();
      }
    } catch (error) {
      console.error("Error updating rounding:", error);
      await fetchCategories();
    }
  };

  /**
   * Bulk assign category
   */
  const handleBulkAssign = async () => {
    if (selectedEmployeeIds.size === 0) return;
    setBulkApplying(true);
    try {
      const categoryId = bulkCategoryId === "__none__" ? null : bulkCategoryId;
      const response = await fetch("/api/client/employees/bulk-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds: Array.from(selectedEmployeeIds),
          categoryId,
        }),
      });
      const data = (await response.json()) as {
        updated?: number;
        error?: string;
      };
      if (response.ok) {
        setSelectedEmployeeIds(new Set());
        await fetchEmployees();
        await fetchCategories();
      } else {
        alert(data.error ?? "Failed to assign category");
      }
    } catch (error) {
      console.error("Error bulk assigning:", error);
    } finally {
      setBulkApplying(false);
    }
  };

  const toggleEmployeeSelection = (id: string) => {
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEmployeeIds.size === employees.length) {
      setSelectedEmployeeIds(new Set());
    } else {
      setSelectedEmployeeIds(new Set(employees.map((e) => e.id)));
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(query);
  });

  return (
    <>
      {/* Header */}
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
              aria-current="page"
              className="bg-secondary"
            >
              Settings
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <button
          type="button"
          onClick={() => router.push("/client/manager/dashboard")}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 py-2 text-sm transition-colors"
        >
          <ChevronLeft className="size-4" strokeWidth={1.5} />
          Back to payroll
        </button>

        <div className="mt-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Break rules, categories and employees
          </p>
        </div>

        <div className="mt-8 max-w-4xl space-y-8">
          {/* Break Rules Section */}
          <section className="border-border space-y-4 border-b pb-8">
            <div>
              <h2 className="text-xl font-semibold">Break rules</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Automatic break deductions based on hours worked
              </p>
            </div>

            <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label
                  htmlFor="underFive"
                  className="text-muted-foreground text-[13px] font-normal"
                >
                  Under 5 hours
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="underFive"
                    type="number"
                    min="0"
                    value={breakRules.underFiveHours}
                    onChange={(e) =>
                      setBreakRules({
                        ...breakRules,
                        underFiveHours: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-24 font-mono tabular-nums"
                  />
                  <span className="text-muted-foreground text-sm">min</span>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label
                  htmlFor="fiveToSeven"
                  className="text-muted-foreground text-[13px] font-normal"
                >
                  5 to 7 hours
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="fiveToSeven"
                    type="number"
                    min="0"
                    value={breakRules.fiveToSevenHours}
                    onChange={(e) =>
                      setBreakRules({
                        ...breakRules,
                        fiveToSevenHours: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-24 font-mono tabular-nums"
                  />
                  <span className="text-muted-foreground text-sm">min</span>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label
                  htmlFor="overSeven"
                  className="text-muted-foreground text-[13px] font-normal"
                >
                  Over 7 hours
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="overSeven"
                    type="number"
                    min="0"
                    value={breakRules.overSevenHours}
                    onChange={(e) =>
                      setBreakRules({
                        ...breakRules,
                        overSevenHours: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-24 font-mono tabular-nums"
                  />
                  <span className="text-muted-foreground text-sm">min</span>
                </div>
              </div>
            </div>

            <Button onClick={handleSaveBreakRules} disabled={saving}>
              {saving ? "Saving…" : "Save break rules"}
            </Button>
          </section>

          {/* Categories Section */}
          <section className="border-border space-y-4 border-b pb-8">
            <div>
              <h2 className="text-xl font-semibold">Categories</h2>
              <p className="text-muted-foreground mt-1 max-w-prose text-sm">
                Organise and filter staff on the payroll dashboard. Each
                employee can belong to one category, and each category controls
                what its employees see on their dashboard.
              </p>
            </div>

            {/* Category list */}
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No categories yet. Add one below.
              </p>
            ) : (
              <ul className="border-border bg-card divide-border divide-y rounded-lg border">
                {categories.map((cat) => (
                  <li key={cat.id} className="grid gap-2 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-3">
                      {renamingId === cat.id ? (
                        <div className="flex flex-1 flex-wrap items-center gap-2 py-1">
                          <Input
                            autoFocus
                            aria-label="Category name"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                void handleRenameCategory(cat.id);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            className="max-w-xs"
                          />
                          <Button
                            onClick={() => void handleRenameCategory(cat.id)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setRenamingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          {/* Name + employee count */}
                          <span className="min-w-0 text-[15px] font-medium">
                            {cat.name}
                            <span className="text-muted-foreground ml-2 font-mono text-[11.5px] font-normal">
                              {categoryEmployeeCounts[cat.id] ?? 0} employee
                              {(categoryEmployeeCounts[cat.id] ?? 0) !== 1
                                ? "s"
                                : ""}
                            </span>
                          </span>

                          {/* Rename + Delete actions */}
                          <span className="flex shrink-0 gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingId(cat.id);
                                setRenameValue(cat.name);
                              }}
                              className={textLink}
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleDeleteCategory(cat.id, cat.name)
                              }
                              className={warnLink}
                            >
                              Delete
                            </button>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Per-category settings: employee view + clock-in rounding */}
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-2 pb-1 text-sm">
                      <span>Employee view</span>
                      <div
                        role="group"
                        aria-label={`Employee view for ${cat.name}`}
                        className={segGroup}
                      >
                        <button
                          type="button"
                          aria-pressed={cat.dashboard_view === "weekly"}
                          disabled={updatingViewId === cat.id}
                          onClick={() => {
                            if (cat.dashboard_view !== "weekly")
                              void handleUpdateDashboardView(cat.id, "weekly");
                          }}
                          className={segBtn(cat.dashboard_view === "weekly")}
                        >
                          Weekly
                        </button>
                        <button
                          type="button"
                          aria-pressed={cat.dashboard_view === "today_only"}
                          disabled={updatingViewId === cat.id}
                          onClick={() => {
                            if (cat.dashboard_view !== "today_only")
                              void handleUpdateDashboardView(
                                cat.id,
                                "today_only",
                              );
                          }}
                          className={segBtn(
                            cat.dashboard_view === "today_only",
                          )}
                        >
                          Clock in/out
                        </button>
                      </div>

                      {cat.dashboard_view === "today_only" && (
                        <>
                          <span>Clock-in rounding</span>
                          <div
                            role="group"
                            aria-label={`Clock-in rounding for ${cat.name}`}
                            className={segGroup}
                          >
                            {[0, 5, 10, 15, 30].map((mins) => {
                              const active =
                                (categoryRounding[cat.id] ?? 0) === mins;
                              return (
                                <button
                                  type="button"
                                  key={mins}
                                  aria-pressed={active}
                                  onClick={() =>
                                    void handleUpdateRounding(cat.id, mins)
                                  }
                                  className={segBtn(active)}
                                >
                                  {mins === 0 ? "Off" : `${mins}m`}
                                </button>
                              );
                            })}
                          </div>
                          {(() => {
                            const selected = categoryRounding[cat.id] ?? 0;
                            if (selected === 0) {
                              return (
                                <span className="text-xs">
                                  Times are recorded exactly as clocked
                                </span>
                              );
                            }
                            const inputMins = 9 * 60 + 3;
                            const roundedMins =
                              Math.ceil(inputMins / selected) * selected;
                            const h = Math.floor(roundedMins / 60);
                            const m = String(roundedMins % 60).padStart(2, "0");
                            return (
                              <span className="text-xs">
                                e.g. 9:03 → {h}:{m} with {selected}m rounding
                              </span>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Add category */}
            <div className="flex max-w-md gap-2">
              <Input
                aria-label="New category name"
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleAddCategory();
                }}
              />
              <Button
                variant="outline"
                onClick={handleAddCategory}
                disabled={addingCategory || !newCategoryName.trim()}
              >
                Add category
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Deleting a category unassigns all employees from it. The employees
              themselves are not affected.
            </p>
          </section>

          {/* Bulk assign section */}
          {employees.length > 0 && (
            <section className="border-border space-y-4 border-b pb-8">
              <div>
                <h2 className="text-xl font-semibold">
                  <button
                    type="button"
                    aria-expanded={bulkOpen}
                    onClick={() => setBulkOpen((o) => !o)}
                    className="hover:text-primary inline-flex min-h-10 items-center gap-2 py-1 text-left transition-colors"
                  >
                    Assign categories in bulk
                    <ChevronDown
                      strokeWidth={1.5}
                      className={cn(
                        "text-muted-foreground size-[18px]",
                        bulkOpen && "rotate-180",
                      )}
                    />
                  </button>
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  You can also assign a category to one employee in the employee
                  edit dialog
                </p>
              </div>

              {bulkOpen && (
                <div className="space-y-3">
                  <div className="border-border bg-card overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-border text-muted-foreground border-b text-left font-mono text-[11px] tracking-[0.1em] uppercase">
                          <th className="w-12 p-0 font-normal">
                            <label className="flex size-11 cursor-pointer items-center justify-center">
                            <input
                              type="checkbox"
                              aria-label="Select all employees"
                              checked={
                                selectedEmployeeIds.size === employees.length &&
                                employees.length > 0
                              }
                              onChange={toggleSelectAll}
                              className="accent-primary size-5 align-middle"
                            />
                            </label>
                          </th>
                          <th className="py-2.5 pr-4 font-normal">Name</th>
                          <th className="hidden py-2.5 pr-4 font-normal sm:table-cell">
                            Pay type
                          </th>
                          <th className="hidden py-2.5 pr-4 font-normal sm:table-cell">
                            Current category
                          </th>
                          <th className="py-2.5 pr-4 font-normal">Change to</th>
                        </tr>
                      </thead>
                      <tbody className="divide-border divide-y">
                        {employees
                          .slice(
                            bulkPage * BULK_PAGE_SIZE,
                            (bulkPage + 1) * BULK_PAGE_SIZE,
                          )
                          .map((emp) => (
                            <tr key={emp.id} className="hover:bg-secondary/50">
                              <td className="p-0">
                                <label className="flex size-11 cursor-pointer items-center justify-center">
                                <input
                                  type="checkbox"
                                  aria-label={`Select ${emp.first_name} ${emp.last_name}`}
                                  checked={selectedEmployeeIds.has(emp.id)}
                                  onChange={() =>
                                    toggleEmployeeSelection(emp.id)
                                  }
                                  className="accent-primary size-5 align-middle"
                                />
                                </label>
                              </td>
                              <td className="py-2 pr-4">
                                {emp.first_name} {emp.last_name}
                                <span className="text-muted-foreground block font-mono text-[11px] sm:hidden">
                                  {emp.category?.name ?? "No category"}
                                </span>
                              </td>
                              <td className="text-muted-foreground hidden py-2 pr-4 sm:table-cell">
                                {emp.pay_type === "day_rate"
                                  ? "Day rate"
                                  : "Hourly"}
                              </td>
                              <td className="hidden py-2 pr-4 sm:table-cell">
                                {emp.category ? (
                                  emp.category.name
                                ) : (
                                  <span className="text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="py-2 pr-4">
                                <select
                                  aria-label={`Category for ${emp.first_name} ${emp.last_name}`}
                                  value={emp.category_id ?? "__none__"}
                                  onChange={async (e) => {
                                    const catId =
                                      e.target.value === "__none__"
                                        ? null
                                        : e.target.value;
                                    await fetch(
                                      `/api/client/employees/${emp.id}`,
                                      {
                                        method: "PUT",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          categoryId: catId,
                                        }),
                                      },
                                    );
                                    await fetchEmployees();
                                    await fetchCategories();
                                  }}
                                  className={cn(selectCls, "max-w-40")}
                                >
                                  <option value="__none__">None</option>
                                  {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {employees.length > BULK_PAGE_SIZE && (
                    <div className="text-muted-foreground flex items-center justify-between gap-3 text-sm">
                      <span className="font-mono text-xs tabular-nums">
                        {bulkPage * BULK_PAGE_SIZE + 1}–
                        {Math.min(
                          (bulkPage + 1) * BULK_PAGE_SIZE,
                          employees.length,
                        )}{" "}
                        of {employees.length}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          disabled={bulkPage === 0}
                          onClick={() => setBulkPage((p) => p - 1)}
                        >
                          ‹ Prev
                        </Button>
                        <Button
                          variant="outline"
                          disabled={
                            (bulkPage + 1) * BULK_PAGE_SIZE >= employees.length
                          }
                          onClick={() => setBulkPage((p) => p + 1)}
                        >
                          Next ›
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Bulk footer */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-muted-foreground font-mono text-xs tabular-nums">
                      {selectedEmployeeIds.size} selected
                    </span>
                    <label
                      htmlFor="bulkCategory"
                      className="text-muted-foreground text-sm"
                    >
                      Assign to
                    </label>
                    <select
                      id="bulkCategory"
                      value={bulkCategoryId}
                      onChange={(e) => setBulkCategoryId(e.target.value)}
                      className={selectCls}
                    >
                      <option value="__none__">No category (remove)</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={handleBulkAssign}
                      disabled={selectedEmployeeIds.size === 0 || bulkApplying}
                    >
                      {bulkApplying ? "Applying…" : "Apply to selected"}
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* View Preview Section */}
          <section className="border-border space-y-4 border-b pb-8">
            <div>
              <h2 className="text-xl font-semibold">
                <button
                  type="button"
                  aria-expanded={previewOpen}
                  onClick={() => setPreviewOpen((o) => !o)}
                  className="hover:text-primary inline-flex min-h-10 items-center gap-2 py-1 text-left transition-colors"
                >
                  Preview employee views
                  <ChevronDown
                    strokeWidth={1.5}
                    className={cn(
                      "text-muted-foreground size-[18px]",
                      previewOpen && "rotate-180",
                    )}
                  />
                </button>
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                See what each view looks like for employees before assigning it
                to a category
              </p>
            </div>

            {previewOpen && (
              <div className="space-y-3">
                {/* View selector */}
                <div role="group" aria-label="Preview" className={segGroup}>
                  <button
                    type="button"
                    aria-pressed={previewView === "weekly"}
                    onClick={() => setPreviewView("weekly")}
                    className={segBtn(previewView === "weekly")}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    aria-pressed={previewView === "today_only"}
                    onClick={() => setPreviewView("today_only")}
                    className={segBtn(previewView === "today_only")}
                  >
                    Clock in/out
                  </button>
                </div>

                {/* Mockup frame */}
                {previewView === "weekly" ? (
                  <div
                    aria-hidden
                    className="border-border bg-background pointer-events-none grid max-w-md gap-2 rounded-lg border p-4"
                  >
                    <div className="mb-1 flex items-baseline justify-between">
                      <span className="font-semibold">Your timesheet</span>
                      <span className="text-muted-foreground text-xs">
                        This week
                      </span>
                    </div>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (day) => (
                        <div
                          key={day}
                          className={cn(
                            "border-border bg-card flex items-center justify-between rounded-lg border px-3 py-2 text-[13px]",
                            day === "Sat" && "bg-sat/[0.06]",
                            day === "Sun" && "bg-sun/[0.06]",
                          )}
                        >
                          <span
                            className={cn(
                              day === "Sat" && "text-sat",
                              day === "Sun" && "text-sun",
                            )}
                          >
                            {day}
                          </span>
                          <span className="text-muted-foreground font-mono tabular-nums">
                            -- : -- to -- : --
                          </span>
                        </div>
                      ),
                    )}
                    <p className="text-muted-foreground mt-1 text-xs">
                      Weekly schedule: 7-day grid with time pickers
                    </p>
                  </div>
                ) : (
                  <div
                    aria-hidden
                    className="border-border bg-background pointer-events-none grid max-w-md justify-items-center gap-2 rounded-lg border p-6 text-center"
                  >
                    <span className="text-4xl font-medium tracking-tight tabular-nums">
                      9:02 am
                    </span>
                    <span className="text-muted-foreground text-[13px]">
                      Today
                    </span>
                    <span
                      className={cn(
                        buttonVariants({ variant: "go", size: "lg" }),
                        "mt-2 w-full max-w-xs",
                      )}
                    >
                      Clock in
                    </span>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Clock in/out: today only, one tap to start and one to
                      finish
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Employees Section */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Employees</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Names, PINs, pay rates and categories
                </p>
              </div>
              <EmployeeDialog
                mode="add"
                onSuccess={fetchEmployees}
                categories={categories}
              />
            </div>

            {/* Search Input */}
            {!loading && employees.length > 0 && (
              <div className="relative sm:w-72">
                <Search
                  strokeWidth={1.5}
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input
                  type="text"
                  aria-label="Search employees"
                  placeholder="Search employees by name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
                <Loader2 strokeWidth={1.5} className="size-4 animate-spin" />
                Loading employees…
              </div>
            ) : employees.length === 0 ? (
              <p className="border-border bg-card text-muted-foreground rounded-lg border px-4 py-10 text-center text-sm">
                No employees yet. Click Add employee to get started.
              </p>
            ) : filteredEmployees.length === 0 ? (
              <p className="border-border bg-card text-muted-foreground rounded-lg border px-4 py-8 text-center text-sm">
                No employees found matching &quot;{searchQuery}&quot;
              </p>
            ) : (
              <ul className="border-border bg-card divide-border divide-y rounded-lg border">
                {filteredEmployees.map((emp) => (
                  <li key={emp.id} className="grid gap-1 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-3">
                      <span className="min-w-0 text-[15px] font-medium">
                        {emp.first_name} {emp.last_name}
                        {emp.category && (
                          <span className="text-muted-foreground ml-2 font-mono text-[11.5px] font-normal">
                            {emp.category.name}
                          </span>
                        )}
                      </span>
                      <span className="flex shrink-0 gap-4">
                        <EmployeeDialog
                          mode="edit"
                          employee={emp}
                          onSuccess={async () => {
                            await fetchEmployees();
                            await fetchCategories();
                          }}
                          categories={categories}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className={warnLink}
                        >
                          Delete
                        </button>
                      </span>
                    </div>
                    <p className="text-muted-foreground pb-1 font-mono text-xs tabular-nums">
                      {emp.pay_type === "day_rate" ? "Day rate" : "Hourly"} ·
                      Weekday {formatAUD(emp.weekday_rate)} · Sat{" "}
                      {formatAUD(emp.saturday_rate)} · Sun{" "}
                      {formatAUD(emp.sunday_rate)} · Public holiday{" "}
                      {formatAUD(
                        (emp.public_holiday_rate as number | undefined) ??
                          emp.weekday_rate * 2,
                      )}
                      {!(emp.apply_break_rules as boolean | undefined) && (
                        <span className="text-warn bg-warn/10 ml-2 inline-block rounded-lg px-1.5 py-0.5 text-[11px]">
                          No breaks
                        </span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
