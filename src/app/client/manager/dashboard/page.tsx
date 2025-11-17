/**
 * Manager Dashboard Page - Payroll View
 * Shows employee cards with pay calculations
 * Features:
 * - Employee cards with pay rates
 * - Weekly pay calculations
 * - Search employees
 * - Add new employees
 * - Week navigator
 * - Settings access
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AddEmployeeDialog } from './components/AddEmployeeDialog'
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
    const payData = timesheetsData.reduce((acc: Record<string, { weekday: number; saturday: number; sunday: number }>, ts: TimesheetWithEmployee) => {
      if (!acc[ts.employee_id]) {
        acc[ts.employee_id] = { weekday: 0, saturday: 0, sunday: 0 }
      }

      const dayType = getDayType(ts.work_date)
      const hours = parseFloat(ts.total_hours.toString())

      acc[ts.employee_id][dayType] += hours
      return acc
    }, {})

    // Merge employees with pay data
    const employeesWithPay: EmployeeWithPay[] = employeesData.map((emp: Employee) => {
      const weekdayHours = payData[emp.id]?.weekday || 0
      const saturdayHours = payData[emp.id]?.saturday || 0
      const sundayHours = payData[emp.id]?.sunday || 0

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
              <AddEmployeeDialog onSuccess={loadData} />
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
            <div className="p-6 bg-neutral-800 rounded-lg border border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Payroll</p>
                  <p className="text-3xl font-bold">${totalPay.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="p-6 bg-neutral-800 rounded-lg border border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Hours</p>
                  <p className="text-3xl font-bold">{totalHours.toFixed(1)}</p>
                </div>
                <Clock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="p-6 bg-neutral-800 rounded-lg border border-neutral-700">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 hover:border-primary/50 transition-colors"
                >
                  {/* Employee Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {emp.first_name} {emp.last_name}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs mt-1 ${
                          emp.status === 'active'
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-gray-500/20 text-gray-500'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </div>
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>

                  {/* Hours Breakdown */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Weekday ({emp.weekdayHours.toFixed(1)}h)</span>
                      <span className="font-medium">${(emp.weekdayHours * emp.weekday_rate).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Saturday ({emp.saturdayHours.toFixed(1)}h)</span>
                      <span className="font-medium">${(emp.saturdayHours * emp.saturday_rate).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Sunday ({emp.sundayHours.toFixed(1)}h)</span>
                      <span className="font-medium">${(emp.sundayHours * emp.sunday_rate).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Total Pay */}
                  <div className="pt-4 border-t border-neutral-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-neutral-400">Total Pay</span>
                      <span className="text-2xl font-bold text-primary">
                        ${emp.totalPay.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-neutral-500">Total Hours</span>
                      <span className="text-sm text-neutral-400">{emp.totalHours.toFixed(1)} hrs</span>
                    </div>
                  </div>

                  {/* Pay Rates */}
                  <div className="mt-4 pt-4 border-t border-neutral-700">
                    <p className="text-xs text-neutral-500 mb-2">Hourly Rates</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-neutral-400">M-F: </span>
                        <span className="font-medium">${emp.weekday_rate}/h</span>
                      </div>
                      <div>
                        <span className="text-neutral-400">Sat: </span>
                        <span className="font-medium">${emp.saturday_rate}/h</span>
                      </div>
                      <div>
                        <span className="text-neutral-400">Sun: </span>
                        <span className="font-medium">${emp.sunday_rate}/h</span>
                      </div>
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
