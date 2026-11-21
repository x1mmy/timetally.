/**
 * TimePickerMobile Component
 * iOS-style scroll picker for mobile/tablet time entry
 * Features:
 * - Three scroll wheels: Hours (1-12), Minutes (00-59), AM/PM
 * - Smooth scroll-snap behavior
 * - Modal overlay
 * - Touch-friendly
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, X, Check } from "lucide-react";
import { parseTimeString, formatTime12 } from "@/lib/timeUtils";

interface TimePickerMobileProps {
  /** Current time value in 24-hour HH:MM format */
  value: string;
  /** Callback when value changes (returns 24-hour HH:MM format) */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
}

export function TimePickerMobile({
  value,
  onChange,
  placeholder = "--:-- --",
}: TimePickerMobileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">("AM");

  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  // Generate arrays for scroll wheels
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const periods: ("AM" | "PM")[] = ["AM", "PM"];

  // Initialize from 24-hour value
  useEffect(() => {
    if (value) {
      const parsed = parseTimeString(value);
      if (parsed) {
        setSelectedHour(parsed.hours);
        setSelectedMinute(parsed.minutes);
        setSelectedPeriod(parsed.period);
      }
    }
  }, [value]);

  // Scroll to selected values when modal opens
  useEffect(() => {
    if (isOpen) {
      scrollToSelected();
    }
  }, [isOpen]);

  const scrollToSelected = () => {
    const itemHeight = 48;

    // Scroll each wheel to the selected item
    if (hoursRef.current) {
      const hourIndex = hours.indexOf(selectedHour);
      if (hourIndex !== -1) {
        const scrollPosition = hourIndex * itemHeight;
        hoursRef.current.scrollTop = scrollPosition;
      }
    }

    if (minutesRef.current) {
      const minuteIndex = minutes.indexOf(selectedMinute);
      if (minuteIndex !== -1) {
        const scrollPosition = minuteIndex * itemHeight;
        minutesRef.current.scrollTop = scrollPosition;
      }
    }

    if (periodRef.current) {
      const periodIndex = periods.indexOf(selectedPeriod);
      if (periodIndex !== -1) {
        const scrollPosition = periodIndex * itemHeight;
        periodRef.current.scrollTop = scrollPosition;
      }
    }
  };

  const handleScroll = (
    type: "hour" | "minute" | "period",
    ref: React.RefObject<HTMLDivElement | null>,
  ) => {
    if (!ref.current) return;

    const itemHeight = 48;
    const scrollTop = ref.current.scrollTop;

    // Calculate which item is currently centered
    const index = Math.round(scrollTop / itemHeight);

    if (type === "hour") {
      const hour = hours[index];
      if (hour !== undefined) setSelectedHour(hour);
    } else if (type === "minute") {
      const minute = minutes[index];
      if (minute !== undefined) setSelectedMinute(minute);
    } else if (type === "period") {
      const period = periods[index];
      if (period) setSelectedPeriod(period);
    }
  };

  const handleDone = () => {
    // Convert to 24-hour format
    let hours24 = selectedHour;
    if (selectedPeriod === "AM") {
      if (selectedHour === 12) hours24 = 0;
    } else {
      if (selectedHour !== 12) hours24 = selectedHour + 12;
    }

    const formatted = `${hours24.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const displayValue = value
    ? formatTime12(selectedHour, selectedMinute, selectedPeriod)
    : placeholder;

  return (
    <>
      {/* Input Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="border-input bg-card hover:border-primary focus-visible:ring-ring relative flex h-10 w-full items-center gap-2 rounded-lg border px-3 text-left font-mono text-sm tabular-nums transition-colors outline-none focus-visible:ring-2"
      >
        <Clock
          className="text-muted-foreground size-4 shrink-0"
          strokeWidth={1.5}
        />
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {displayValue}
        </span>
      </button>

      {/* Modal Picker */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="bg-background/80 absolute inset-0"
            onClick={() => setIsOpen(false)}
          />

          {/* Picker Content */}
          <div className="bg-background border-input relative w-full max-w-md rounded-xl border">
            {/* Header */}
            <div className="border-border flex items-center justify-between border-b px-4 py-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cancel"
                className="text-muted-foreground hover:bg-secondary hover:text-foreground inline-flex size-10 items-center justify-center rounded-lg transition-colors"
              >
                <X className="size-[18px]" strokeWidth={1.5} />
              </button>
              <h3 className="text-lg font-semibold">Select time</h3>
              <button
                type="button"
                onClick={handleDone}
                aria-label="Done"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex size-10 items-center justify-center rounded-lg transition-colors"
              >
                <Check className="size-[18px]" strokeWidth={1.5} />
              </button>
            </div>

            {/* Scroll Wheels */}
            <div className="relative px-4 py-6">
              {/* Selection Indicator */}
              <div className="border-input pointer-events-none absolute top-1/2 right-0 left-0 h-12 -translate-y-1/2 border-y" />

              <div className="flex gap-2">
                {/* Hours Wheel */}
                <div
                  ref={hoursRef}
                  onScroll={() => handleScroll("hour", hoursRef)}
                  className="scrollbar-hide h-60 flex-1 snap-y snap-mandatory overflow-y-scroll"
                  style={{
                    scrollSnapType: "y mandatory",
                    scrollPaddingTop: "96px",
                    scrollPaddingBottom: "96px",
                  }}
                >
                  <div className="h-24" /> {/* Top padding */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="flex h-12 snap-center scroll-my-24 items-center justify-center font-mono text-2xl tabular-nums"
                      style={{ scrollSnapAlign: "center" }}
                    >
                      {hour}
                    </div>
                  ))}
                  <div className="h-24" /> {/* Bottom padding */}
                </div>

                {/* Colon Separator */}
                <div className="text-muted-foreground flex items-center justify-center px-1 font-mono text-2xl">
                  :
                </div>

                {/* Minutes Wheel */}
                <div
                  ref={minutesRef}
                  onScroll={() => handleScroll("minute", minutesRef)}
                  className="scrollbar-hide h-60 flex-1 snap-y snap-mandatory overflow-y-scroll"
                  style={{
                    scrollSnapType: "y mandatory",
                    scrollPaddingTop: "96px",
                    scrollPaddingBottom: "96px",
                  }}
                >
                  <div className="h-24" /> {/* Top padding */}
                  {minutes.map((minute) => (
                    <div
                      key={minute}
                      className="flex h-12 snap-center scroll-my-24 items-center justify-center font-mono text-2xl tabular-nums"
                      style={{ scrollSnapAlign: "center" }}
                    >
                      {minute.toString().padStart(2, "0")}
                    </div>
                  ))}
                  <div className="h-24" /> {/* Bottom padding */}
                </div>

                {/* AM/PM Wheel */}
                <div
                  ref={periodRef}
                  onScroll={() => handleScroll("period", periodRef)}
                  className="scrollbar-hide h-60 flex-1 snap-y snap-mandatory overflow-y-scroll"
                  style={{
                    scrollSnapType: "y mandatory",
                    scrollPaddingTop: "96px",
                    scrollPaddingBottom: "96px",
                  }}
                >
                  <div className="h-24" /> {/* Top padding */}
                  {periods.map((period) => (
                    <div
                      key={period}
                      className="flex h-12 snap-center scroll-my-24 items-center justify-center font-mono text-2xl tabular-nums"
                      style={{ scrollSnapAlign: "center" }}
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
  );
}
