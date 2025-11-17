/**
 * Manager Dashboard Page
 * Main dashboard for managers to view and manage employee data
 * Features:
 * - View all employee timesheets
 * - Filter by week
 * - Add new employees
 * - Export to CSV
 * - Weekly summary view
 */
'use client'

import { useEffect, useState } from 'react'
import { WeekNavigator } from '@/components/WeekNavigator'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Shield, Download, UserPlus } from 'lucide-react'
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns'
import type { TimesheetWithEmployee } from '@/types/database'

export default function ManagerDashboardPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  )
  const [timesheets, setTimesheets] = useState<TimesheetWithEmployee[]>([])
  const [loading, setLoading] = useState(true)

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })

  /**
   * Fetch timesheets for current week
   */
  const fetchTimesheets = async () => {
    try {
      setLoading(true)

      const startDate = format(currentWeekStart, 'yyyy-MM-dd')
      const endDate = format(weekEnd, 'yyyy-MM-dd')

      const response = await fetch(
        `/api/client/timesheets?startDate=${startDate}&endDate=${endDate}`
      )
      const data = await response.json()

      if (response.ok) {
        setTimesheets(data.timesheets || [])
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch timesheets when week changes
  useEffect(() => {
    fetchTimesheets()
  }, [currentWeekStart])

  /**
   * Navigate to previous week
   */
  const handlePreviousWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, -1))
  }

  /**
   * Navigate to next week
   */
  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1))
  }

  /**
   * Export timesheets to CSV
   */
  const handleExportCSV = () => {
    // Generate CSV content
    const headers = ['Employee Number', 'Name', 'Date', 'Start Time', 'End Time', 'Break (min)', 'Total Hours', 'Notes']
    const rows = timesheets.map(ts => [
      ts.employee.employee_number,
      `${ts.employee.first_name} ${ts.employee.last_name}`,
      ts.work_date,
      ts.start_time,
      ts.end_time,
      ts.break_minutes.toString(),
      ts.total_hours.toString(),
      ts.notes || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timesheets_${format(currentWeekStart, 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  /**
   * Calculate total hours for the week
   */
  const totalHours = timesheets.reduce((sum, ts) => sum + parseFloat(ts.total_hours.toString()), 0)

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="border-b border-neutral-700 bg-neutral-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Manager Dashboard</h1>
                <p className="text-sm text-neutral-400">Employee Timesheet Management</p>
              </div>
            </div>

            <div className="flex gap-2">
              {/* Add Employee Button */}
              <Button
                variant="outline"
                className="bg-neutral-700 border-neutral-600 hover:bg-neutral-600"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>

              {/* Export CSV Button */}
              <Button
                onClick={handleExportCSV}
                disabled={timesheets.length === 0}
                className="bg-primary hover:bg-primary-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
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
            onPrevious={handlePreviousWeek}
            onNext={handleNextWeek}
          />

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-neutral-800 rounded-lg border border-neutral-700">
              <p className="text-sm text-neutral-400">Total Timesheets</p>
              <p className="text-3xl font-bold">{timesheets.length}</p>
            </div>
            <div className="p-6 bg-neutral-800 rounded-lg border border-neutral-700">
              <p className="text-sm text-neutral-400">Total Hours</p>
              <p className="text-3xl font-bold">{totalHours.toFixed(2)}</p>
            </div>
            <div className="p-6 bg-neutral-800 rounded-lg border border-neutral-700">
              <p className="text-sm text-neutral-400">Employees Active</p>
              <p className="text-3xl font-bold">
                {new Set(timesheets.map(ts => ts.employee_id)).size}
              </p>
            </div>
          </div>

          {/* Timesheets Table */}
          <div className="rounded-lg border border-neutral-700 bg-neutral-800">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-700">
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-neutral-400">
                      Loading timesheets...
                    </TableCell>
                  </TableRow>
                ) : timesheets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-neutral-400">
                      No timesheets for this week
                    </TableCell>
                  </TableRow>
                ) : (
                  timesheets.map((ts) => (
                    <TableRow key={ts.id} className="border-neutral-700">
                      <TableCell className="font-medium">
                        {ts.employee.first_name} {ts.employee.last_name}
                        <div className="text-xs text-neutral-400">
                          #{ts.employee.employee_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(ts.work_date), 'EEE, MMM d')}
                      </TableCell>
                      <TableCell>{ts.start_time}</TableCell>
                      <TableCell>{ts.end_time}</TableCell>
                      <TableCell>{ts.break_minutes} min</TableCell>
                      <TableCell className="font-semibold">
                        {parseFloat(ts.total_hours.toString()).toFixed(2)} hrs
                      </TableCell>
                      <TableCell className="text-neutral-400 text-sm">
                        {ts.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  )
}
