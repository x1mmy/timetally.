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
            "flex h-9 w-full items-center justify-between rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white transition-colors",
            "hover:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary/50",
            className
          )}
        >
          <span>{format(value, "dd / MM / yyyy")}</span>
          <Calendar className="h-4 w-4 text-neutral-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          {/* Month/Year Header */}
          <div className="mb-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewDate(subMonths(viewDate, 1))}
              className="h-7 w-7 p-0 hover:bg-neutral-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(viewDate, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              className="h-7 w-7 p-0 hover:bg-neutral-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday Headers */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {weekDays.map((day, idx) => (
              <div
                key={day}
                className={cn(
                  "flex h-8 w-8 items-center justify-center text-xs font-medium",
                  idx >= 5 ? "text-red-400" : "text-neutral-500"
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
              <div key={`empty-${i}`} className="h-8 w-8" />
            ))}

            {/* Day cells */}
            {days.map((day) => {
              const isSelected = isSameDay(day, value);
              const isCurrentMonth = isSameMonth(day, viewDate);
              const dayOfWeek = getDay(day);
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  className={cn(
                    "h-8 w-8 rounded-md text-sm transition-colors",
                    isSelected
                      ? "bg-primary text-white"
                      : "hover:bg-neutral-800",
                    !isCurrentMonth && "text-neutral-600",
                    isWeekend && !isSelected && "text-red-400"
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
              className="w-full border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
            >
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
