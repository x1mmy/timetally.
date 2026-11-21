/**
 * TimePickerDesktopSimple Component
 * Simple, user-friendly time picker with separate hour and minute inputs
 * Features:
 * - Separate dropdowns for hours (1-12) and minutes (00-59 in 5-min increments)
 * - AM/PM toggle
 * - No complex typing logic - just select and go
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { parseTimeString } from "@/lib/timeUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerDesktopSimpleProps {
  /** Current time value in 24-hour HH:MM format */
  value: string;
  /** Callback when value changes (returns 24-hour HH:MM format) */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
}

export function TimePickerDesktopSimple({
  value,
  onChange,
  placeholder = "--:--",
}: TimePickerDesktopSimpleProps) {
  const [selectedHour, setSelectedHour] = useState<string>("");
  const [selectedMinute, setSelectedMinute] = useState<string>("");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  // Generate options
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = Array.from({ length: 12 }, (_, i) =>
    (i * 5).toString().padStart(2, "0"),
  );

  // Helper function to convert and emit time
  const emitTime = useCallback(
    (hour: string, minute: string, timePeriod: "AM" | "PM") => {
      if (!hour || !minute) {
        onChange("");
        return;
      }

      const hours = parseInt(hour, 10);
      const minutes = parseInt(minute, 10);

      // Convert to 24-hour format
      let hours24 = hours;
      if (timePeriod === "AM") {
        if (hours === 12) hours24 = 0;
      } else {
        if (hours !== 12) hours24 = hours + 12;
      }

      const formatted = `${hours24.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      onChange(formatted);
    },
    [onChange],
  );

  // Initialize from 24-hour value
  useEffect(() => {
    if (value) {
      const parsed = parseTimeString(value);
      if (parsed) {
        const hourStr = parsed.hours.toString();
        const minuteStr = parsed.minutes.toString().padStart(2, "0");

        // Only update if values actually changed to prevent loops
        if (
          selectedHour !== hourStr ||
          selectedMinute !== minuteStr ||
          period !== parsed.period
        ) {
          setSelectedHour(hourStr);
          setSelectedMinute(minuteStr);
          setPeriod(parsed.period);
        }
      }
    } else {
      // Only clear if not already empty
      if (selectedHour || selectedMinute) {
        setSelectedHour("");
        setSelectedMinute("");
        setPeriod("AM");
      }
    }
    // Don't include selectedHour, selectedMinute, period in deps to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Hour Select */}
      <div className="min-w-[68px] flex-1">
        <Select
          value={selectedHour}
          onValueChange={(val) => {
            setSelectedHour(val);
            emitTime(val, selectedMinute, period);
          }}
        >
          <SelectTrigger
            aria-label="Hour"
            className="w-full px-2.5 tabular-nums"
          >
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent>
            {hours.map((hour) => (
              <SelectItem key={hour} value={hour} className="font-mono">
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Minute Select */}
      <div className="min-w-[68px] flex-1">
        <Select
          value={selectedMinute}
          onValueChange={(val) => {
            setSelectedMinute(val);
            emitTime(selectedHour, val, period);
          }}
        >
          <SelectTrigger
            aria-label="Minutes"
            className="w-full px-2.5 tabular-nums"
          >
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((minute) => (
              <SelectItem key={minute} value={minute} className="font-mono">
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* AM/PM Toggle */}
      <div
        role="group"
        aria-label="AM or PM"
        className="border-input bg-card flex h-10 overflow-hidden rounded-lg border"
      >
        <button
          type="button"
          aria-pressed={period === "AM"}
          onClick={() => {
            setPeriod("AM");
            emitTime(selectedHour, selectedMinute, "AM");
          }}
          className={`px-2.5 font-mono text-[13px] transition-colors ${
            period === "AM"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          AM
        </button>
        <button
          type="button"
          aria-pressed={period === "PM"}
          onClick={() => {
            setPeriod("PM");
            emitTime(selectedHour, selectedMinute, "PM");
          }}
          className={`border-input border-l px-2.5 font-mono text-[13px] transition-colors ${
            period === "PM"
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          PM
        </button>
      </div>
    </div>
  );
}
