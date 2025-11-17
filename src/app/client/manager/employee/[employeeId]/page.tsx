/**
 * Individual Employee Breakdown Page
 * Shows detailed shift breakdown for a single employee
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { startOfWeek, endOfWeek, format, getDay } from 'date-fns'
import type { Employee, TimesheetWithEmployee } from '@/types/database'

interface DailyBreakdown {
  date: string
  dayName: string
  startTime: string | null
  endTime: string | null
  rawHours: number
  breakMinutes: number
  totalHours: number
  pay: number
}

export default function EmployeeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const employeeId = params.employeeId as string

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [timesheets, setTimesheets] = useState<TimesheetWithEmployee[]>([])
  const [dailyBreakdown, setDailyBreakdown] = useState<DailyBreakdown[]>([])
  const [loading, setLoading] = useState(true)

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })

  /**
   * Get hourly rate based on day of week
   */
  const getHourlyRate = (dateString: string, emp: Employee): number => {
    const date = new Date(dateString)
    const dayOfWeek = getDay(date)

    if (dayOfWeek === 0) return emp.sunday_rate
    if (dayOfWeek === 6) return emp.saturday_rate
    return emp.weekday_rate
  }

  /**
   * Load employee and timesheet data
   */
  const loadData = async () => {
    try {
      setLoading(true)

      // Fetch employee details
      const empResponse = await fetch('/api/client/employees')
      const empData = await empResponse.json() as { employees?: Employee[] }
      const emp = empData.employees?.find((e) => e.id === employeeId)

      if (!emp) {
        router.push('/client/manager/dashboard')
        return
      }

      setEmployee(emp)

      // Fetch timesheets for this week
      const startDate = format(currentWeekStart, 'yyyy-MM-dd')
      const endDate = format(weekEnd, 'yyyy-MM-dd')

      const tsResponse = await fetch(
        `/api/client/timesheets?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`
      )
      const tsData = await tsResponse.json() as { timesheets?: TimesheetWithEmployee[] }
      const sheets = tsData.timesheets ?? []

      setTimesheets(sheets)

      // Create daily breakdown for the week
      const breakdown: DailyBreakdown[] = []
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

      for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart)
        date.setDate(date.getDate() + i)
        const dateString = format(date, 'yyyy-MM-dd')

        const timesheet = sheets.find((ts) => ts.work_date === dateString)

        if (timesheet && timesheet.start_time && timesheet.end_time) {
          const rawHours =
            (new Date(`2000-01-01T${timesheet.end_time}`).getTime() -
              new Date(`2000-01-01T${timesheet.start_time}`).getTime()) /
            (1000 * 60 * 60)

          const totalHours = parseFloat(timesheet.total_hours.toString())
          const breakMinutes = timesheet.break_minutes || 0
          const hourlyRate = getHourlyRate(dateString, emp)

          breakdown.push({
            date: dateString,
            dayName: daysOfWeek[i],
            startTime: timesheet.start_time,
            endTime: timesheet.end_time,
            rawHours,
            breakMinutes,
            totalHours,
            pay: totalHours * hourlyRate,
          })
        } else {
          breakdown.push({
            date: dateString,
            dayName: daysOfWeek[i],
            startTime: null,
            endTime: null,
            rawHours: 0,
            breakMinutes: 0,
            totalHours: 0,
            pay: 0,
          })
        }
      }

      setDailyBreakdown(breakdown)
    } catch (error) {
      console.error('Error loading employee data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [employeeId])

  if (loading || !employee) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div className="text-neutral-400">Loading...</div>
      </div>
    )
  }

  const totalPay = dailyBreakdown.reduce((sum, day) => sum + day.pay, 0)
  const totalHours = dailyBreakdown.reduce((sum, day) => sum + day.totalHours, 0)
  const totalBreakMinutes = dailyBreakdown.reduce((sum, day) => sum + day.breakMinutes, 0)

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="border-b border-neutral-700 bg-neutral-800">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/client/manager/dashboard')}
            className="mb-4 text-primary hover:text-primary/80 hover:bg-neutral-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {employee.first_name} {employee.last_name}
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
              <p className="text-sm text-neutral-400">Weekday Rate</p>
              <p className="text-xl font-bold">${employee.weekday_rate.toFixed(2)}/hr</p>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
              <p className="text-sm text-neutral-400">Saturday Rate</p>
              <p className="text-xl font-bold">${employee.saturday_rate.toFixed(2)}/hr</p>
            </div>
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
              <p className="text-sm text-neutral-400">Sunday Rate</p>
              <p className="text-xl font-bold">${employee.sunday_rate.toFixed(2)}/hr</p>
            </div>
            <div className="bg-primary/20 border border-primary/40 rounded-lg p-4">
              <p className="text-sm text-neutral-400">Total Pay</p>
              <p className="text-xl font-bold text-primary">${totalPay.toFixed(2)}</p>
              <p className="text-xs text-neutral-400 mt-1">{totalHours.toFixed(2)} hours</p>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className="space-y-3">
            {dailyBreakdown.map((day) => (
              <div
                key={day.date}
                className="bg-neutral-800 border border-neutral-700 rounded-lg p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{day.dayName}, {format(new Date(day.date), 'd MMM')}</h3>
                  </div>
                  {day.startTime && day.endTime ? (
                    <div className="text-right">
                      <p className="text-sm text-neutral-400">
                        {format(new Date(`2000-01-01T${day.startTime}`), 'h:mm a')} -{' '}
                        {format(new Date(`2000-01-01T${day.endTime}`), 'h:mm a')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">No hours logged</p>
                  )}
                </div>

                {day.startTime && day.endTime && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-400">Raw Hours</p>
                      <p className="font-semibold">{day.rawHours.toFixed(2)} hrs</p>
                    </div>
                    <div>
                      <p className="text-neutral-400">Unpaid Break Time</p>
                      <p className="font-semibold">{day.breakMinutes} min</p>
                    </div>
                    <div>
                      <p className="text-neutral-400">Paid Hours</p>
                      <p className="font-semibold">{day.totalHours.toFixed(2)} hrs</p>
                    </div>
                    <div>
                      <p className="text-neutral-400">Pay</p>
                      <p className="font-semibold text-primary">${day.pay.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Week Summary */}
          <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Week Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-neutral-400">Total Paid Hours</p>
                <p className="text-2xl font-bold">{totalHours.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Total Unpaid Break Time</p>
                <p className="text-2xl font-bold">{totalBreakMinutes} min</p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Total Pay</p>
                <p className="text-2xl font-bold text-primary">${totalPay.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
