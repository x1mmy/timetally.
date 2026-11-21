"use client";

import * as React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState(value);

  // Update viewDate when value changes externally
  React.useEffect(() => {
    setViewDate(value);
  }, [value]);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week the month starts on (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = getDay(monthStart);
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const handleSelectDate = (date: Date) => {
    onChange(date);
    setOpen(false);
  };

  const handleClear = () => {
    setOpen(false);
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "bg-card text-foreground border-input flex h-10 w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 font-mono text-[13.5px] tabular-nums transition-colors",
            "hover:border-primary focus-visible:border-primary focus-visible:ring-primary/15 outline-none focus-visible:ring-[3px]",
            className
          )}
        >
          <span>{format(value, "dd / MM / yyyy")}</span>
          <Calendar className="text-muted-foreground size-4" strokeWidth={1.5} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          {/* Month/Year Header */}
          <div className="mb-3 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setViewDate(subMonths(viewDate, 1))}
              size="icon"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" strokeWidth={1.5} />
            </Button>
            <span className="text-sm font-medium">
              {format(viewDate, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              size="icon"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" strokeWidth={1.5} />
            </Button>
          </div>

          {/* Weekday Headers */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {weekDays.map((day, idx) => (
              <div
                key={day}
                className={cn(
                  "flex size-9 items-center justify-center font-mono text-[11px]",
                  idx === 5 ? "text-sat" : idx === 6 ? "text-sun" : "text-muted-foreground"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: adjustedStartDay }).map((_, i) => (
              <div key={`empty-${i}`} className="size-9" />
            ))}

            {/* Day cells */}
            {days.map((day) => {
              const isSelected = isSameDay(day, value);
              const isCurrentMonth = isSameMonth(day, viewDate);
              const dayOfWeek = getDay(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  className={cn(
                    "focus-visible:ring-ring size-9 rounded-lg font-mono text-[13px] tabular-nums transition-colors outline-none focus-visible:ring-2",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary",
                    !isCurrentMonth && "text-muted-foreground",
                    !isSelected && dayOfWeek === 6 && "text-sat",
                    !isSelected && dayOfWeek === 0 && "text-sun"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Clear Button */}
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="w-full"
            >
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
