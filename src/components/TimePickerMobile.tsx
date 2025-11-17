/**
 * TimePickerMobile Component
 * iOS-style scroll picker for mobile/tablet time entry
 * Features:
 * - Three scroll wheels: Hours (1-12), Minutes (00-59), AM/PM
 * - Smooth scroll-snap behavior
 * - Modal overlay
 * - Touch-friendly
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import { Clock, X, Check } from 'lucide-react'
import { parseTimeString, formatTime12 } from '@/lib/timeUtils'

interface TimePickerMobileProps {
  /** Current time value in 24-hour HH:MM format */
  value: string
  /** Callback when value changes (returns 24-hour HH:MM format) */
  onChange: (value: string) => void
  /** Placeholder text */
  placeholder?: string
}

export function TimePickerMobile({
  value,
  onChange,
  placeholder = '--:-- --'
}: TimePickerMobileProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState(9)
  const [selectedMinute, setSelectedMinute] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM')

  const hoursRef = useRef<HTMLDivElement>(null)
  const minutesRef = useRef<HTMLDivElement>(null)
  const periodRef = useRef<HTMLDivElement>(null)

  // Generate arrays for scroll wheels
  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = Array.from({ length: 12 }, (_, i) => i*5)
  const periods: ('AM' | 'PM')[] = ['AM', 'PM']

  // Initialize from 24-hour value
  useEffect(() => {
    if (value) {
      const parsed = parseTimeString(value)
      if (parsed) {
        setSelectedHour(parsed.hours)
        setSelectedMinute(parsed.minutes)
        setSelectedPeriod(parsed.period)
      }
    }
  }, [value])

  // Scroll to selected values when modal opens
  useEffect(() => {
    if (isOpen) {
      scrollToSelected()
    }
  }, [isOpen])

  const scrollToSelected = () => {
    const itemHeight = 48

    // Scroll each wheel to the selected item
    if (hoursRef.current) {
      const hourIndex = hours.indexOf(selectedHour)
      if (hourIndex !== -1) {
        const scrollPosition = hourIndex * itemHeight
        hoursRef.current.scrollTop = scrollPosition
      }
    }

    if (minutesRef.current) {
      const minuteIndex = minutes.indexOf(selectedMinute)
      if (minuteIndex !== -1) {
        const scrollPosition = minuteIndex * itemHeight
        minutesRef.current.scrollTop = scrollPosition
      }
    }

    if (periodRef.current) {
      const periodIndex = periods.indexOf(selectedPeriod)
      if (periodIndex !== -1) {
        const scrollPosition = periodIndex * itemHeight
        periodRef.current.scrollTop = scrollPosition
      }
    }
  }

  const handleScroll = (type: 'hour' | 'minute' | 'period', ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return

    const itemHeight = 48
    const scrollTop = ref.current.scrollTop

    // Calculate which item is currently centered
    const index = Math.round(scrollTop / itemHeight)

    if (type === 'hour') {
      const hour = hours[index]
      if (hour !== undefined) setSelectedHour(hour)
    } else if (type === 'minute') {
      const minute = minutes[index]
      if (minute !== undefined) setSelectedMinute(minute)
    } else if (type === 'period') {
      const period = periods[index]
      if (period) setSelectedPeriod(period)
    }
  }

  const handleDone = () => {
    // Convert to 24-hour format
    let hours24 = selectedHour
    if (selectedPeriod === 'AM') {
      if (selectedHour === 12) hours24 = 0
    } else {
      if (selectedHour !== 12) hours24 = selectedHour + 12
    }

    const formatted = `${hours24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`
    onChange(formatted)
    setIsOpen(false)
  }

  const displayValue = value
    ? formatTime12(selectedHour, selectedMinute, selectedPeriod)
    : placeholder

  return (
    <>
      {/* Input Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative w-full flex items-center gap-3 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-left hover:bg-neutral-750 transition-colors"
      >
        <Clock className="w-5 h-5 text-neutral-400 flex-shrink-0" />
        <span className={value ? 'text-white' : 'text-neutral-500'}>
          {displayValue}
        </span>
      </button>

      {/* Modal Picker */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Picker Content */}
          <div className="relative w-full max-w-md bg-neutral-900 rounded-3xl shadow-2xl ring-1 ring-blue-500/40 rounded-3xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold">Select Time</h3>
              <button
                type="button"
                onClick={handleDone}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>

            {/* Scroll Wheels */}
            <div className="relative px-4 py-6">
              {/* Selection Indicator */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-12 border-y-2 border-blue-500/30 bg-blue-500/5 pointer-events-none" />

              <div className="flex gap-2">
                {/* Hours Wheel */}
                <div
                  ref={hoursRef}
                  onScroll={() => handleScroll('hour', hoursRef)}
                  className="flex-1 h-60 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                  style={{
                    scrollSnapType: 'y mandatory',
                    scrollPaddingTop: '96px',
                    scrollPaddingBottom: '96px'
                  }}
                >
                  <div className="h-24" /> {/* Top padding */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="h-12 flex items-center justify-center text-2xl font-medium snap-center scroll-my-24"
                      style={{ scrollSnapAlign: 'center' }}
                    >
                      {hour}
                    </div>
                  ))}
                  <div className="h-24" /> {/* Bottom padding */}
                </div>

                {/* Colon Separator */}
                <div className="flex items-center justify-center text-2xl font-bold px-1">
                  :
                </div>

                {/* Minutes Wheel */}
                <div
                  ref={minutesRef}
                  onScroll={() => handleScroll('minute', minutesRef)}
                  className="flex-1 h-60 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                  style={{
                    scrollSnapType: 'y mandatory',
                    scrollPaddingTop: '96px',
                    scrollPaddingBottom: '96px'
                  }}
                >
                  <div className="h-24" /> {/* Top padding */}
                  {minutes.map((minute) => (
                    <div
                      key={minute}
                      className="h-12 flex items-center justify-center text-2xl font-medium snap-center scroll-my-24"
                      style={{ scrollSnapAlign: 'center' }}
                    >
                      {minute.toString().padStart(2, '0')}
                    </div>
                  ))}
                  <div className="h-24" /> {/* Bottom padding */}
                </div>

                {/* AM/PM Wheel */}
                <div
                  ref={periodRef}
                  onScroll={() => handleScroll('period', periodRef)}
                  className="flex-1 h-60 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                  style={{
                    scrollSnapType: 'y mandatory',
                    scrollPaddingTop: '96px',
                    scrollPaddingBottom: '96px'
                  }}
                >
                  <div className="h-24" /> {/* Top padding */}
                  {periods.map((period) => (
                    <div
                      key={period}
                      className="h-12 flex items-center justify-center text-2xl font-medium snap-center scroll-my-24"
                      style={{ scrollSnapAlign: 'center' }}
                    >
                      {period}
                    </div>
                  ))}
                  <div className="h-24" /> {/* Bottom padding */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  )
}
