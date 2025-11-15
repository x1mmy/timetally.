/**
 * PinPad Component
 * Numeric keypad for PIN entry (employee login, manager access)
 * Features:
 * - Visual PIN dots showing entry progress
 * - Number buttons 0-9
 * - Backspace and clear functions
 * - Auto-submit when PIN length reached
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Delete } from 'lucide-react'

interface PinPadProps {
  /** Length of PIN (default 4) */
  length?: number
  /** Callback when PIN is complete */
  onComplete: (pin: string) => void
  /** Callback when clear button is pressed */
  onClear?: () => void
}

export function PinPad({ length = 4, onComplete, onClear }: PinPadProps) {
  const [pin, setPin] = useState('')

  /**
   * Handle number button click
   * Adds digit to PIN and auto-submits when complete
   */
  const handleNumberClick = (num: number) => {
    if (pin.length < length) {
      const newPin = pin + num
      setPin(newPin)
      // Auto-submit when PIN is complete
      if (newPin.length === length) {
        onComplete(newPin)
      }
    }
  }

  /**
   * Remove last digit from PIN
   */
  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
  }

  /**
   * Clear entire PIN
   */
  const handleClear = () => {
    setPin('')
    onClear?.()
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* PIN Display - Shows filled/empty dots */}
      <div className="flex gap-4">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-colors ${
              i < pin.length
                ? 'bg-primary border-primary'
                : 'bg-neutral-800 border-neutral-700'
            }`}
          >
            {/* Show dot when digit is entered */}
            {i < pin.length && (
              <div className="w-4 h-4 rounded-full bg-white" />
            )}
          </div>
        ))}
      </div>

      {/* Number Pad Grid */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {/* Numbers 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            variant="outline"
            size="lg"
            onClick={() => handleNumberClick(num)}
            className="h-16 text-2xl bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
          >
            {num}
          </Button>
        ))}

        {/* Backspace Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={handleBackspace}
          className="h-16 bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>

        {/* Zero Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleNumberClick(0)}
          className="h-16 text-2xl bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
        >
          0
        </Button>

        {/* Clear Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={handleClear}
          className="h-16 bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
        >
          <Delete className="w-6 h-6" />
        </Button>
      </div>
    </div>
  )
}
