/**
 * Employee Dashboard Page
 * Main dashboard for employees to submit and view timesheets
 * Features:
 * - Submit today's timesheet
 * - View past timesheets
 * - See weekly summary
 * - Time input with validation
 */
'use client'

import { useEffect, useState } from 'react'
import { TimeInput } from '@/components/TimeInput'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, Clock, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import type { Timesheet } from '@/types/database'

export default function EmployeeDashboardPage() {
  // Employee info from session (would come from cookie in real implementation)
  const [employeeName, setEmployeeName] = useState('Employee')
  const [employeeId, setEmployeeId] = useState('')

  // Timesheet form state
  const [workDate, setWorkDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Past timesheets
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])

  /**
   * Fetch employee's past timesheets
   */
  const fetchTimesheets = async () => {
    try {
      // In real implementation, employeeId would come from session
      if (!employeeId) return

      const response = await fetch(`/api/client/timesheets?employeeId=${employeeId}`)
      const data = await response.json()

      if (response.ok) {
        setTimesheets(data.timesheets || [])
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error)
    }
  }

  useEffect(() => {
    // In real implementation, fetch employee info from session
    // For now, using placeholder
    fetchTimesheets()
  }, [employeeId])

  /**
   * Handle timesheet submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      setError('Please enter valid times in HH:MM format')
      setLoading(false)
      return
    }

    // Validate end time is after start time
    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)

    if (end <= start) {
      setError('End time must be after start time')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/client/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId, // Would come from session
          workDate,
          startTime: startTime + ':00', // Add seconds
          endTime: endTime + ':00',
          notes: notes.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to submit timesheet')
        return
      }

      // Success - reset form and refresh timesheets
      setSuccess('Timesheet submitted successfully!')
      setStartTime('')
      setEndTime('')
      setNotes('')
      fetchTimesheets()
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Calculate total hours for current week
   */
  const weeklyHours = timesheets
    .filter(ts => {
      const tsDate = new Date(ts.work_date)
      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      return tsDate >= weekStart
    })
    .reduce((sum, ts) => sum + parseFloat(ts.total_hours.toString()), 0)

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="border-b border-neutral-700 bg-neutral-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Welcome, {employeeName}</h1>
                <p className="text-sm text-neutral-400">Submit Your Timesheet</p>
              </div>
            </div>

            {/* Weekly Hours Display */}
            <div className="bg-neutral-700 px-4 py-2 rounded-lg">
              <p className="text-sm text-neutral-400">This Week</p>
              <p className="text-2xl font-bold">{weeklyHours.toFixed(2)} hrs</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Timesheet Submission Form */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              Submit Timesheet
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-800 p-6 rounded-lg border border-neutral-700">
              {/* Work Date */}
              <div className="space-y-2">
                <Label htmlFor="workDate">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Work Date
                </Label>
                <Input
                  id="workDate"
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="bg-neutral-700 border-neutral-600"
                  required
                />
              </div>

              {/* Start Time */}
              <TimeInput
                label="Start Time"
                value={startTime}
                onChange={setStartTime}
                placeholder="09:00"
              />

              {/* End Time */}
              <TimeInput
                label="End Time"
                value={endTime}
                onChange={setEndTime}
                placeholder="17:00"
              />

              {/* Notes (optional) */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about your shift"
                  className="bg-neutral-700 border-neutral-600"
                />
              </div>

              {/* Success Message */}
              {success && (
                <div className="p-3 text-sm text-green-500 bg-green-500/10 rounded border border-green-500/20">
                  {success}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded border border-red-500/20">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-600"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Timesheet'}
              </Button>
            </form>
          </div>

          {/* Past Timesheets */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Recent Timesheets</h2>

            <div className="rounded-lg border border-neutral-700 bg-neutral-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-700">
                    <TableHead>Date</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-neutral-400">
                        No timesheets yet. Submit your first one!
                      </TableCell>
                    </TableRow>
                  ) : (
                    timesheets.slice(0, 10).map((ts) => (
                      <TableRow key={ts.id} className="border-neutral-700">
                        <TableCell>
                          {format(new Date(ts.work_date), 'EEE, MMM d')}
                        </TableCell>
                        <TableCell>{ts.start_time}</TableCell>
                        <TableCell>{ts.end_time}</TableCell>
                        <TableCell className="font-semibold">
                          {parseFloat(ts.total_hours.toString()).toFixed(2)} hrs
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
