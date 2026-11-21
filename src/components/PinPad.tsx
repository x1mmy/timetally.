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

import { useState, useEffect, useCallback, useRef } from "react";

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
  const submittedPinRef = useRef<string | null>(null);

  /**
   * Handle number input (from button click or keyboard)
   * Adds digit to PIN
   */
  const handleNumberInput = useCallback(
    (num: number) => {
      setPin((currentPin) => {
        if (currentPin.length < length) {
          return currentPin + num;
        }
        return currentPin;
      });
    },
    [length],
  );

  /**
   * Auto-submit when PIN reaches required length
   * Uses ref to prevent duplicate submissions
   */
  useEffect(() => {
    if (pin.length === length && submittedPinRef.current !== pin) {
      submittedPinRef.current = pin;
      onComplete(pin);
    }
  }, [pin, length, onComplete]);

  /**
   * Handle backspace (from button click or keyboard)
   */
  const handleBackspaceInput = useCallback(() => {
    setPin((currentPin) => currentPin.slice(0, -1));
    submittedPinRef.current = null;
  }, []);

  /**
   * Handle clear (from button click or keyboard)
   */
  const handleClearInput = useCallback(() => {
    setPin("");
    submittedPinRef.current = null;
    onClear?.();
  }, [onClear]);

  /**
   * Keyboard event listener for number keys
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 0-9 (both main keyboard and numpad)
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleNumberInput(parseInt(e.key, 10));
      }
      // Backspace key
      else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspaceInput();
      }
      // Delete or Escape to clear
      else if (e.key === "Delete" || e.key === "Escape") {
        e.preventDefault();
        handleClearInput();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNumberInput, handleBackspaceInput, handleClearInput]);

  const keyClass =
    "border-border bg-card text-foreground hover:border-primary focus-visible:ring-ring h-15 rounded-lg border font-mono text-xl transition-colors outline-none focus-visible:ring-2 active:bg-secondary [@media(orientation:landscape)_and_(max-height:540px)]:h-12 [@media(orientation:portrait)_and_(max-height:700px)]:h-13";
  const smallKeyClass = `${keyClass} text-muted-foreground text-[11px] tracking-[0.1em] uppercase`;

  return (
    <div className="flex w-full flex-col items-center gap-6 [@media(orientation:portrait)_and_(max-height:700px)]:gap-4">
      {/* PIN Display - Shows filled/empty dots */}
      <div
        className="flex gap-4"
        role="img"
        aria-label={`${pin.length} of ${length} digits entered`}
      >
        {Array.from({ length }).map((_, i) => (
          <span
            key={i}
            className={`size-4 rounded-full border transition-colors ${
              i < pin.length ? "bg-primary border-primary" : "border-input"
            }`}
          />
        ))}
      </div>

      {/* Number Pad Grid */}
      <div className="grid w-full max-w-xs grid-cols-3 gap-2.5 [@media(orientation:portrait)_and_(max-height:700px)]:gap-2">
        {/* Numbers 1-9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleNumberInput(num)}
            className={keyClass}
          >
            {num}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClearInput}
          aria-label="Clear PIN"
          className={smallKeyClass}
        >
          Clear
        </button>

        {/* Zero Button */}
        <button
          type="button"
          onClick={() => handleNumberInput(0)}
          className={keyClass}
        >
          0
        </button>

        {/* Delete (backspace) Button */}
        <button
          type="button"
          onClick={handleBackspaceInput}
          aria-label="Delete last digit"
          className={smallKeyClass}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
