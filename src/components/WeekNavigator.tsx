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
    <div className="inline-flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onPrevious}
        aria-label="Previous week"
      >
        <ChevronLeft className="size-4" strokeWidth={1.5} />
      </Button>

      {/* Format: "4 Jan – 10 Jan 2025" */}
      <span className="text-muted-foreground min-w-[150px] text-center font-mono text-sm tabular-nums">
        {format(weekStart, "d MMM")} – {format(weekEnd, "d MMM yyyy")}
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={onNext}
        aria-label="Next week"
      >
        <ChevronRight className="size-4" strokeWidth={1.5} />
      </Button>
    </div>
  );
}
