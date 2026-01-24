/**
 * Manager Settings Page
 *
 * Central hub for configuring break rules and managing employees.
 * Provides full CRUD (Create, Read, Update, Delete) operations for employees.
 *
 * Features:
 * - Break rules configuration (automatic break deductions by hours worked)
 * - Employee management with full CRUD operations:
 *   - CREATE: Add new employees with EmployeeDialog (mode="add")
 *   - READ: View employee list with pay rates
 *   - UPDATE: Edit employee details with EmployeeDialog (mode="edit")
 *   - DELETE: Remove employees with confirmation dialog
 * - Pay rate management (weekday, Saturday, Sunday rates)
 * - 4-digit PIN assignment with uniqueness validation
 * - Real-time data refresh after operations
 *
 * Components Used:
 * - EmployeeDialog: Reusable modal for add/edit employee operations
 *
 * API Endpoints:
 * - GET /api/client/employees - Fetch all employees
 * - POST /api/client/employees - Create new employee
 * - PUT /api/client/employees/[id] - Update employee
 * - DELETE /api/client/employees/[id] - Delete employee
 * - GET/POST /api/client/break-rules - Fetch/save break rules
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, ArrowLeft, Save, Trash2, Search, Users, Clock } from "lucide-react";
import type { Employee } from "@/types/database";
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
  }, []);

  /**
   * Save break rules
   */
  const handleSaveBreakRules = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/client/break-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        await fetchBreakRules(); // Refresh to confirm save
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
   * Sends DELETE request to API and refreshes employee list on success
   * Shows confirmation dialog before deletion (cannot be undone)
   */
  const handleDeleteEmployee = async (employeeId: string) => {
    // Confirm deletion with user (this action is irreversible)
    if (
      !confirm(
        "Are you sure you want to delete this employee? This action cannot be undone.",
      )
    )
      return;

    try {
      // Send DELETE request to API
      const response = await fetch(`/api/client/employees/${employeeId}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (response.ok && data.success) {
        alert("Employee deleted successfully!");
        // Refresh employee list to reflect deletion
        await fetchEmployees();
      } else {
        alert(`Failed to delete employee: ${data.error ?? "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Failed to delete employee");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-96 w-96 animate-pulse rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute -right-40 bottom-20 h-[500px] w-[500px] animate-pulse rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      {/* Header - Matching Dashboard Style */}
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
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="space-y-2"
                >
                  <Label htmlFor="underFive" className="text-sm font-medium">
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
                      className="border-neutral-700 bg-neutral-800/50 backdrop-blur-sm transition-all focus:border-primary/50"
                    />
                    <span className="text-sm text-neutral-400">min</span>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="space-y-2"
                >
                  <Label htmlFor="fiveToSeven" className="text-sm font-medium">
                    5-7 hours
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
                      className="border-neutral-700 bg-neutral-800/50 backdrop-blur-sm transition-all focus:border-primary/50"
                    />
                    <span className="text-sm text-neutral-400">min</span>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="space-y-2"
                >
                  <Label htmlFor="overSeven" className="text-sm font-medium">
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

          {/* Employees Section - CRUD Management */}
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
              {/* Add Employee Button - Opens dialog in 'add' mode */}
              <EmployeeDialog mode="add" onSuccess={fetchEmployees} />
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
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-neutral-800 bg-neutral-900/50 py-12 text-center text-neutral-400"
              >
                <Users className="mx-auto mb-4 h-16 w-16 text-neutral-600" />
                <p>No employees found. Click &quot;Add Employee&quot; to get started.</p>
              </motion.div>
            ) : (
              /* Employee List */
              <div className="space-y-3">
                {employees
                  .filter((emp) => {
                    // Filter employees based on search query
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    const fullName =
                      `${emp.first_name} ${emp.last_name}`.toLowerCase();
                    return fullName.includes(query);
                  })
                  .map((emp, index) => (
                    <motion.div
                      key={emp.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01, x: 5 }}
                      className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-neutral-900/80"
                    >
                      {/* Employee Info Display */}
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {emp.first_name} {emp.last_name}
                        </h3>
                        <div className="mt-1 flex gap-4 text-sm text-neutral-400">
                          <span>
                            Weekday: ${emp.weekday_rate}
                            {emp.pay_type === "day_rate" ? "/day" : "/h"}
                          </span>
                          <span>
                            Saturday: ${emp.saturday_rate}
                            {emp.pay_type === "day_rate" ? "/day" : "/h"}
                          </span>
                          <span>
                            Sunday: ${emp.sunday_rate}
                            {emp.pay_type === "day_rate" ? "/day" : "/h"}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons - Edit & Delete */}
                      <div className="flex gap-2">
                        {/* Edit Button - Opens dialog in 'edit' mode with employee data */}
                        <EmployeeDialog
                          mode="edit"
                          employee={emp}
                          onSuccess={fetchEmployees}
                        />
                        {/* Delete Button - Confirms then deletes employee */}
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
                {/* No search results message */}
                {employees.filter((emp) => {
                  if (!searchQuery.trim()) return true;
                  const query = searchQuery.toLowerCase();
                  const fullName =
                    `${emp.first_name} ${emp.last_name}`.toLowerCase();
                  return fullName.includes(query);
                }).length === 0 && (
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
