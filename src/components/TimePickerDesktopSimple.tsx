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
import { Clock } from "lucide-react";
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
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));

  // Helper function to convert and emit time
  const emitTime = useCallback((hour: string, minute: string, timePeriod: "AM" | "PM") => {
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
  }, [onChange]);

  // Initialize from 24-hour value
  useEffect(() => {
    if (value) {
      const parsed = parseTimeString(value);
      if (parsed) {
        const hourStr = parsed.hours.toString();
        const minuteStr = parsed.minutes.toString().padStart(2, "0");
        
        // Only update if values actually changed to prevent loops
        if (selectedHour !== hourStr || selectedMinute !== minuteStr || period !== parsed.period) {
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
    <div className="flex gap-2">
      {/* Hour Select */}
      <div className="relative flex-1">
        <Clock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 z-10 text-neutral-400 pointer-events-none" />
        <Select
          value={selectedHour}
          onValueChange={(val) => {
            setSelectedHour(val);
            emitTime(val, selectedMinute, period);
          }}
        >
          <SelectTrigger className="border-neutral-700 bg-neutral-800 pl-10 text-white">
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-800 border-neutral-700">
            {hours.map((hour) => (
              <SelectItem key={hour} value={hour} className="text-white hover:bg-neutral-700">
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Minute Select */}
      <div className="flex-1">
        <Select
          value={selectedMinute}
          onValueChange={(val) => {
            setSelectedMinute(val);
            emitTime(selectedHour, val, period);
          }}
        >
          <SelectTrigger className="border-neutral-700 bg-neutral-800 text-white">
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-800 border-neutral-700">
            {minutes.map((minute) => (
              <SelectItem key={minute} value={minute} className="text-white hover:bg-neutral-700">
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* AM/PM Toggle */}
      <div className="flex overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800">
        <button
          type="button"
          onClick={() => {
            setPeriod("AM");
            emitTime(selectedHour, selectedMinute, "AM");
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            period === "AM"
              ? "bg-blue-600 text-white"
              : "text-neutral-400 hover:bg-neutral-700 hover:text-white"
          }`}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => {
            setPeriod("PM");
            emitTime(selectedHour, selectedMinute, "PM");
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            period === "PM"
              ? "bg-blue-600 text-white"
              : "text-neutral-400 hover:bg-neutral-700 hover:text-white"
          }`}
        >
          PM
        </button>
      </div>
    </div>
  );
}

