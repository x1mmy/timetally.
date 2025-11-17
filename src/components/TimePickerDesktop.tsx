/**
 * TimePickerDesktop Component
 * Standard keyboard input for time entry in 12-hour format (desktop/laptop)
 * Features:
 * - 12-hour format with AM/PM toggle
 * - Auto-formatting as user types
 * - Clock icon
 * - Keyboard friendly
 */
'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Clock } from 'lucide-react'
import { parseTimeString } from '@/lib/timeUtils'

interface TimePickerDesktopProps {
  /** Current time value in 24-hour HH:MM format */
  value: string
  /** Callback when value changes (returns 24-hour HH:MM format) */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
}

export function TimePickerDesktop({
  value,
  onChange,
  placeholder = '--:--'
}: TimePickerDesktopProps) {
  const [timeInput, setTimeInput] = useState('')
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM')

  // Initialize from 24-hour value
  useEffect(() => {
    if (value) {
      const parsed = parseTimeString(value)
      if (parsed) {
        setTimeInput(`${parsed.hours}:${parsed.minutes.toString().padStart(2, '0')}`)
        setPeriod(parsed.period)
      }
    } else {
      setTimeInput('')
      setPeriod('AM')
    }
  }, [value])

  /**
   * Round minutes to nearest 5-minute interval
   */
  const roundToNearest5 = (minutes: number): number => {
    return Math.round(minutes / 5) * 5
  }

  /**
   * Constrain hours to 1-12 range
   */
  const constrainHours = (hours: number): number => {
    if (hours < 1) return 1
    if (hours > 12) return 12
    return hours
  }

  /**
   * Handle time input change with auto-formatting
   */
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '')

    // Auto-format: insert colon after 1-2 digits for hours
    if (val.length >= 3) {
      const hours = val.slice(0, 2)
      const minutes = val.slice(2, 4)
      val = `${hours}:${minutes}`
    } else if (val.length === 2) {
      val = `${val}:`
    }

    setTimeInput(val)
    emitChange(val, period)
  }

  /**
   * Auto-correct time values when user finishes typing
   */
  const handleBlur = () => {
    if (!timeInput || timeInput === ':') return

    const parts = timeInput.split(':')
    if (parts.length !== 2) return

    let hours = parseInt(parts[0] || '0')
    let minutes = parseInt(parts[1] || '0')

    // Constrain hours to 1-12
    hours = constrainHours(hours)

    // Round minutes to nearest 5, handle overflow
    minutes = roundToNearest5(minutes)
    if (minutes >= 60) {
      minutes = 55 // Cap at 55
    }

    // Update with corrected values
    const corrected = `${hours}:${minutes.toString().padStart(2, '0')}`
    setTimeInput(corrected)
    emitChange(corrected, period)
  }

  /**
   * Handle AM/PM toggle
   */
  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    setPeriod(newPeriod)
    emitChange(timeInput, newPeriod)
  }

  /**
   * Emit the time change in 24-hour format
   */
  const emitChange = (time: string, timePeriod: 'AM' | 'PM') => {
    if (!time || time === ':') {
      onChange('')
      return
    }

    const parsed = parseTimeString(`${time} ${timePeriod}`)
    if (parsed) {
      // Convert to 24-hour format
      let hours24 = parsed.hours
      if (timePeriod === 'AM') {
        if (hours24 === 12) hours24 = 0
      } else {
        if (hours24 !== 12) hours24 += 12
      }

      const formatted = `${hours24.toString().padStart(2, '0')}:${parsed.minutes.toString().padStart(2, '0')}`
      onChange(formatted)
    }
  }

  return (
    <div className="flex gap-2">
      {/* Time Input */}
      <div className="relative flex-1">
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <Input
          type="text"
          value={timeInput}
          onChange={handleTimeChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={5}
          className="pl-10 bg-neutral-800 border-neutral-700 text-white"
        />
      </div>

      {/* AM/PM Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-neutral-700 bg-neutral-800">
        <button
          type="button"
          onClick={() => handlePeriodChange('AM')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            period === 'AM'
              ? 'bg-blue-600 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
          }`}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => handlePeriodChange('PM')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            period === 'PM'
              ? 'bg-blue-600 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
          }`}
        >
          PM
        </button>
      </div>
    </div>
  )
}
