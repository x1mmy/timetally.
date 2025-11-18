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
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WeekNavigator } from '@/components/WeekNavigator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DollarSign, Search, LogOut, Settings, Users, Clock } from 'lucide-react'
import { startOfWeek, endOfWeek, addWeeks, format, getDay } from 'date-fns'
import type { Employee, TimesheetWithEmployee } from '@/types/database'

interface EmployeeWithPay extends Employee {
  weekdayHours: number
  saturdayHours: number
  sundayHours: number
  totalPay: number
  totalHours: number
  rawHours: number // Total hours before break deductions
  breakMinutes: number // Total break minutes
}

export default function ManagerDashboardPage() {
  const router = useRouter()
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [employees, setEmployees] = useState<EmployeeWithPay[]>([])
  const [timesheets, setTimesheets] = useState<TimesheetWithEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })

  /**
   * Calculate day type (weekday, saturday, sunday)
   */
  const getDayType = (dateString: string): 'weekday' | 'saturday' | 'sunday' => {
    const date = new Date(dateString)
    const dayOfWeek = getDay(date)

    if (dayOfWeek === 0) return 'sunday'
    if (dayOfWeek === 6) return 'saturday'
    return 'weekday'
  }

  /**
   * Fetch employees
   */
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/client/employees')
      const data = await response.json()

      if (response.ok) {
        return data.employees || []
      }
      return []
    } catch (error) {
      console.error('Error fetching employees:', error)
      return []
    }
  }

  /**
   * Fetch timesheets for current week
   */
  const fetchTimesheets = async () => {
    try {
      const startDate = format(currentWeekStart, 'yyyy-MM-dd')
      const endDate = format(weekEnd, 'yyyy-MM-dd')

      const response = await fetch(
        `/api/client/timesheets?startDate=${startDate}&endDate=${endDate}`
      )
      const data = await response.json()

      if (response.ok) {
        return data.timesheets || []
      }
      return []
    } catch (error) {
      console.error('Error fetching timesheets:', error)
      return []
    }
  }

  /**
   * Load all data
   */
  const loadData = async () => {
    setLoading(true)
    const [employeesData, timesheetsData] = await Promise.all([
      fetchEmployees(),
      fetchTimesheets(),
    ])

    // Calculate hours by day type for each employee
    type PayDataEntry = { weekday: number; saturday: number; sunday: number; rawHours: number; breakMinutes: number }
    const payData = timesheetsData.reduce((acc: Record<string, PayDataEntry>, ts: TimesheetWithEmployee) => {
      if (!acc[ts.employee_id]) {
        acc[ts.employee_id] = { weekday: 0, saturday: 0, sunday: 0, rawHours: 0, breakMinutes: 0 }
      }

      const dayType = getDayType(ts.work_date)
      const hours = parseFloat(ts.total_hours.toString())
      const breakMins = ts.break_minutes || 0

      // Calculate raw hours from start/end time if available
      let rawHours = hours
      if (ts.start_time && ts.end_time) {
        const start = new Date(`2000-01-01T${ts.start_time}`)
        const end = new Date(`2000-01-01T${ts.end_time}`)
        rawHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      }

      acc[ts.employee_id][dayType] += hours
      acc[ts.employee_id].rawHours += rawHours
      acc[ts.employee_id].breakMinutes += breakMins
      return acc
    }, {})

    // Merge employees with pay data
    const employeesWithPay: EmployeeWithPay[] = employeesData.map((emp: Employee) => {
      const empData = payData[emp.id]
      const weekdayHours = empData?.weekday ?? 0
      const saturdayHours = empData?.saturday ?? 0
      const sundayHours = empData?.sunday ?? 0
      const rawHours = empData?.rawHours ?? 0
      const breakMinutes = empData?.breakMinutes ?? 0

      const totalPay =
        (weekdayHours * emp.weekday_rate) +
        (saturdayHours * emp.saturday_rate) +
        (sundayHours * emp.sunday_rate)

      return {
        ...emp,
        weekdayHours,
        saturdayHours,
        sundayHours,
        totalHours: weekdayHours + saturdayHours + sundayHours,
        totalPay,
        rawHours,
        breakMinutes,
      }
    })

    // Sort by total pay (descending)
    employeesWithPay.sort((a, b) => b.totalPay - a.totalPay)

    setEmployees(employeesWithPay)
    setTimesheets(timesheetsData)
    setLoading(false)
  }

  // Load data on mount and when week changes
  useEffect(() => {
    loadData()
  }, [currentWeekStart])

  /**
   * Filter employees by search query
   */
  const filteredEmployees = employees.filter((emp) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      emp.first_name.toLowerCase().includes(searchLower) ||
      emp.last_name.toLowerCase().includes(searchLower)
    )
  })


  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      document.cookie = 'manager_session=; Max-Age=0; path=/'
      router.push('/client/manager/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Calculate summary stats
  const totalPay = employees.reduce((sum, emp) => sum + emp.totalPay, 0)
  const totalHours = employees.reduce((sum, emp) => sum + emp.totalHours, 0)

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="border-b border-neutral-700 bg-neutral-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Payroll Dashboard</h1>
                <p className="text-sm text-neutral-400">
                  {format(currentWeekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/client/manager/settings')}
                className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
              >
                <LogOut className="w-4 h-4" />
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
            onPrevious={() => setCurrentWeekStart(addWeeks(currentWeekStart, -1))}
            onNext={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
          />

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-neutral-800 rounded-lg border border-neutral-700 ring-blue-500/40 shadow-xl shadow-blue-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Payroll</p>
                  <p className="text-3xl font-bold">${totalPay.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="p-6 bg-neutral-800 rounded-lg border border-neutral-700 ring-blue-500/40 shadow-xl shadow-blue-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Hours</p>
                  <p className="text-3xl font-bold">{totalHours.toFixed(1)}</p>
                </div>
                <Clock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="p-6 bg-neutral-800 rounded-lg border border-neutral-700 ring-blue-500/40 shadow-xl shadow-blue-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Employees</p>
                  <p className="text-3xl font-bold">{employees.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Search employees by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-neutral-800 border-neutral-700"
            />
          </div>

          {/* Employee Cards */}
          {loading ? (
            <div className="text-center py-12 text-neutral-400">
              Loading employees...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              {searchQuery
                ? 'No employees found matching your search'
                : 'No employees yet. Add your first employee to get started.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => router.push(`/client/manager/employee/${emp.id}`)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {/* Employee Header with Total Pay */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">
                        {emp.first_name} {emp.last_name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">
                        ${emp.totalPay.toFixed(2)}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {emp.rawHours.toFixed(2)} hrs → {emp.totalHours.toFixed(2)} hrs
                      </div>
                      <div className="text-xs text-neutral-500">
                        ({emp.breakMinutes} min break)
                      </div>
                    </div>
                  </div>

                  {/* Pay Rates */}
                  <div className="text-sm text-neutral-400 mb-4">
                    Weekday: ${emp.weekday_rate.toFixed(2)}/hr | Sat: ${emp.saturday_rate.toFixed(2)}/hr | Sun: ${emp.sunday_rate.toFixed(2)}/hr
                  </div>

                  {/* Day Boxes */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4 text-center">
                      <div className="text-sm text-neutral-400 mb-2">Weekday</div>
                      <div className="text-xl font-semibold">{emp.weekdayHours.toFixed(2)} hrs</div>
                    </div>
                    <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4 text-center">
                      <div className="text-sm text-neutral-400 mb-2">Saturday</div>
                      <div className="text-xl font-semibold">{emp.saturdayHours.toFixed(2)} hrs</div>
                    </div>
                    <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4 text-center">
                      <div className="text-sm text-neutral-400 mb-2">Sunday</div>
                      <div className="text-xl font-semibold">{emp.sundayHours.toFixed(2)} hrs</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
