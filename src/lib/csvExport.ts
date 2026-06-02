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

  // Open a new window for printing
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert(
      "Pop-ups are blocked. Please allow pop-ups for this site to use the print function.",
    );
    return;
  }

  const doc = win.document;
  doc.title = `Payroll Timesheets - ${formattedDate}`;

  // Inject stylesheet
  const style = doc.createElement("style");
  style.textContent = `
    @media print { @page { margin: 1cm; size: auto; } body { margin: 0; } }
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { font-size: 18px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
    th { background-color: #f0f0f0; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .numeric { text-align: right; }
  `;
  doc.head.appendChild(style);

  // Title heading
  const h1 = doc.createElement("h1");
  h1.textContent = `Payroll Timesheets - Week Ending ${formattedDate}`;
  doc.body.appendChild(h1);

  // Build table using safe DOM methods
  const table = doc.createElement("table");

  // Header row
  const thead = doc.createElement("thead");
  const headerRow = doc.createElement("tr");
  const headers = [
    { label: "Employee ID", numeric: false },
    { label: "First Name", numeric: false },
    { label: "Last Name", numeric: false },
    { label: "Date", numeric: false },
    { label: "Ordinary Hours", numeric: true },
    { label: "Saturday Hours", numeric: true },
    { label: "Sunday Hours", numeric: true },
    { label: "Total Hours", numeric: true },
    { label: "Pay Style", numeric: false },
    { label: "Breaks Taken", numeric: false },
    { label: "Location", numeric: false },
    { label: "Notes", numeric: false },
  ];
  for (const h of headers) {
    const th = doc.createElement("th");
    if (h.numeric) th.className = "numeric";
    th.textContent = h.label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body rows — each cell uses textContent so no HTML injection is possible
  const tbody = doc.createElement("tbody");
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
      applyBreakRules,
    } = employee;

    const payStyleDisplay = payType === "day_rate" ? "Day Rate" : "Hourly";
    const breaksDisplay = !applyBreakRules ? "No breaks" : `${breakMinutes} minutes`;

    const cells: { value: string; numeric: boolean }[] = [
      { value: employeeID, numeric: false },
      { value: firstName, numeric: false },
      { value: lastName, numeric: false },
      { value: formattedDate, numeric: false },
      { value: weekdayHours.toFixed(2), numeric: true },
      { value: saturdayHours.toFixed(2), numeric: true },
      { value: sundayHours.toFixed(2), numeric: true },
      { value: totalHours.toFixed(2), numeric: true },
      { value: payStyleDisplay, numeric: false },
      { value: breaksDisplay, numeric: false },
      { value: "", numeric: false },
      { value: "", numeric: false },
    ];

    const tr = doc.createElement("tr");
    for (const cell of cells) {
      const td = doc.createElement("td");
      if (cell.numeric) td.className = "numeric";
      td.textContent = cell.value;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  doc.body.appendChild(table);

  // Allow styles to render before opening print dialog
  setTimeout(() => {
    win.focus();
    win.print();
    win.close();
  }, 300);
}

// ─── Week Summary ────────────────────────────────────────────────────────────

interface WeekSummaryEmployee {
  firstName: string;
  lastName: string;
  weekdayHours: number;
  saturdayHours: number;
  sundayHours: number;
  totalHours: number;
  daysWorked: number;
  notes?: string;
}

interface WeekSummaryOptions {
  employees: WeekSummaryEmployee[];
  weekEndingDate: Date;
}

export function printWeekSummary({ employees, weekEndingDate }: WeekSummaryOptions): void {
  const formattedDate = formatDateAU(weekEndingDate);
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) { alert("Pop-ups are blocked. Please allow pop-ups for this site to use the print function."); return; }

  const doc = win.document;
  doc.title = `Week Summary - ${formattedDate}`;

  const style = doc.createElement("style");
  style.textContent = `
    @media print { @page { margin: 1cm; size: auto; } body { margin: 0; } }
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { font-size: 18px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
    th { background-color: #f0f0f0; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .numeric { text-align: right; }
  `;
  doc.head.appendChild(style);

  const h1 = doc.createElement("h1");
  h1.textContent = `Week Summary - Week Ending ${formattedDate}`;
  doc.body.appendChild(h1);

  const table = doc.createElement("table");
  const thead = doc.createElement("thead");
  const headerRow = doc.createElement("tr");
  const headers: { label: string; numeric: boolean }[] = [
    { label: "First Name", numeric: false },
    { label: "Last Name", numeric: false },
    { label: "Date", numeric: false },
    { label: "Ordinary Hours", numeric: true },
    { label: "Saturday Hours", numeric: true },
    { label: "Sunday Hours", numeric: true },
    { label: "Days", numeric: true },
    { label: "Total Hours", numeric: true },
    { label: "Notes", numeric: false },
  ];
  for (const h of headers) {
    const th = doc.createElement("th");
    if (h.numeric) th.className = "numeric";
    th.textContent = h.label;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = doc.createElement("tbody");
  for (const emp of employees) {
    const tr = doc.createElement("tr");
    const cells: { value: string; numeric: boolean }[] = [
      { value: emp.firstName, numeric: false },
      { value: emp.lastName, numeric: false },
      { value: formattedDate, numeric: false },
      { value: emp.weekdayHours.toFixed(2), numeric: true },
      { value: emp.saturdayHours.toFixed(2), numeric: true },
      { value: emp.sundayHours.toFixed(2), numeric: true },
      { value: String(emp.daysWorked), numeric: true },
      { value: emp.totalHours.toFixed(2), numeric: true },
      { value: emp.notes ?? "", numeric: false },
    ];
    for (const cell of cells) {
      const td = doc.createElement("td");
      if (cell.numeric) td.className = "numeric";
      td.textContent = cell.value;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  doc.body.appendChild(table);

  setTimeout(() => { win.focus(); win.print(); win.close(); }, 300);
}

// ─── Day Breakdown ───────────────────────────────────────────────────────────

interface DayBreakdownEmployee {
  firstName: string;
  lastName: string;
  // hours per ISO date string (yyyy-MM-dd), only days with entries present
  dailyHours: Record<string, number>;
  notes?: string;
}

interface DayBreakdownOptions {
  employees: DayBreakdownEmployee[];
  weekStart: Date; // Monday of the week
  weekEnd: Date;   // Sunday of the week
}

export function printDayBreakdown({ employees, weekStart, weekEnd }: DayBreakdownOptions): void {
  const startLabel = formatDateAU(weekStart);
  const endLabel = formatDateAU(weekEnd);

  const win = window.open("", "_blank", "width=1100,height=700");
  if (!win) { alert("Pop-ups are blocked. Please allow pop-ups for this site to use the print function."); return; }

  const doc = win.document;
  doc.title = `Day Breakdown - ${startLabel} to ${endLabel}`;

  const style = doc.createElement("style");
  style.textContent = `
    @media print { @page { margin: 1cm; size: portrait; } body { margin: 0; } }
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { font-size: 18px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
    th { background-color: #f0f0f0; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .numeric { text-align: center; }
    .empty { text-align: center; color: #999; }
  `;
  doc.head.appendChild(style);

  const h1 = doc.createElement("h1");
  h1.textContent = `Day Breakdown - ${startLabel} to ${endLabel}`;
  doc.body.appendChild(h1);

  // Build ordered list of 7 days Mon→Sun
  const days: { iso: string; label: string }[] = [];
  const cursor = new Date(weekStart);
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (let i = 0; i < 7; i++) {
    const dd = String(cursor.getDate()).padStart(2, "0");
    const mm = String(cursor.getMonth() + 1).padStart(2, "0");
    days.push({
      iso: `${cursor.getFullYear()}-${mm}-${dd}`,
      label: `${dayLabels[i]} ${dd}/${mm}`,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const table = doc.createElement("table");
  const thead = doc.createElement("thead");
  const headerRow = doc.createElement("tr");

  const fixedHeaders: { label: string; numeric: boolean }[] = [
    { label: "First Name", numeric: false },
    { label: "Last Name", numeric: false },
    { label: "Date Range", numeric: false },
  ];
  for (const h of fixedHeaders) {
    const th = doc.createElement("th");
    th.textContent = h.label;
    headerRow.appendChild(th);
  }
  for (const day of days) {
    const th = doc.createElement("th");
    th.className = "numeric";
    th.textContent = day.label;
    headerRow.appendChild(th);
  }
  const notesTh = doc.createElement("th");
  notesTh.textContent = "Notes";
  headerRow.appendChild(notesTh);

  for (const label of ["Days", "Total Hrs"]) {
    const th = doc.createElement("th");
    th.className = "numeric";
    th.textContent = label;
    headerRow.appendChild(th);
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = doc.createElement("tbody");
  for (const emp of employees) {
    const tr = doc.createElement("tr");

    const addCell = (text: string, numeric = false) => {
      const td = doc.createElement("td");
      if (numeric) td.className = "numeric";
      td.textContent = text;
      tr.appendChild(td);
    };

    addCell(emp.firstName);
    addCell(emp.lastName);
    addCell(`${startLabel} - ${endLabel}`);

    let total = 0;
    let daysWorked = 0;
    for (const day of days) {
      const hours = emp.dailyHours[day.iso];
      if (hours != null && hours > 0) {
        total += hours;
        daysWorked++;
        addCell(hours.toFixed(2), true);
      } else {
        const td = doc.createElement("td");
        td.className = "empty";
        td.textContent = "-";
        tr.appendChild(td);
      }
    }
    addCell(emp.notes ?? "");
    addCell(String(daysWorked), true);
    addCell(total.toFixed(2), true);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  doc.body.appendChild(table);

  setTimeout(() => { win.focus(); win.print(); win.close(); }, 300);
}

// ─── Clock Times Report ───────────────────────────────────────────────────────

export interface ClockTimesEntry {
  date: string; // ISO yyyy-MM-dd
  firstName: string;
  lastName: string;
  categoryName: string;
  startTime: string; // HH:MM:SS
  endTime: string | null;
  totalHours: number;
}

interface ClockTimesOptions {
  entries: ClockTimesEntry[];
  startDate: Date;
  endDate: Date;
}

function formatTime12hr(time: string | null): string {
  if (!time) return "—";
  const parts = time.split(":").map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function printClockTimesReport({ entries, startDate, endDate }: ClockTimesOptions): void {
  const startLabel = formatDateAU(startDate);
  const endLabel = formatDateAU(endDate);
  const isSingleDay = startLabel === endLabel;
  const title = isSingleDay ? `Clock Times - ${startLabel}` : `Clock Times - ${startLabel} to ${endLabel}`;

  const win = window.open("", "_blank", "width=1000,height=700");
  if (!win) { alert("Pop-ups are blocked. Please allow pop-ups for this site to use the print function."); return; }

  const doc = win.document;
  doc.title = title;

  const style = doc.createElement("style");
  style.textContent = `
    @media print { @page { margin: 1cm; size: portrait; } body { margin: 0; } }
    body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    p.subtitle { font-size: 13px; color: #555; margin: 0 0 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #ccc; padding: 7px 10px; text-align: left; font-size: 13px; }
    th { background-color: #f0f0f0; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .center { text-align: center; }
    .cat-header td { background-color: #e0e8f0; font-weight: bold; font-size: 13px; }
    .no-data { text-align: center; color: #999; padding: 20px; }
  `;
  doc.head.appendChild(style);

  const h1 = doc.createElement("h1");
  h1.textContent = title;
  doc.body.appendChild(h1);

  const subtitle = doc.createElement("p");
  subtitle.className = "subtitle";
  subtitle.textContent = "Times shown are as recorded (after any rounding).";
  doc.body.appendChild(subtitle);

  if (entries.length === 0) {
    const p = doc.createElement("p");
    p.className = "no-data";
    p.textContent = "No timesheet entries for this period.";
    doc.body.appendChild(p);
    setTimeout(() => { win.focus(); win.print(); win.close(); }, 300);
    return;
  }

  // Sort: category → employee last name → date
  const sorted = [...entries].sort((a, b) => {
    const catCmp = a.categoryName.localeCompare(b.categoryName);
    if (catCmp !== 0) return catCmp;
    const nameCmp = `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`);
    if (nameCmp !== 0) return nameCmp;
    return a.date.localeCompare(b.date);
  });

  const table = doc.createElement("table");
  const thead = doc.createElement("thead");
  const headerRow = doc.createElement("tr");
  for (const label of ["Date", "Employee", "Category", "Clock In", "Clock Out", "Hours"]) {
    const th = doc.createElement("th");
    th.textContent = label;
    if (label === "Clock In" || label === "Clock Out" || label === "Hours") th.className = "center";
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = doc.createElement("tbody");
  let lastCat = "";
  for (const entry of sorted) {
    if (entry.categoryName !== lastCat) {
      lastCat = entry.categoryName;
      const catRow = doc.createElement("tr");
      catRow.className = "cat-header";
      const catCell = doc.createElement("td");
      catCell.colSpan = 6;
      catCell.textContent = entry.categoryName || "Uncategorised";
      catRow.appendChild(catCell);
      tbody.appendChild(catRow);
    }

    const tr = doc.createElement("tr");
    const addCell = (text: string, center = false) => {
      const td = doc.createElement("td");
      if (center) td.className = "center";
      td.textContent = text;
      tr.appendChild(td);
    };

    const [y, mo, d] = entry.date.split("-");
    const dateLabel = `${d}/${mo}/${y}`;

    addCell(dateLabel ?? entry.date);
    addCell(`${entry.firstName} ${entry.lastName}`);
    addCell(entry.categoryName || "Uncategorised");
    addCell(formatTime12hr(entry.startTime), true);
    addCell(formatTime12hr(entry.endTime), true);
    addCell(entry.endTime ? entry.totalHours.toFixed(2) : "—", true);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  doc.body.appendChild(table);

  setTimeout(() => { win.focus(); win.print(); win.close(); }, 300);
}

// ─── Date Range Breakdown ─────────────────────────────────────────────────────

interface DateRangeOptions {
  employees: DayBreakdownEmployee[];
  startDate: Date;
  endDate: Date;
}

export function printDateRange({ employees, startDate, endDate }: DateRangeOptions): void {
  const startLabel = formatDateAU(startDate);
  const endLabel = formatDateAU(endDate);
  const isSingleDay = startLabel === endLabel;

  const title = isSingleDay
    ? `Report - ${startLabel}`
    : `Report - ${startLabel} to ${endLabel}`;

  const win = window.open("", "_blank", "width=1100,height=700");
  if (!win) { alert("Pop-ups are blocked. Please allow pop-ups for this site to use the print function."); return; }

  const doc = win.document;
  doc.title = title;

  const style = doc.createElement("style");
  style.textContent = `
    @media print { @page { margin: 1cm; size: landscape; } body { margin: 0; } }
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { font-size: 18px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
    th { background-color: #f0f0f0; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .numeric { text-align: center; }
    .empty { text-align: center; color: #999; }
  `;
  doc.head.appendChild(style);

  const h1 = doc.createElement("h1");
  h1.textContent = title;
  doc.body.appendChild(h1);

  // One column per day in the selected range
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days: { iso: string; label: string }[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const dd = String(cursor.getDate()).padStart(2, "0");
    const mm = String(cursor.getMonth() + 1).padStart(2, "0");
    const iso = `${cursor.getFullYear()}-${mm}-${dd}`;
    const label = isSingleDay
      ? `${dd}/${mm}/${cursor.getFullYear()}`
      : `${dayNames[cursor.getDay()]} ${dd}/${mm}`;
    days.push({ iso, label });
    cursor.setDate(cursor.getDate() + 1);
  }

  const table = doc.createElement("table");
  const thead = doc.createElement("thead");
  const headerRow = doc.createElement("tr");

  for (const label of ["First Name", "Last Name"]) {
    const th = doc.createElement("th");
    th.textContent = label;
    headerRow.appendChild(th);
  }
  for (const day of days) {
    const th = doc.createElement("th");
    th.className = "numeric";
    th.textContent = day.label;
    headerRow.appendChild(th);
  }
  const daysTh = doc.createElement("th");
  daysTh.className = "numeric";
  daysTh.textContent = "Days";
  headerRow.appendChild(daysTh);

  const totalTh = doc.createElement("th");
  totalTh.className = "numeric";
  totalTh.textContent = "Total Hrs";
  headerRow.appendChild(totalTh);

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = doc.createElement("tbody");
  for (const emp of employees) {
    const tr = doc.createElement("tr");

    const addCell = (text: string, numeric = false) => {
      const td = doc.createElement("td");
      if (numeric) td.className = "numeric";
      td.textContent = text;
      tr.appendChild(td);
    };

    addCell(emp.firstName);
    addCell(emp.lastName);

    let total = 0;
    let daysWorked = 0;
    for (const day of days) {
      const hours = emp.dailyHours[day.iso];
      if (hours != null && hours > 0) {
        total += hours;
        daysWorked++;
        addCell(hours.toFixed(2), true);
      } else {
        const td = doc.createElement("td");
        td.className = "empty";
        td.textContent = "-";
        tr.appendChild(td);
      }
    }
    addCell(String(daysWorked), true);
    addCell(total.toFixed(2), true);

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  doc.body.appendChild(table);

  setTimeout(() => { win.focus(); win.print(); win.close(); }, 300);
}
