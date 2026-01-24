/**
 * Employee Dialog Component
 *
 * A reusable modal dialog for creating and editing employee records.
 * Handles both "add" and "edit" modes with a single component.
 *
 * Features:
 * - Form validation (required fields, PIN format, pay rates)
 * - PIN uniqueness validation via API
 * - Automatic form population in edit mode
 * - Loading states and error handling
 * - Responsive design with Tailwind CSS
 * - Support for hourly and day rate pay types
 *
 * Props:
 * @param mode - 'add' for creating new employees, 'edit' for updating existing
 * @param employee - Employee object to edit (required in edit mode)
 * @param onSuccess - Callback function called after successful save
 * @param trigger - Optional custom trigger element (default: styled button)
 *
 * API Endpoints:
 * - POST /api/client/employees - Creates new employee
 * - PUT /api/client/employees/[id] - Updates existing employee
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Edit, Loader2, Clock, Calendar } from "lucide-react";
import type { Employee } from "@/types/database";

interface EmployeeDialogProps {
  mode: "add" | "edit";
  employee?: Employee;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function EmployeeDialog({
  mode,
  employee,
  onSuccess,
  trigger,
}: EmployeeDialogProps) {
  // Dialog and loading state
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields state
  // Default pay rates: Weekday $25, Saturday $30, Sunday $35
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pin, setPin] = useState("");
  const [payType, setPayType] = useState<"hourly" | "day_rate">("hourly");
  const [weekdayRate, setWeekdayRate] = useState("25.00");
  const [saturdayRate, setSaturdayRate] = useState("30.00");
  const [sundayRate, setSundayRate] = useState("35.00");

  /**
   * Initialize or reset form based on mode and dialog state
   * - Edit mode: Pre-populate with employee data
   * - Add mode: Reset to default values
   */
  useEffect(() => {
    if (mode === "edit" && employee) {
      // Pre-populate form with existing employee data
      setFirstName(employee.first_name);
      setLastName(employee.last_name);
      setPin(employee.pin);
      setPayType((employee.pay_type as "hourly" | "day_rate" | undefined) ?? "hourly");
      setWeekdayRate(employee.weekday_rate.toFixed(2));
      setSaturdayRate(employee.saturday_rate.toFixed(2));
      setSundayRate(employee.sunday_rate.toFixed(2));
    } else if (mode === "add") {
      // Reset to default values when opening in add mode
      setFirstName("");
      setLastName("");
      setPin("");
      setPayType("hourly");
      setWeekdayRate("25.00");
      setSaturdayRate("30.00");
      setSundayRate("35.00");
    }
  }, [mode, employee, open]);

  /**
   * Handle form submission
   * Validates all fields, sends API request, and handles response
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation before sending to API

    // Validate required text fields
    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }
    if (!lastName.trim()) {
      setError("Last name is required");
      return;
    }

    // Validate PIN format: must be exactly 4 digits
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    // Parse and validate pay rates
    const weekdayRateNum = parseFloat(weekdayRate);
    const saturdayRateNum = parseFloat(saturdayRate);
    const sundayRateNum = parseFloat(sundayRate);

    if (isNaN(weekdayRateNum) || weekdayRateNum < 0) {
      setError("Weekday rate must be a valid positive number");
      return;
    }
    if (isNaN(saturdayRateNum) || saturdayRateNum < 0) {
      setError("Saturday rate must be a valid positive number");
      return;
    }
    if (isNaN(sundayRateNum) || sundayRateNum < 0) {
      setError("Sunday rate must be a valid positive number");
      return;
    }

    setLoading(true);

    try {
      // Build request payload
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        pin,
        payType,
        weekdayRate: weekdayRateNum,
        saturdayRate: saturdayRateNum,
        sundayRate: sundayRateNum,
      };

      let response: Response;

      // Send POST request for new employees
      if (mode === "add") {
        response = await fetch("/api/client/employees", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Send PUT request for updating existing employees
        response = await fetch(`/api/client/employees/${employee?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const data = (await response.json()) as { error?: string };

      // Handle API errors (validation, duplicate PIN, etc.)
      if (!response.ok) {
        setError(data.error ?? "Failed to save employee");
        setLoading(false);
        return;
      }

      // Success - close dialog and reset loading state
      setOpen(false);
      setLoading(false);

      // Reset form to defaults after successful add (not needed for edit mode)
      if (mode === "add") {
        setFirstName("");
        setLastName("");
        setPin("");
        setPayType("hourly");
        setWeekdayRate("25.00");
        setSaturdayRate("30.00");
        setSundayRate("35.00");
      }

      // Call success callback to refresh employee list
      onSuccess?.();
    } catch (err) {
      // Handle unexpected errors (network issues, etc.)
      console.error("Error saving employee:", err);
      setError("Failed to save employee");
      setLoading(false);
    }
  };

  /**
   * Handle PIN input changes
   * Restricts input to numeric digits only and max 4 characters
   */
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-digit characters
    if (value.length <= 4) {
      setPin(value);
    }
  };

  const rateLabel = payType === "hourly" ? "per hour" : "per day";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger button - uses custom trigger if provided, otherwise default styled button */}
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            size={mode === "edit" ? "sm" : "default"}
            variant={mode === "edit" ? "outline" : "default"}
            className={
              mode === "edit"
                ? "hover:bg-primary/20 hover:border-primary border-neutral-700 bg-neutral-800"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }
          >
            {mode === "edit" ? (
              <Edit className="h-4 w-4" />
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Employee
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-neutral-700 bg-neutral-800 text-white sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "add" ? "Add New Employee" : "Edit Employee"}
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              {mode === "add"
                ? "Enter employee details and pay rates"
                : "Update employee details and pay rates"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* First Name */}
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
                className="border-neutral-600 bg-neutral-700"
              />
            </div>

            {/* Last Name */}
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
                className="border-neutral-600 bg-neutral-700"
              />
            </div>

            {/* PIN */}
            <div className="grid gap-2">
              <Label htmlFor="pin">4-Digit PIN</Label>
              <Input
                id="pin"
                type="text"
                inputMode="numeric"
                value={pin}
                onChange={handlePinChange}
                placeholder="1234"
                maxLength={4}
                required
                className="border-neutral-600 bg-neutral-700"
              />
              <p className="text-xs text-neutral-400">
                Used for employee clock in/out
              </p>
            </div>

            {/* Pay Type Selector */}
            <div className="grid gap-2">
              <Label>Pay Type</Label>
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
                  ? "Paid based on hours worked"
                  : "Paid a flat rate per day worked"}
              </p>
            </div>

            {/* Pay Rates */}
            <div className="grid gap-2">
              <Label className="text-base font-semibold">
                Pay Rates ({rateLabel})
              </Label>

              <div className="grid gap-3">
                {/* Weekday Rate */}
                <div className="grid grid-cols-2 items-center gap-2">
                  <Label htmlFor="weekdayRate" className="text-sm font-normal">
                    Mon-Fri
                  </Label>
                  <div className="flex items-center">
                    <span className="mr-2 text-neutral-400">$</span>
                    <Input
                      id="weekdayRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={weekdayRate}
                      onChange={(e) => setWeekdayRate(e.target.value)}
                      required
                      className="border-neutral-600 bg-neutral-700"
                    />
                  </div>
                </div>

                {/* Saturday Rate */}
                <div className="grid grid-cols-2 items-center gap-2">
                  <Label htmlFor="saturdayRate" className="text-sm font-normal">
                    Saturday
                  </Label>
                  <div className="flex items-center">
                    <span className="mr-2 text-neutral-400">$</span>
                    <Input
                      id="saturdayRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={saturdayRate}
                      onChange={(e) => setSaturdayRate(e.target.value)}
                      required
                      className="border-neutral-600 bg-neutral-700"
                    />
                  </div>
                </div>

                {/* Sunday Rate */}
                <div className="grid grid-cols-2 items-center gap-2">
                  <Label htmlFor="sundayRate" className="text-sm font-normal">
                    Sunday
                  </Label>
                  <div className="flex items-center">
                    <span className="mr-2 text-neutral-400">$</span>
                    <Input
                      id="sundayRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={sundayRate}
                      onChange={(e) => setSundayRate(e.target.value)}
                      required
                      className="border-neutral-600 bg-neutral-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-900/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-neutral-600 bg-neutral-700 hover:bg-neutral-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "add" ? "Adding..." : "Updating..."}
                </>
              ) : mode === "add" ? (
                "Add Employee"
              ) : (
                "Update Employee"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
