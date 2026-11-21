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
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Employee, EmployeeCategory } from "@/types/database";

// Segmented control ("on" = bg-secondary for readable contrast) and field label styles
const segGroup =
  "inline-flex divide-x divide-input overflow-hidden rounded-lg border border-input bg-card";
const segBtn = (on: boolean): string =>
  cn(
    "min-h-10 px-4 text-sm transition-colors",
    on
      ? "bg-secondary text-foreground"
      : "text-muted-foreground hover:text-foreground",
  );
const fieldLabel = "text-muted-foreground text-[13px] font-normal";
const hint = "text-muted-foreground text-xs";

interface EmployeeDialogProps {
  mode: "add" | "edit";
  employee?: Employee;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  categories?: EmployeeCategory[];
}

export function EmployeeDialog({
  mode,
  employee,
  onSuccess,
  trigger,
  categories = [],
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
  const [applyBreakRules, setApplyBreakRules] = useState(true);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [weekdayRate, setWeekdayRate] = useState("25.00");
  const [saturdayRate, setSaturdayRate] = useState("30.00");
  const [sundayRate, setSundayRate] = useState("35.00");
  const [publicHolidayRate, setPublicHolidayRate] = useState("50.00");

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
      setApplyBreakRules((employee.apply_break_rules as boolean | undefined) ?? true);
      setCategoryId(employee.category_id ?? null);
      setWeekdayRate(employee.weekday_rate.toFixed(2));
      setSaturdayRate(employee.saturday_rate.toFixed(2));
      setSundayRate(employee.sunday_rate.toFixed(2));
      setPublicHolidayRate(((employee.public_holiday_rate as number | undefined) ?? employee.weekday_rate * 2).toFixed(2));
    } else if (mode === "add") {
      // Reset to default values when opening in add mode
      setFirstName("");
      setLastName("");
      setPin("");
      setPayType("hourly");
      setApplyBreakRules(true);
      setCategoryId(null);
      setWeekdayRate("25.00");
      setSaturdayRate("30.00");
      setSundayRate("35.00");
      setPublicHolidayRate("50.00");
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
    const publicHolidayRateNum = parseFloat(publicHolidayRate);

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
    if (isNaN(publicHolidayRateNum) || publicHolidayRateNum < 0) {
      setError("Public holiday rate must be a valid positive number");
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
        applyBreakRules,
        categoryId,
        weekdayRate: weekdayRateNum,
        saturdayRate: saturdayRateNum,
        sundayRate: sundayRateNum,
        publicHolidayRate: publicHolidayRateNum,
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
        setApplyBreakRules(true);
        setCategoryId(null);
        setWeekdayRate("25.00");
        setSaturdayRate("30.00");
        setSundayRate("35.00");
        setPublicHolidayRate("50.00");
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
      {/* Trigger - uses custom trigger if provided, otherwise "Add employee" button or "Edit" text link */}
      <DialogTrigger asChild>
        {trigger ??
          (mode === "edit" ? (
            <button
              type="button"
              className="text-muted-foreground hover:text-primary -mx-2 inline-block px-2 py-2 text-sm transition-colors"
            >
              Edit
            </button>
          ) : (
            <Button>Add employee</Button>
          ))}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>
              {mode === "add" ? "Add employee" : "Edit employee"}
            </DialogTitle>
            <DialogDescription>
              {mode === "add"
                ? "Enter employee details and pay rates"
                : "Update employee details and pay rates"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            {/* First Name + Last Name */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="firstName" className={fieldLabel}>
                  First name
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="lastName" className={fieldLabel}>
                  Last name
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            {/* PIN */}
            <div className="grid gap-1.5">
              <Label htmlFor="pin" className={fieldLabel}>
                4-digit PIN
              </Label>
              <Input
                id="pin"
                type="text"
                inputMode="numeric"
                value={pin}
                onChange={handlePinChange}
                placeholder="1234"
                maxLength={4}
                required
                className="max-w-36 font-mono tracking-[0.2em] tabular-nums"
              />
              <p className={hint}>Used for employee clock in/out</p>
            </div>

            {/* Pay Type Selector */}
            <div className="grid gap-1.5">
              <Label id="payTypeLabel" className={fieldLabel}>
                Pay type
              </Label>
              <div
                role="group"
                aria-labelledby="payTypeLabel"
                className={segGroup}
              >
                <button
                  type="button"
                  aria-pressed={payType === "hourly"}
                  onClick={() => setPayType("hourly")}
                  className={segBtn(payType === "hourly")}
                >
                  Hourly
                </button>
                <button
                  type="button"
                  aria-pressed={payType === "day_rate"}
                  onClick={() => setPayType("day_rate")}
                  className={segBtn(payType === "day_rate")}
                >
                  Day rate
                </button>
              </div>
              <p className={hint}>
                {payType === "hourly"
                  ? "Paid based on hours worked"
                  : "Paid a flat rate per day worked"}
              </p>
            </div>

            {/* Break Rules Toggle */}
            <div className="grid gap-1.5">
              <Label id="breakRulesLabel" className={fieldLabel}>
                Break time rules
              </Label>
              <div
                role="group"
                aria-labelledby="breakRulesLabel"
                className={segGroup}
              >
                <button
                  type="button"
                  aria-pressed={applyBreakRules}
                  onClick={() => setApplyBreakRules(true)}
                  className={segBtn(applyBreakRules)}
                >
                  Apply breaks
                </button>
                <button
                  type="button"
                  aria-pressed={!applyBreakRules}
                  onClick={() => setApplyBreakRules(false)}
                  className={segBtn(!applyBreakRules)}
                >
                  No breaks
                </button>
              </div>
              <p className={hint}>
                {applyBreakRules
                  ? "Break time will be deducted based on shift length"
                  : "No break time deductions applied"}
              </p>
            </div>

            {/* Category */}
            <div className="grid gap-1.5">
              <Label htmlFor="category" className={fieldLabel}>
                Category
              </Label>
              <select
                id="category"
                value={categoryId ?? "__none__"}
                onChange={(e) =>
                  setCategoryId(
                    e.target.value === "__none__" ? null : e.target.value,
                  )
                }
                className="bg-card text-foreground border-input focus-visible:border-primary focus-visible:ring-primary/15 h-10 w-full rounded-lg border px-3 text-base outline-none focus-visible:ring-[3px] md:text-sm"
              >
                <option value="__none__">None</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <p className={hint}>
                Optional. Used to organise staff on the payroll dashboard
              </p>
            </div>

            {/* Pay Rates */}
            <fieldset className="grid gap-1.5">
              <legend className="text-muted-foreground mb-1.5 text-[13px]">
                Pay rates {rateLabel}
              </legend>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Weekday Rate */}
                <div className="grid gap-1">
                  <Label
                    htmlFor="weekdayRate"
                    className={cn(fieldLabel, "text-xs")}
                  >
                    Weekday
                  </Label>
                  <div className="relative">
                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                      $
                    </span>
                    <Input
                      id="weekdayRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={weekdayRate}
                      onChange={(e) => setWeekdayRate(e.target.value)}
                      required
                      className="pl-6 font-mono tabular-nums"
                    />
                  </div>
                </div>

                {/* Saturday Rate */}
                <div className="grid gap-1">
                  <Label
                    htmlFor="saturdayRate"
                    className={cn(fieldLabel, "text-xs")}
                  >
                    Saturday
                  </Label>
                  <div className="relative">
                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                      $
                    </span>
                    <Input
                      id="saturdayRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={saturdayRate}
                      onChange={(e) => setSaturdayRate(e.target.value)}
                      required
                      className="pl-6 font-mono tabular-nums"
                    />
                  </div>
                </div>

                {/* Sunday Rate */}
                <div className="grid gap-1">
                  <Label
                    htmlFor="sundayRate"
                    className={cn(fieldLabel, "text-xs")}
                  >
                    Sunday
                  </Label>
                  <div className="relative">
                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                      $
                    </span>
                    <Input
                      id="sundayRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={sundayRate}
                      onChange={(e) => setSundayRate(e.target.value)}
                      required
                      className="pl-6 font-mono tabular-nums"
                    />
                  </div>
                </div>

                {/* Public Holiday Rate */}
                <div className="grid gap-1">
                  <Label
                    htmlFor="publicHolidayRate"
                    className={cn(fieldLabel, "text-xs")}
                  >
                    Public holiday
                  </Label>
                  <div className="relative">
                    <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                      $
                    </span>
                    <Input
                      id="publicHolidayRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={publicHolidayRate}
                      onChange={(e) => setPublicHolidayRate(e.target.value)}
                      required
                      className="pl-6 font-mono tabular-nums"
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="bg-warn/10 text-warn rounded-lg px-3 py-2 text-sm"
              >
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
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 strokeWidth={1.5} className="size-4 animate-spin" />
                  {mode === "add" ? "Adding…" : "Saving…"}
                </>
              ) : mode === "add" ? (
                "Add employee"
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
