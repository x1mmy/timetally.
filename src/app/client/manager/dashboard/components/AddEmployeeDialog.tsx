/**
 * AddEmployeeDialog Component
 *
 * Dialog form for adding new employees from the manager dashboard.
 *
 * Features:
 * - Pay type selection (hourly vs day rate) with visual toggle buttons
 * - Dynamic rate labels that update based on pay type selection
 * - Form validation for required fields and PIN format
 * - Default pay rates: Weekday $25, Saturday $30, Sunday $35
 *
 * Pay Types:
 * - Hourly: Employee is paid based on hours worked (rate × hours)
 * - Day Rate: Employee is paid a flat rate per day worked (regardless of hours)
 *
 * @param onSuccess - Callback fired after successful employee creation
 */
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Clock, Calendar, Coffee } from "lucide-react";

interface AddEmployeeDialogProps {
  onSuccess?: () => void;
}

export function AddEmployeeDialog({ onSuccess }: AddEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pin, setPin] = useState("");
  const [payType, setPayType] = useState<"hourly" | "day_rate">("hourly");
  const [applyBreakRules, setApplyBreakRules] = useState(true);
  const [weekdayRate, setWeekdayRate] = useState("25.00");
  const [saturdayRate, setSaturdayRate] = useState("30.00");
  const [sundayRate, setSundayRate] = useState("35.00");
  const [publicHolidayRate, setPublicHolidayRate] = useState("50.00");

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPin("");
    setPayType("hourly");
    setApplyBreakRules(true);
    setWeekdayRate("25.00");
    setSaturdayRate("30.00");
    setSundayRate("35.00");
    setPublicHolidayRate("50.00");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/client/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          pin,
          payType,
          applyBreakRules,
          weekdayRate: parseFloat(weekdayRate),
          saturdayRate: parseFloat(saturdayRate),
          sundayRate: parseFloat(sundayRate),
          publicHolidayRate: parseFloat(publicHolidayRate),
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data?.error ?? "Failed to add employee");
        return;
      }

      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const rateLabel = payType === "hourly" ? "/hour" : "/day";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </DialogTrigger>

      <DialogContent className="border-neutral-700 bg-neutral-800">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="border-neutral-600 bg-neutral-700"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="border-neutral-600 bg-neutral-700"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">4-Digit PIN *</Label>
            <Input
              id="pin"
              type="text"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="1234"
              maxLength={4}
              className="border-neutral-600 bg-neutral-700"
              required
            />
          </div>

          {/* Pay Type Selector */}
          <div className="space-y-2">
            <Label>Pay Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayType("hourly")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                  payType === "hourly"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-neutral-600 bg-neutral-700 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-600"
                }`}
              >
                <Clock className="h-4 w-4" />
                Hourly Rate
              </button>
              <button
                type="button"
                onClick={() => setPayType("day_rate")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                  payType === "day_rate"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-neutral-600 bg-neutral-700 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-600"
                }`}
              >
                <Calendar className="h-4 w-4" />
                Day Rate
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              {payType === "hourly"
                ? "Employee is paid based on hours worked"
                : "Employee is paid a flat rate per day worked"}
            </p>
          </div>

          {/* Break Rules Toggle */}
          <div className="space-y-2">
            <Label>Break Time Rules</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setApplyBreakRules(true)}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                  applyBreakRules
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-neutral-600 bg-neutral-700 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-600"
                }`}
              >
                <Coffee className="h-4 w-4" />
                Apply Breaks
              </button>
              <button
                type="button"
                onClick={() => setApplyBreakRules(false)}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                  !applyBreakRules
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-neutral-600 bg-neutral-700 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-600"
                }`}
              >
                No Breaks
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              {applyBreakRules
                ? "Break time will be deducted based on shift length"
                : "No break time deductions applied"}
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Pay Rates (${rateLabel})
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label
                  htmlFor="weekdayRate"
                  className="text-xs text-neutral-400"
                >
                  Mon-Fri
                </Label>
                <Input
                  id="weekdayRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={weekdayRate}
                  onChange={(e) => setWeekdayRate(e.target.value)}
                  className="border-neutral-600 bg-neutral-700"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="saturdayRate"
                  className="text-xs text-neutral-400"
                >
                  Saturday
                </Label>
                <Input
                  id="saturdayRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={saturdayRate}
                  onChange={(e) => setSaturdayRate(e.target.value)}
                  className="border-neutral-600 bg-neutral-700"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="sundayRate"
                  className="text-xs text-neutral-400"
                >
                  Sunday
                </Label>
                <Input
                  id="sundayRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={sundayRate}
                  onChange={(e) => setSundayRate(e.target.value)}
                  className="border-neutral-600 bg-neutral-700"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="publicHolidayRate"
                  className="text-xs text-neutral-400"
                >
                  Public Holiday
                </Label>
                <Input
                  id="publicHolidayRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={publicHolidayRate}
                  onChange={(e) => setPublicHolidayRate(e.target.value)}
                  className="border-neutral-600 bg-neutral-700"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-neutral-600 bg-neutral-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
