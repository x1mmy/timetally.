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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, ArrowLeft, Save, Trash2, Search, Users, Clock, Tag, Pencil, Check, X, ChevronDown } from "lucide-react";
import type { Employee, EmployeeCategory } from "@/types/database";
import { EmployeeDialog } from "./components/EmployeeDialog";
import { motion } from "framer-motion";

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
  const [categoryEmployeeCounts, setCategoryEmployeeCounts] = useState<Record<string, number>>({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Bulk assign state
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("__none__");
  const [bulkApplying, setBulkApplying] = useState(false);
  const [bulkPage, setBulkPage] = useState(0);
  const [bulkOpen, setBulkOpen] = useState(false);
  const BULK_PAGE_SIZE = 10;

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
        for (const cat of data.categories ?? []) {
          counts[cat.id] = cat.employee_count;
        }
        setCategoryEmployeeCounts(counts);
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
          ? "Break rules saved successfully! All existing timesheets have been recalculated with the new rules."
          : "Break rules saved successfully!";
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
    if (!confirm("Are you sure you want to delete this employee? This action cannot be undone."))
      return;

    try {
      const response = await fetch(`/api/client/employees/${employeeId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { success?: boolean; error?: string };

      if (response.ok && data.success) {
        alert("Employee deleted successfully!");
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
      const data = (await response.json()) as { category?: EmployeeCategory; error?: string };
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
    if (!confirm(`Delete category "${name}"? This will unassign all employees from it — employees themselves will not be affected.`))
      return;
    try {
      const response = await fetch(`/api/client/categories/${id}`, { method: "DELETE" });
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
      const data = (await response.json()) as { updated?: number; error?: string };
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
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-96 w-96 animate-pulse rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute -right-40 bottom-20 h-[500px] w-[500px] animate-pulse rounded-full bg-purple-500/5 blur-3xl" />
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
                <Settings className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Manager Settings<span className="text-primary">.</span>
                </h1>
                <p className="text-sm text-neutral-400">
                  Configure break rules and manage employees
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="outline"
                onClick={() => router.push("/client/manager/dashboard")}
                className="border-neutral-700 bg-neutral-800/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-neutral-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container relative mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-8">

          {/* Break Rules Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-neutral-800 bg-linear-to-br from-neutral-900/90 to-neutral-900/50 p-6 backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 ring-1 ring-blue-500/20">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Break Rules</h2>
                <p className="text-sm text-neutral-400">
                  Configure automatic break deductions based on hours worked
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                  <Label htmlFor="underFive" className="text-sm font-medium">Under 5 hours</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="underFive"
                      type="number"
                      min="0"
                      value={breakRules.underFiveHours}
                      onChange={(e) => setBreakRules({ ...breakRules, underFiveHours: parseInt(e.target.value) || 0 })}
                      className="border-neutral-700 bg-neutral-800/50 backdrop-blur-sm transition-all focus:border-primary/50"
                    />
                    <span className="text-sm text-neutral-400">min</span>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                  <Label htmlFor="fiveToSeven" className="text-sm font-medium">5-7 hours</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="fiveToSeven"
                      type="number"
                      min="0"
                      value={breakRules.fiveToSevenHours}
                      onChange={(e) => setBreakRules({ ...breakRules, fiveToSevenHours: parseInt(e.target.value) || 0 })}
                      className="border-neutral-700 bg-neutral-800/50 backdrop-blur-sm transition-all focus:border-primary/50"
                    />
                    <span className="text-sm text-neutral-400">min</span>
                  </div>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="space-y-2">
                  <Label htmlFor="overSeven" className="text-sm font-medium">Over 7 hours</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="overSeven"
                      type="number"
                      min="0"
                      value={breakRules.overSevenHours}
                      onChange={(e) => setBreakRules({ ...breakRules, overSevenHours: parseInt(e.target.value) || 0 })}
                      className="border-neutral-700 bg-neutral-800/50 backdrop-blur-sm transition-all focus:border-primary/50"
                    />
                    <span className="text-sm text-neutral-400">min</span>
                  </div>
                </motion.div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleSaveBreakRules}
                  disabled={saving}
                  className="bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Break Rules"}
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Categories Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl border border-neutral-800 bg-linear-to-br from-neutral-900/90 to-neutral-900/50 p-6 backdrop-blur-sm"
          >
            <div className="mb-1 flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 ring-1 ring-blue-500/20">
                <Tag className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold">Categories</h2>
            </div>
            <p className="mb-4 text-xs italic text-neutral-500">
              * Categories are used to organise and filter staff on the payroll dashboard. Each employee can belong to one category.
            </p>

            {/* Category list */}
            <div className="mb-3 space-y-2">
              {categories.length === 0 && (
                <p className="text-sm text-neutral-500">No categories yet. Add one below.</p>
              )}
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3"
                >
                  {renamingId === cat.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleRenameCategory(cat.id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="h-7 border-neutral-700 bg-neutral-800 text-sm"
                      />
                      <button
                        onClick={() => void handleRenameCategory(cat.id)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setRenamingId(null)}
                        className="text-neutral-500 hover:text-neutral-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cat.name}</span>
                        <span className="text-xs text-neutral-500">
                          {categoryEmployeeCounts[cat.id] ?? 0} employee{(categoryEmployeeCounts[cat.id] ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setRenamingId(cat.id); setRenameValue(cat.name); }}
                          className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
                        >
                          <Pencil className="h-3 w-3" /> Rename
                        </button>
                        <button
                          onClick={() => void handleDeleteCategory(cat.id, cat.name)}
                          className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-red-400 hover:border-red-900 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add category */}
            <div className="flex gap-2">
              <Input
                placeholder="New category name…"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleAddCategory(); }}
                className="border-neutral-700 bg-neutral-800/50 backdrop-blur-sm focus:border-primary/50"
              />
              <Button
                onClick={handleAddCategory}
                disabled={addingCategory || !newCategoryName.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                + Add
              </Button>
            </div>
            <p className="mt-2 text-xs italic text-neutral-600">
              * Deleting a category unassigns all employees from it — employees themselves are not affected.
            </p>

            {/* Bulk assign section */}
            {employees.length > 0 && (
              <div className="mt-6 border-t border-neutral-800 pt-5">
                <button
                  onClick={() => setBulkOpen((o) => !o)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-400">Bulk assign employees to categories</p>
                    <p className="text-xs italic text-neutral-600">
                      * You can also assign a category individually via the employee edit dialog.
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${bulkOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {bulkOpen && (
                <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wide text-neutral-500">
                        <th className="py-2 pr-3 w-8">
                          <input
                            type="checkbox"
                            checked={selectedEmployeeIds.size === employees.length && employees.length > 0}
                            onChange={toggleSelectAll}
                            className="accent-blue-500"
                          />
                        </th>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Pay type</th>
                        <th className="py-2 pr-4">Current category</th>
                        <th className="py-2">Change to</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.slice(bulkPage * BULK_PAGE_SIZE, (bulkPage + 1) * BULK_PAGE_SIZE).map((emp) => (
                        <tr
                          key={emp.id}
                          className="border-b border-neutral-800/50 text-neutral-400 hover:bg-neutral-800/20"
                        >
                          <td className="py-2 pr-3">
                            <input
                              type="checkbox"
                              checked={selectedEmployeeIds.has(emp.id)}
                              onChange={() => toggleEmployeeSelection(emp.id)}
                              className="accent-blue-500"
                            />
                          </td>
                          <td className="py-2 pr-4 text-neutral-200">
                            {emp.first_name} {emp.last_name}
                          </td>
                          <td className="py-2 pr-4">
                            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${emp.pay_type === "day_rate" ? "bg-neutral-800 text-green-400" : "bg-neutral-800 text-blue-400"}`}>
                              {emp.pay_type === "day_rate" ? "Day Rate" : "Hourly"}
                            </span>
                          </td>
                          <td className="py-2 pr-4">
                            {emp.category ? (
                              <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-blue-400">
                                {emp.category.name}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-600">—</span>
                            )}
                          </td>
                          <td className="py-2">
                            <select
                              value={emp.category_id ?? "__none__"}
                              onChange={async (e) => {
                                const catId = e.target.value === "__none__" ? null : e.target.value;
                                await fetch(`/api/client/employees/${emp.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ categoryId: catId }),
                                });
                                await fetchEmployees();
                                await fetchCategories();
                              }}
                              className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-300"
                            >
                              <option value="__none__">— None —</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
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
                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      {bulkPage * BULK_PAGE_SIZE + 1}–{Math.min((bulkPage + 1) * BULK_PAGE_SIZE, employees.length)} of {employees.length}
                    </span>
                    <div className="flex gap-1">
                      <button
                        disabled={bulkPage === 0}
                        onClick={() => setBulkPage((p) => p - 1)}
                        className="rounded border border-neutral-700 bg-neutral-800 px-2 py-0.5 hover:bg-neutral-700 disabled:opacity-30"
                      >
                        ‹ Prev
                      </button>
                      <button
                        disabled={(bulkPage + 1) * BULK_PAGE_SIZE >= employees.length}
                        onClick={() => setBulkPage((p) => p + 1)}
                        className="rounded border border-neutral-700 bg-neutral-800 px-2 py-0.5 hover:bg-neutral-700 disabled:opacity-30"
                      >
                        Next ›
                      </button>
                    </div>
                  </div>
                )}

                {/* Bulk footer */}
                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-neutral-800/50 pt-3">
                  <span className="text-xs text-neutral-500">
                    {selectedEmployeeIds.size} selected
                  </span>
                  <span className="text-xs text-neutral-600">assign to:</span>
                  <select
                    value={bulkCategoryId}
                    onChange={(e) => setBulkCategoryId(e.target.value)}
                    className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-300"
                  >
                    <option value="__none__">— Remove category —</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkAssign}
                    disabled={selectedEmployeeIds.size === 0 || bulkApplying}
                    className="rounded border border-blue-900 bg-blue-950 px-3 py-1 text-xs font-medium text-blue-400 hover:bg-blue-900/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {bulkApplying ? "Applying…" : "Apply to selected"}
                  </button>
                </div>
                </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Employees Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-neutral-800 bg-linear-to-br from-neutral-900/90 to-neutral-900/50 p-6 backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-500/10 p-2 ring-1 ring-purple-500/20">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold">Employees</h2>
              </div>
              <EmployeeDialog mode="add" onSuccess={fetchEmployees} categories={categories} />
            </div>

            {/* Search Input */}
            {!loading && employees.length > 0 && (
              <div className="relative mb-4">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search employees by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-neutral-700 bg-neutral-800/50 pl-10 backdrop-blur-sm transition-all focus:border-primary/50"
                />
              </div>
            )}

            {/* Loading State */}
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
            ) : employees.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-neutral-800 bg-neutral-900/50 py-12 text-center text-neutral-400"
              >
                <Users className="mx-auto mb-4 h-16 w-16 text-neutral-600" />
                <p>No employees found. Click &quot;Add Employee&quot; to get started.</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredEmployees.map((emp, index) => (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01, x: 5 }}
                    className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-neutral-900/80"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {emp.first_name} {emp.last_name}
                        </h3>
                        {emp.category && (
                          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-blue-400">
                            {emp.category.name}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-400">
                        <span>Weekday: ${emp.weekday_rate}{emp.pay_type === "day_rate" ? "/day" : "/h"}</span>
                        <span>Saturday: ${emp.saturday_rate}{emp.pay_type === "day_rate" ? "/day" : "/h"}</span>
                        <span>Sunday: ${emp.sunday_rate}{emp.pay_type === "day_rate" ? "/day" : "/h"}</span>
                        <span>PH: ${(emp.public_holiday_rate as number | undefined) ?? emp.weekday_rate * 2}{emp.pay_type === "day_rate" ? "/day" : "/h"}</span>
                        {!(emp.apply_break_rules as boolean | undefined) && (
                          <span className="text-amber-400">No breaks</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <EmployeeDialog
                        mode="edit"
                        employee={emp}
                        onSuccess={async () => { await fetchEmployees(); await fetchCategories(); }}
                        categories={categories}
                      />
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-neutral-700 bg-neutral-800 transition-all hover:border-red-500 hover:bg-red-900/50"
                          onClick={() => handleDeleteEmployee(emp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
                {filteredEmployees.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl border border-neutral-800 bg-neutral-900/50 py-8 text-center text-neutral-400"
                  >
                    No employees found matching &quot;{searchQuery}&quot;
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
