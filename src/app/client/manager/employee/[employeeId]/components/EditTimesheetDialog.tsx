/**
 * EditTimesheetDialog Component
 * Dialog for editing timesheet start and end times
 * Features:
 * - Edit start and end times using TimeInput component
 * - Validation (both times required, end time after start time)
 * - Uses existing POST /api/client/timesheets endpoint (supports updates)
 * - Auto-calculates break time and total hours via database triggers
 */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TimeInput } from "@/components/TimeInput";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface EditTimesheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  /** Shown in the dialog's sub-line next to the date */
  employeeName?: string;
  workDate: string;
  startTime: string | null;
  endTime: string | null;
  onSuccess?: () => void;
}

export function EditTimesheetDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  workDate,
  startTime: initialStartTime,
  endTime: initialEndTime,
  onSuccess,
}: EditTimesheetDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state - store times in HH:MM format for TimeInput
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  /**
   * Initialize form when dialog opens or times change
   * Convert HH:MM:SS to HH:MM for TimeInput
   */
  useEffect(() => {
    if (open) {
      // Convert HH:MM:SS to HH:MM format
      setStartTime(
        initialStartTime ? initialStartTime.substring(0, 5) : "",
      );
      setEndTime(initialEndTime ? initialEndTime.substring(0, 5) : "");
      setError(null);
    }
  }, [open, initialStartTime, initialEndTime]);

  /**
   * Handle form submission
   * Validates times and sends update to API
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate both times are provided
    if (!startTime.trim() || !endTime.trim()) {
      setError("Both start time and end time are required");
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      setError("Start time must be in HH:MM format (e.g., 09:00)");
      return;
    }
    if (!timeRegex.test(endTime)) {
      setError("End time must be in HH:MM format (e.g., 17:00)");
      return;
    }

    // Validate end time is after start time
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);

    if (end <= start) {
      setError("End time must be after start time");
      return;
    }

    setLoading(true);

    try {
      // Convert HH:MM to HH:MM:SS format for API
      const startTimeFormatted = `${startTime}:00`;
      const endTimeFormatted = `${endTime}:00`;

      const response = await fetch("/api/client/timesheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          workDate,
          startTime: startTimeFormatted,
          endTime: endTimeFormatted,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Failed to update timesheet");
        setLoading(false);
        return;
      }

      // Success - close dialog
      onOpenChange(false);
      setLoading(false);

      // Call success callback to refresh data
      onSuccess?.();
    } catch (err) {
      console.error("Error updating timesheet:", err);
      setError("Failed to update timesheet");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader className="pr-8">
            <DialogTitle>
              {initialStartTime ? "Edit timesheet" : "Add hours"}
            </DialogTitle>
            <DialogDescription>
              {employeeName ? `${employeeName} · ` : ""}
              {format(parseISO(workDate), "EEEE d MMMM yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <TimeInput
              label="Start time"
              value={startTime}
              onChange={setStartTime}
              placeholder="09:00"
            />
            <TimeInput
              label="End time"
              value={endTime}
              onChange={setEndTime}
              placeholder="17:00"
            />

            {error && (
              <p
                role="alert"
                className="bg-warn/10 text-warn rounded-lg px-3 py-2 text-sm"
              >
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="border-border border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" strokeWidth={1.5} />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
