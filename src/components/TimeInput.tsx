"use client";

import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";

interface TimeInputProps {
  /** Current time value (HH:MM) */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Optional label */
  label?: string;
}

export function TimeInput({
  value,
  onChange,
  placeholder = "--:--",
  label,
}: TimeInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // When value is exactly "HH:" and user presses Backspace, drop the colon.
    // Without this, onChange would immediately re-add it and keep the cursor stuck.
    if (e.key === "Backspace" && value.length === 3 && value[2] === ":") {
      e.preventDefault();
      onChange(value.slice(0, 2));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    let digits = rawInput.replace(/[^0-9]/g, "");

    // Raw input ends with ":" means user just deleted the last minute digit.
    // Return bare hour digits (no colon) so the formatter doesn't immediately
    // re-insert the colon and trap the cursor.
    if (rawInput.endsWith(":")) {
      onChange(digits.slice(0, 2));
      return;
    }

    // Clamp hours to 0–23
    if (digits.length >= 2) {
      const hours = parseInt(digits.slice(0, 2), 10);
      if (hours > 23) {
        digits = "23" + digits.slice(2);
      }
    }

    // Clamp minutes to 0–59
    if (digits.length >= 4) {
      const minutes = parseInt(digits.slice(2, 4), 10);
      if (minutes > 59) {
        digits = digits.slice(0, 2) + "59";
      }
    }

    // Auto-format: insert colon after 2 hour digits
    if (digits.length >= 2) {
      digits = digits.slice(0, 2) + ":" + digits.slice(2, 4);
    }

    onChange(digits);
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="relative">
        <Clock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <Input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={5}
          className="border-neutral-700 bg-neutral-800 pl-10"
        />
      </div>
    </div>
  );
}
