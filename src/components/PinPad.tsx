/**
 * PinPad Component
 * Numeric keypad for PIN entry (employee login, manager access)
 * Features:
 * - Visual PIN dots showing entry progress
 * - Number buttons 0-9
 * - Backspace and clear functions
 * - Auto-submit when PIN length reached
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Delete } from "lucide-react";

interface PinPadProps {
  /** Length of PIN (default 4) */
  length?: number;
  /** Callback when PIN is complete */
  onComplete: (pin: string) => void;
  /** Callback when clear button is pressed */
  onClear?: () => void;
}

export function PinPad({ length = 4, onComplete, onClear }: PinPadProps) {
  const [pin, setPin] = useState("");

  /**
   * Handle number button click
   * Adds digit to PIN and auto-submits when complete
   */
  const handleNumberClick = (num: number) => {
    if (pin.length < length) {
      const newPin = pin + num;
      setPin(newPin);
      // Auto-submit when PIN is complete
      if (newPin.length === length) {
        onComplete(newPin);
      }
    }
  };

  /**
   * Remove last digit from PIN
   */
  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  /**
   * Clear entire PIN
   */
  const handleClear = () => {
    setPin("");
    onClear?.();
  };

  return (
    <div className="rounded-2xl p-6 shadow-xl ring-1 shadow-blue-500/50 ring-blue-500/40">
      <div className="flex flex-col items-center gap-6">
        {/* PIN Display - Shows filled/empty dots */}
        <div className="flex gap-4">
          {Array.from({ length }).map((_, i) => (
            <div
              key={i}
              className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-colors ${
                i < pin.length
                  ? "bg-primary border-primary"
                  : "border-neutral-700 bg-neutral-800"
              }`}
            >
              {/* Show dot when digit is entered */}
              {i < pin.length && (
                <div className="h-4 w-4 rounded-full bg-white" />
              )}
            </div>
          ))}
        </div>

        {/* Number Pad Grid */}
        <div className="grid w-full max-w-xs grid-cols-3 gap-4">
          {/* Numbers 1-9 */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="outline"
              size="lg"
              onClick={() => handleNumberClick(num)}
              className="h-16 border-neutral-700 bg-neutral-800 text-2xl hover:border-blue-500 hover:bg-blue-600/20 focus-visible:ring-blue-500/50"
            >
              {num}
            </Button>
          ))}

          {/* Backspace Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={handleBackspace}
            className="h-16 border-neutral-700 bg-neutral-800 hover:border-blue-500 hover:bg-blue-600/20 focus-visible:ring-blue-500/50"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>

          {/* Zero Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleNumberClick(0)}
            className="h-16 border-neutral-700 bg-neutral-800 text-2xl hover:border-blue-500 hover:bg-blue-600/20 focus-visible:ring-blue-500/50"
          >
            0
          </Button>

          {/* Clear Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={handleClear}
            className="h-16 border-neutral-700 bg-neutral-800 hover:border-blue-500 hover:bg-blue-600/20 focus-visible:ring-blue-500/50"
          >
            <Delete className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
