/**
 * NSW Public Holiday Detection Utility
 *
 * Uses the date-holidays library to automatically calculate
 * NSW (New South Wales, Australia) public holidays.
 *
 * This is used for pay calculations - employees get their
 * public_holiday_rate when working on a public holiday.
 */

import Holidays from "date-holidays";

// Initialize for NSW, Australia
const hd = new Holidays("AU", "NSW");

/**
 * Check if a given date is a NSW public holiday
 *
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns true if the date is a public holiday
 */
export function isPublicHoliday(dateString: string): boolean {
  const date = new Date(dateString);
  const holiday = hd.isHoliday(date);

  if (!holiday) return false;

  // isHoliday returns false or an array of Holiday objects
  // Only return true for actual public holidays (type 'public')
  // The library also returns observance days which we want to exclude
  const holidays = Array.isArray(holiday) ? holiday : [holiday];
  return holidays.some((h) => h.type === "public");
}

/**
 * Get the name of the public holiday for a given date
 *
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Holiday name if it's a public holiday, null otherwise
 */
export function getHolidayName(dateString: string): string | null {
  const date = new Date(dateString);
  const holiday = hd.isHoliday(date);

  if (!holiday) return null;

  // isHoliday returns false or an array of Holiday objects
  const holidays = Array.isArray(holiday) ? holiday : [holiday];
  const publicHoliday = holidays.find((h) => h.type === "public");

  return publicHoliday?.name ?? null;
}

/**
 * Get all NSW public holidays for a given year
 *
 * Useful for displaying a reference list to users
 *
 * @param year - The year to get holidays for
 * @returns Array of holidays with date and name
 */
export function getPublicHolidaysForYear(
  year: number,
): { date: string; name: string }[] {
  const holidays = hd.getHolidays(year);

  return holidays
    .filter((h) => h.type === "public")
    .map((h) => ({
      date: h.date.split(" ")[0] ?? "", // Extract just the date part
      name: h.name,
    }));
}
