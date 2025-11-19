/**
 * WeekNavigator Component
 * Navigation controls for moving between weeks
 * Features:
 * - Previous/Next week buttons
 * - Displays week date range
 * - Formatted date display (e.g., "4 Jan - 10 Jan 2025")
 */
"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface WeekNavigatorProps {
  /** Start date of the week (Sunday or Monday) */
  weekStart: Date;
  /** End date of the week (Saturday or Sunday) */
  weekEnd: Date;
  /** Callback when previous week button is clicked */
  onPrevious: () => void;
  /** Callback when next week button is clicked */
  onNext: () => void;
}

export function WeekNavigator({
  weekStart,
  weekEnd,
  onPrevious,
  onNext,
}: WeekNavigatorProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      {/* Previous Week Button */}
      <Button
        variant="outline"
        onClick={onPrevious}
        className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
      >
        <ChevronLeft className="mr-2 h-5 w-5" />
        Previous Week
      </Button>

      {/* Week Date Range Display */}
      <div className="text-lg font-semibold">
        {/* Format: "4 Jan - 10 Jan 2025" */}
        {format(weekStart, "d MMM")} - {format(weekEnd, "d MMM yyyy")}
      </div>

      {/* Next Week Button */}
      <Button
        variant="outline"
        onClick={onNext}
        className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
      >
        Next Week
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}
