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
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, ArrowLeft, Save, Trash2 } from 'lucide-react'
import type { Employee } from '@/types/database'
import { EmployeeDialog } from './components/EmployeeDialog'

export default function ManagerSettingsPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Break rules state
  const [breakRules, setBreakRules] = useState({
    underFiveHours: 0,
    fiveToSevenHours: 30,
    overSevenHours: 60,
  })

  /**
   * Fetch employees
   */
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/client/employees')
      const data = await response.json() as { employees?: Employee[] }

      if (response.ok) {
        setEmployees(data.employees ?? [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch break rules
   */
  const fetchBreakRules = async () => {
    try {
      const response = await fetch('/api/client/break-rules')
      const data = await response.json() as {
        rules?: Array<{ min_hours: number; break_minutes: number }>
      }

      if (response.ok && data.rules) {
        const rules = data.rules
        const underFive = rules.find((r) => r.min_hours === 0)
        const fiveToSeven = rules.find((r) => r.min_hours === 5)
        const overSeven = rules.find((r) => r.min_hours === 7)

        setBreakRules({
          underFiveHours: underFive?.break_minutes ?? 0,
          fiveToSevenHours: fiveToSeven?.break_minutes ?? 30,
          overSevenHours: overSeven?.break_minutes ?? 30,
        })
      }
    } catch (error) {
      console.error('Error fetching break rules:', error)
    }
  }

  useEffect(() => {
    void fetchEmployees()
    void fetchBreakRules()
  }, [])

  /**
   * Save break rules
   */
  const handleSaveBreakRules = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/client/break-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          underFiveHours: breakRules.underFiveHours,
          fiveToSevenHours: breakRules.fiveToSevenHours,
          overSevenHours: breakRules.overSevenHours,
        }),
      })

      const data = await response.json() as { success?: boolean; error?: string }

      if (response.ok && data.success) {
        alert('Break rules saved successfully!')
        await fetchBreakRules() // Refresh to confirm save
      } else {
        alert(`Failed to save break rules: ${data.error ?? 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving break rules:', error)
      alert('Failed to save break rules')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Delete employee
   * Sends DELETE request to API and refreshes employee list on success
   * Shows confirmation dialog before deletion (cannot be undone)
   */
  const handleDeleteEmployee = async (employeeId: string) => {
    // Confirm deletion with user (this action is irreversible)
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return

    try {
      // Send DELETE request to API
      const response = await fetch(`/api/client/employees/${employeeId}`, {
        method: 'DELETE',
      })

      const data = await response.json() as { success?: boolean; error?: string }

      if (response.ok && data.success) {
        alert('Employee deleted successfully!')
        // Refresh employee list to reflect deletion
        await fetchEmployees()
      } else {
        alert(`Failed to delete employee: ${data.error ?? 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('Failed to delete employee')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="border-b border-neutral-700 bg-neutral-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Manager Settings</h1>
                <p className="text-sm text-neutral-400">
                  Configure break rules and manage employees
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => router.push('/client/manager/dashboard')}
            className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2 " />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Break Rules Section */}
          <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Break Rules</h2>
            <p className="text-sm text-neutral-400 mb-6">
              Configure automatic break deductions based on hours worked
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="underFive">Under 5 hours</Label>
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
                      className="bg-neutral-700 border-neutral-600"
                    />
                    <span className="text-sm text-neutral-400">min</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fiveToSeven">5-7 hours</Label>
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
                      className="bg-neutral-700 border-neutral-600"
                    />
                    <span className="text-sm text-neutral-400">min</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overSeven">Over 7 hours</Label>
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
                      className="bg-neutral-700 border-neutral-600"
                    />
                    <span className="text-sm text-neutral-400">min</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveBreakRules}
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Break Rules'}
              </Button>
            </div>
          </div>

          {/* Employees Section - CRUD Management */}
          <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Employees</h2>
              {/* Add Employee Button - Opens dialog in 'add' mode */}
              <EmployeeDialog mode="add" onSuccess={fetchEmployees} />
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-8 text-neutral-400">
                Loading employees...
              </div>
            ) : employees.length === 0 ? (
              /* Empty State */
              <div className="text-center py-8 text-neutral-400">
                No employees found. Click &quot;Add Employee&quot; to get started.
              </div>
            ) : (
              /* Employee List */
              <div className="space-y-3">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg border border-neutral-600"
                  >
                    {/* Employee Info Display */}
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {emp.first_name} {emp.last_name}
                      </h3>
                      <div className="flex gap-4 mt-1 text-sm text-neutral-400">
                        <span>Weekday: ${emp.weekday_rate}/h</span>
                        <span>Saturday: ${emp.saturday_rate}/h</span>
                        <span>Sunday: ${emp.sunday_rate}/h</span>
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-neutral-800 border-neutral-700 hover:bg-red-900/50 hover:border-red-500"
                        onClick={() => handleDeleteEmployee(emp.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
