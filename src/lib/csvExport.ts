/**
 * Universal Payroll CSV Export
 *
 * Generates payroll-ready CSV exports compatible with Australian payroll systems:
 * - MYOB (AccountRight & Business)
 * - Xero Payroll AU (via UpSheets or similar tools)
 * - QuickBooks Online Payroll AU
 *
 * Format uses a single row per employee with separate columns for each pay type.
 * See: Australian Payroll CSV Import Format Guide
 */

interface EmployeePayrollData {
  firstName: string;
  lastName: string;
  weekdayHours: number;
  saturdayHours: number;
  sundayHours: number;
  totalHours: number;
  payType: "hourly" | "day_rate";
  breakMinutes: number;
  applyBreakRules: boolean;
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
 * Creates a single row per employee with separate columns for each pay type
 * (Ordinary Hours, Saturday Rate, Sunday Rate).
 */
export function exportPayrollToCSV({
  employees,
  weekEndingDate,
}: ExportOptions): void {
  const lines: string[] = [];

  // Column headers - One row per employee format
  const headers = [
    "EmployeeID",
    "FirstName",
    "LastName",
    "Date",
    "Ordinary Hours",
    "Saturday Hours",
    "Sunday Hours",
    "Total Hours",
    "Pay Style",
    "Breaks Taken",
    "Location",
    "Notes",
  ];
  lines.push(headers.map(escapeCSVField).join(","));

  // Format week-ending date once
  const formattedDate = formatDateAU(weekEndingDate);

  // Generate timesheet rows - one row per employee with all pay types
  employees.forEach((employee, index) => {
    const employeeID = generateEmployeeID(index);
    const {
      firstName,
      lastName,
      weekdayHours,
      saturdayHours,
      sundayHours,
      totalHours,
      payType,
      breakMinutes,
      applyBreakRules
    } = employee;

    // Format pay style for display
    const payStyleDisplay = payType === "day_rate" ? "Day Rate" : "Hourly";

    // Format breaks - if no break rules apply, show "No breaks"
    const breaksDisplay = !applyBreakRules
      ? "No breaks"
      : `${breakMinutes} minutes`;

    // Create single row with all pay types as separate columns
    const row = [
      employeeID,
      firstName,
      lastName,
      formattedDate,
      weekdayHours.toFixed(2),  // Ordinary Hours (always shown, even if 0)
      saturdayHours.toFixed(2), // Saturday Hours (always shown, even if 0)
      sundayHours.toFixed(2),   // Sunday Hours (always shown, even if 0)
      totalHours.toFixed(2),    // Total Hours
      payStyleDisplay,          // Pay Style (Hourly or Day Rate)
      breaksDisplay,            // Breaks Taken
      "",                       // Location (blank - can be filled manually)
      "",                       // Notes (blank)
    ];
    lines.push(row.map(escapeCSVField).join(","));
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

/**
 * Prints payroll data as a formatted table
 *
 * Opens a print dialog with the payroll data displayed in a clean,
 * printer-friendly table format.
 */
export function printPayrollCSV({
  employees,
  weekEndingDate,
}: ExportOptions): void {
  const formattedDate = formatDateAU(weekEndingDate);

  // Build HTML table
  let tableHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payroll Timesheets - ${formattedDate}</title>
      <style>
        @media print {
          @page {
            margin: 1cm;
            size: auto;
          }
          body {
            margin: 0;
          }
          /* Hide browser-generated headers and footers */
          @page {
            margin-top: 1cm;
            margin-bottom: 1cm;
          }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          font-size: 18px;
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #333;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .numeric {
          text-align: right;
        }
      </style>
    </head>
    <body>
      <h1>Payroll Timesheets - Week Ending ${formattedDate}</h1>
      <table>
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Date</th>
            <th class="numeric">Ordinary Hours</th>
            <th class="numeric">Saturday Hours</th>
            <th class="numeric">Sunday Hours</th>
            <th class="numeric">Total Hours</th>
            <th>Pay Style</th>
            <th>Breaks Taken</th>
            <th>Location</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Add employee rows
  employees.forEach((employee, index) => {
    const employeeID = generateEmployeeID(index);
    const {
      firstName,
      lastName,
      weekdayHours,
      saturdayHours,
      sundayHours,
      totalHours,
      payType,
      breakMinutes,
      applyBreakRules
    } = employee;

    // Format pay style for display
    const payStyleDisplay = payType === "day_rate" ? "Day Rate" : "Hourly";

    // Format breaks - if no break rules apply, show "No breaks"
    const breaksDisplay = !applyBreakRules
      ? "No breaks"
      : `${breakMinutes} minutes`;

    tableHTML += `
          <tr>
            <td>${employeeID}</td>
            <td>${firstName}</td>
            <td>${lastName}</td>
            <td>${formattedDate}</td>
            <td class="numeric">${weekdayHours.toFixed(2)}</td>
            <td class="numeric">${saturdayHours.toFixed(2)}</td>
            <td class="numeric">${sundayHours.toFixed(2)}</td>
            <td class="numeric">${totalHours.toFixed(2)}</td>
            <td>${payStyleDisplay}</td>
            <td>${breaksDisplay}</td>
            <td></td>
            <td></td>
          </tr>
    `;
  });

  tableHTML += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Create a hidden iframe for printing
  const printWindow = document.createElement('iframe');
  printWindow.style.position = 'fixed';
  printWindow.style.right = '0';
  printWindow.style.bottom = '0';
  printWindow.style.width = '0';
  printWindow.style.height = '0';
  printWindow.style.border = 'none';
  document.body.appendChild(printWindow);

  // Write content and trigger print
  const doc = printWindow.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(tableHTML);
    doc.close();

    // Wait for content to load, then print
    printWindow.contentWindow?.focus();
    setTimeout(() => {
      printWindow.contentWindow?.print();
      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(printWindow);
      }, 100);
    }, 250);
  }
}
