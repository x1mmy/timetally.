/**
 * Universal Payroll CSV Export
 *
 * Generates payroll-ready CSV exports compatible with Australian payroll systems:
 * - MYOB (AccountRight & Business)
 * - Xero Payroll AU (via UpSheets or similar tools)
 * - QuickBooks Online Payroll AU
 *
 * Format follows the universal structure with separate rows per pay type.
 * See: Australian Payroll CSV Import Format Guide
 */

interface EmployeePayrollData {
  firstName: string;
  lastName: string;
  weekdayHours: number;
  saturdayHours: number;
  sundayHours: number;
}

interface ExportOptions {
  employees: EmployeePayrollData[];
  weekEndingDate: Date; // Week-ending date (e.g., Sunday of the week)
}

/**
 * Escapes CSV field values to handle commas, quotes, and newlines
 */
function escapeCSVField(field: string | number): string {
  const stringField = String(field);
  if (
    stringField.includes(",") ||
    stringField.includes('"') ||
    stringField.includes("\n")
  ) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}

/**
 * Formats a date as DD/MM/YYYY (Australian standard)
 * Universal format accepted by MYOB, Xero, and QuickBooks
 */
function formatDateAU(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Generates employee ID in format EMP001, EMP002, etc.
 */
function generateEmployeeID(index: number): string {
  return `EMP${String(index + 1).padStart(3, "0")}`;
}

/**
 * Exports payroll data to CSV in universal format
 *
 * Creates separate rows for each pay type (Ordinary Hours, Saturday Rate, Sunday Rate)
 * following the structure required by MYOB, Xero, and QuickBooks.
 */
export function exportPayrollToCSV({
  employees,
  weekEndingDate,
}: ExportOptions): void {
  const lines: string[] = [];

  // Column headers - Universal format
  const headers = [
    "EmployeeID",
    "FirstName",
    "LastName",
    "Date",
    "Hours",
    "PayType",
    "Location",
    "Notes",
  ];
  lines.push(headers.map(escapeCSVField).join(","));

  // Format week-ending date once
  const formattedDate = formatDateAU(weekEndingDate);

  // Generate timesheet rows - separate row per pay type per employee
  employees.forEach((employee, index) => {
    const employeeID = generateEmployeeID(index);
    const { firstName, lastName, weekdayHours, saturdayHours, sundayHours } = employee;

    // Add row for Ordinary Hours (weekday) if hours > 0
    if (weekdayHours > 0) {
      const row = [
        employeeID,
        firstName,
        lastName,
        formattedDate,
        weekdayHours.toFixed(2), // Decimal format (e.g., 38.50)
        "Ordinary Hours",
        "", // Location (blank - can be filled manually)
        "", // Notes (blank)
      ];
      lines.push(row.map(escapeCSVField).join(","));
    }

    // Add row for Saturday Rate if hours > 0
    if (saturdayHours > 0) {
      const row = [
        employeeID,
        firstName,
        lastName,
        formattedDate,
        saturdayHours.toFixed(2),
        "Saturday Rate",
        "",
        "",
      ];
      lines.push(row.map(escapeCSVField).join(","));
    }

    // Add row for Sunday Rate if hours > 0
    if (sundayHours > 0) {
      const row = [
        employeeID,
        firstName,
        lastName,
        formattedDate,
        sundayHours.toFixed(2),
        "Sunday Rate",
        "",
        "",
      ];
      lines.push(row.map(escapeCSVField).join(","));
    }
  });

  // Create CSV content
  const csvContent = lines.join("\n");

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  // Generate filename with week-ending date
  const dateStr = formatDateAU(weekEndingDate).replace(/\//g, "-");
  const filename = `payroll_timesheets_${dateStr}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up URL object
  URL.revokeObjectURL(url);
}
