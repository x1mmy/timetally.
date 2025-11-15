/**
 * TimeInput Component
 * Specialized input for time entry in HH:MM format
 * Features:
 * - Auto-formats as user types
 * - Only allows numeric input
 * - Displays clock icon
 * - Optional label
 */
'use client'

import { Input } from '@/components/ui/input'
import { Clock } from 'lucide-react'

interface TimeInputProps {
  /** Current time value (HH:MM) */
  value: string
  /** Callback when value changes */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Optional label */
  label?: string
}

export function TimeInput({
  value,
  onChange,
  placeholder = '--:--',
  label
}: TimeInputProps) {
  /**
   * Handle input change
   * Strips non-numeric characters and auto-formats to HH:MM
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-numeric characters
    let val = e.target.value.replace(/[^0-9]/g, '')

    // Auto-format: insert colon after 2 digits
    if (val.length >= 2) {
      val = val.slice(0, 2) + ':' + val.slice(2, 4)
    }

    onChange(val)
  }

  return (
    <div className="space-y-2">
      {/* Optional label */}
      {label && (
        <label className="text-sm font-medium">{label}</label>
      )}

      {/* Input with clock icon */}
      <div className="relative">
        {/* Clock icon positioned on the left */}
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />

        {/* Time input field */}
        <Input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={5} // HH:MM = 5 characters
          className="pl-10 bg-neutral-800 border-neutral-700"
        />
      </div>
    </div>
  )
}
