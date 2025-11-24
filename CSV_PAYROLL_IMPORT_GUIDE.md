# CSV Payroll Import Guide

## Overview

The TimeTally CSV export generates **payroll-ready timesheet data** in a universal format compatible with major Australian payroll systems:

- **MYOB** (AccountRight & Business)
- **Xero Payroll AU** (via UpSheets or similar import tools)
- **QuickBooks Online Payroll AU**

## How to Export

1. Navigate to the **Manager Dashboard**
2. Select your desired date range:
   - **Week View** - Exports the current week (Monday-Sunday)
   - **Custom Range** - Exports your selected date range
3. *Optional:* Use the search bar to filter specific employees
4. Click **"Export to CSV"** button
5. File downloads as: `payroll_timesheets_DD-MM-YYYY.csv`

## CSV Format

The export uses the **universal structure** recommended for Australian payroll systems:

### Columns

| Column | Description | Example |
|--------|-------------|---------|
| EmployeeID | Auto-generated ID (EMP001, EMP002...) | EMP001 |
| FirstName | Employee first name | John |
| LastName | Employee last name | Smith |
| Date | Week-ending date (DD/MM/YYYY) | 23/11/2025 |
| Hours | Decimal hours (e.g., 38.50 not 38:30) | 38.50 |
| PayType | Pay category name | Ordinary Hours |
| Location | Blank - fill manually if needed | |
| Notes | Blank - fill manually if needed | |

### Example Output

```csv
EmployeeID,FirstName,LastName,Date,Hours,PayType,Location,Notes
EMP001,John,Smith,23/11/2025,38.50,Ordinary Hours,,
EMP001,John,Smith,23/11/2025,5.00,Saturday Rate,,
EMP002,Jane,Doe,23/11/2025,40.00,Ordinary Hours,,
EMP002,Jane,Doe,23/11/2025,2.00,Sunday Rate,,
```

### Key Features

✅ **Separate rows per pay type** - Each employee gets multiple rows (one for Ordinary Hours, one for Saturday Rate, one for Sunday Rate)
✅ **Decimal hours format** - 8.5 hours, not 8:30
✅ **Australian date format** - DD/MM/YYYY
✅ **Only non-zero hours** - Employees with 0 hours for a pay type won't have that row
✅ **Standardized pay type names** - Ready for payroll import

## Importing to Payroll Systems

### BEFORE Importing - Critical Setup

**All three systems require that you:**

1. ✅ Create matching pay types/categories with **exact names**:
   - `Ordinary Hours`
   - `Saturday Rate`
   - `Sunday Rate`

2. ✅ Assign these pay types to all employees in your payroll system

3. ✅ Ensure employee names match **exactly** between TimeTally and your payroll system

---

### 📊 MYOB (AccountRight & Business)

#### File Format Conversion

MYOB requires **tab-separated** format instead of commas:

**Option 1 - Excel:**
1. Open CSV in Excel
2. File → Save As → Text (Tab delimited) `*.txt`
3. For MYOB Business: Add `{}` in cell A1
4. Save

**Option 2 - Find & Replace:**
1. Open CSV in text editor
2. Find all commas `,` → Replace with tabs (Tab key)
3. Save as `.txt` file

#### Column Mapping

When importing, map columns as follows:

| CSV Column | MYOB Field |
|------------|------------|
| EmployeeID | Employee Card ID |
| FirstName | Employee First Name |
| LastName | Employee Co./Last Name |
| Date | Date |
| Hours | Units |
| PayType | Payroll Category |
| Location | Job (optional) |
| Notes | Notes (optional) |

#### Import Steps

1. Navigate to: **Payroll → Process Payroll → Import Timesheets**
2. Select your `.txt` file
3. Map columns using above table
4. Import and verify hours appear correctly

⚠️ **IMPORTANT:** Zero out "Standard Pay" hours in employee profiles when using timesheet imports to avoid duplicate hours.

---

### 🔵 Xero Payroll AU (via UpSheets)

#### Requirements

- Xero Payroll AU subscription
- UpSheets account ($15-50 AUD/month) - [upsheets.com](https://upsheets.com)
- *Note: Xero does not support native CSV import as of 2025*

#### Column Mapping

Rename columns to match UpSheets format (lowercase with underscores):

| CSV Column | UpSheets Column |
|------------|-----------------|
| EmployeeID | employee_id |
| FirstName | first_name |
| LastName | last_name |
| Date | date |
| Hours | hours |
| PayType | earnings_rate |
| Location | location |
| Notes | notes |

Or use UpSheets' visual column mapper during upload.

#### Import Steps

1. Log into [UpSheets.com](https://upsheets.com)
2. Connect your Xero Payroll account
3. Upload CSV file
4. Map columns (UpSheets provides visual interface)
5. Select pay calendar period
6. Import timesheets
7. Review in Xero Payroll → Timesheets

⚠️ **IMPORTANT:**
- Earnings rates must exist in Xero: Payroll Settings → Pay Items → Earnings
- Names must match exactly (case-sensitive)
- Dates must fall within open pay calendar periods

---

### 💚 QuickBooks Online Payroll AU

#### File Format

QuickBooks accepts CSV format directly (no conversion needed).

#### Column Mapping

| CSV Column | QuickBooks Field |
|------------|------------------|
| EmployeeID | EmployeeExternalID |
| FirstName | FirstName |
| LastName | LastName |
| Date | Date |
| Hours | Units |
| PayType | WorkType |
| Location | Location |
| Notes | Notes |

#### Import Steps

1. Navigate to: **Employees → Manage Employees → Import Timesheets**
2. Select **Custom file upload**
3. Choose your CSV file
4. Set date format: **DD/MM/YYYY**
5. Map columns using above table
6. Select approval workflow (optional)
7. Import timesheets
8. Review and process pay run

⚠️ **IMPORTANT:**
- Work Types must be pre-configured and map to Pay Categories
- Employee External IDs recommended (more reliable than name matching)
- Dates cannot be before employee start dates

---

## Pay Type Configuration

### What are Pay Types?

Each payroll system uses different terminology but means the same thing:

- **MYOB:** Payroll Categories
- **Xero:** Earnings Rates
- **QuickBooks:** Work Types (map to Pay Categories)

### Standard Pay Types Setup

Configure these **exact names** in your payroll system:

| Pay Type | Description | Typical Rate |
|----------|-------------|--------------|
| `Ordinary Hours` | Monday-Friday work | Base hourly rate |
| `Saturday Rate` | Saturday work | Base + 50% penalty |
| `Sunday Rate` | Sunday work | Base + 100% penalty |

**Example Configuration:**

If an employee's base rate is $25/hr:
- Ordinary Hours → $25.00/hr
- Saturday Rate → $37.50/hr (150%)
- Sunday Rate → $50.00/hr (200%)

### Setting Up in Each System

**MYOB:**
1. Setup → Payroll → Payroll Categories
2. Create categories with exact names above
3. Assign to each employee

**Xero:**
1. Payroll Settings → Pay Items → Earnings
2. Create earnings rates with exact names above
3. Rates will be calculated per employee

**QuickBooks:**
1. Create Pay Categories (Settings → Payroll Settings → Pay Categories)
2. Create Work Types with exact names above
3. Map Work Types to Pay Categories

---

## Troubleshooting

### Common Import Errors

#### "Employee not found"
- **Cause:** Name or ID doesn't match between TimeTally and payroll system
- **Fix:** Ensure names are spelled identically (including spaces, hyphens, capitalization)

#### "Pay category/earnings rate/work type not found"
- **Cause:** Pay type name doesn't exist in payroll system
- **Fix:** Create pay types with exact names: `Ordinary Hours`, `Saturday Rate`, `Sunday Rate`

#### "Invalid date format"
- **Cause:** Date format mismatch
- **Fix:** Ensure DD/MM/YYYY format is selected during import mapping

#### "Duplicate entry"
- **Cause:** Timesheets already exist for this employee/date
- **Fix:** Delete existing timesheets in payroll system before re-importing

#### "Date before employee start date"
- **Cause:** Timesheet date is earlier than employee's hire date
- **Fix:** Update employee start date or remove invalid entries from CSV

---

## Tips for Small Businesses

### Weekly Workflow

1. **Monday morning:** Export previous week's timesheets
2. **Review data:** Check for anomalies before importing
3. **Import to payroll:** Follow system-specific steps above
4. **Verify totals:** Compare dashboard totals to imported totals
5. **Process payroll:** Run pay calculations and generate payslips

### Employee ID Management

Employee IDs are auto-generated as EMP001, EMP002, etc. based on alphabetical order.

**Best Practice:**
- Export once and note which employee gets which ID
- Keep a reference list: "John Smith = EMP001, Jane Doe = EMP002"
- Or add employee number field to TimeTally database in future

### Data Accuracy

- ✅ Always review dashboard totals before exporting
- ✅ Search/filter employees if partial export needed
- ✅ Double-check date range matches pay period
- ✅ Verify break deductions are correct on dashboard

---

## Need Help?

- **MYOB Support:** [myob.com/support](https://www.myob.com/support)
- **Xero Support:** [xero.com/support](https://www.xero.com/support)
- **UpSheets Support:** [upsheets.com/support](https://upsheets.com/support)
- **QuickBooks Support:** [quickbooks.intuit.com/learn-support](https://quickbooks.intuit.com/learn-support)

---

**Generated with TimeTally - Payroll Management Made Simple**
