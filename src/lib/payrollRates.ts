/**
 * Pay rate for a calendar work date: NSW public holiday first, then day-of-week.
 * Matches manager employee detail breakdown logic.
 */

import { getDay } from "date-fns";
import { isPublicHoliday } from "~/lib/holidays";
import type { Employee, TimesheetWithEmployee } from "~/types/database";

export async function rateForDate(
  dateString: string,
  emp: Employee,
): Promise<number> {
  if (await isPublicHoliday(dateString)) {
    return (emp.public_holiday_rate as number | undefined) ?? emp.weekday_rate * 2;
  }

  const dayOfWeek = getDay(new Date(dateString));
  if (dayOfWeek === 0) return emp.sunday_rate;
  if (dayOfWeek === 6) return emp.saturday_rate;
  return emp.weekday_rate;
}

/**
 * Total pay and distinct days worked for timesheets in a period.
 * Hourly: sum of hours × rate per row. Day rate: sum of rate once per unique work_date.
 */
export async function payrollForPeriod(
  emp: Employee,
  sheets: TimesheetWithEmployee[],
): Promise<{ totalPay: number; daysWorked: number }> {
  const complete = sheets.filter((r) => !!r.end_time);
  if (complete.length === 0) return { totalPay: 0, daysWorked: 0 };

  const uniqueDates = new Set(complete.map((r) => r.work_date));
  const daysWorked = uniqueDates.size;

  if (emp.pay_type === "day_rate") {
    let totalPay = 0;
    for (const d of uniqueDates) {
      totalPay += await rateForDate(d, emp);
    }
    return { totalPay, daysWorked };
  }

  let totalPay = 0;
  for (const ts of complete) {
    const h = parseFloat(ts.total_hours.toString());
    totalPay += h * (await rateForDate(ts.work_date, emp));
  }
  return { totalPay, daysWorked };
}
