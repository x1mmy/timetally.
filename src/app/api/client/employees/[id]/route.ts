/**
 * Individual Employee API Endpoints
 *
 * PUT /api/client/employees/[id] - Update employee details and pay rates
 * DELETE /api/client/employees/[id] - Delete employee from system
 *
 * Authentication: Required (manager/admin)
 * Validation: PIN uniqueness, pay rate validation, required fields
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getSubdomainFromRequest } from "@/lib/subdomain";
import type { UpdateEmployeeInput } from "@/types/database";

/**
 * PUT - Update an employee
 *
 * Updates employee information including name, PIN, and pay rates.
 * All fields are optional - only provided fields will be updated.
 *
 * Request Body (UpdateEmployeeInput):
 * - firstName?: string - Employee's first name
 * - lastName?: string - Employee's last name
 * - pin?: string - 4-digit PIN (must be unique within client)
 * - weekdayRate?: number - Rate for Monday-Friday (must be >= 0)
 * - saturdayRate?: number - Rate for Saturday (must be >= 0)
 * - sundayRate?: number - Rate for Sunday (must be >= 0)
 * - payType?: 'hourly' | 'day_rate' - How employee is paid
 * - status?: 'active' | 'inactive' - Employee status
 *
 * Returns: { employee: Employee } - Updated employee object
 *
 * Error Responses:
 * - 401: Unauthorized (not logged in)
 * - 400: Validation error (invalid PIN format, duplicate PIN, negative rates)
 * - 500: Server error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createSupabaseAdmin();
    const { id: employeeId } = await params;

    // Validate subdomain (client must exist)
    const subdomain = getSubdomainFromRequest(request);
    if (!subdomain) {
      return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 });
    }

    // Verify client exists
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("subdomain", subdomain)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Parse request body with UpdateEmployeeInput type
    const body = (await request.json()) as UpdateEmployeeInput;

    // Build update object dynamically based on provided fields
    // Only fields that are defined in the request will be updated
    const updates: Record<string, unknown> = {};

    // Update first name if provided
    if (body.firstName !== undefined) {
      updates.first_name = body.firstName.trim();
    }

    // Update last name if provided
    if (body.lastName !== undefined) {
      updates.last_name = body.lastName.trim();
    }

    // Update PIN if provided (with validation)
    if (body.pin !== undefined) {
      // Validate PIN format: must be exactly 4 digits
      if (!/^\d{4}$/.test(body.pin)) {
        return NextResponse.json(
          { error: "PIN must be exactly 4 digits" },
          { status: 400 },
        );
      }

      // Check if PIN is already in use by another employee in the same client
      // Uses maybeSingle() to avoid errors when no match is found
      const { data: existingEmployee } = await supabase
        .from("employees")
        .select("id")
        .eq("client_id", client.id)
        .eq("pin", body.pin)
        .neq("id", employeeId) // Exclude current employee from check
        .maybeSingle();

      if (existingEmployee) {
        return NextResponse.json(
          {
            error: `PIN ${body.pin} is already in use. Please choose a different 4-digit PIN.`,
          },
          { status: 400 },
        );
      }

      updates.pin = body.pin;
    }
    // Update weekday pay rate if provided (Monday-Friday)
    if (body.weekdayRate !== undefined) {
      if (body.weekdayRate < 0) {
        return NextResponse.json(
          { error: "Weekday rate must be positive" },
          { status: 400 },
        );
      }
      updates.weekday_rate = body.weekdayRate;
    }

    // Update Saturday pay rate if provided
    if (body.saturdayRate !== undefined) {
      if (body.saturdayRate < 0) {
        return NextResponse.json(
          { error: "Saturday rate must be positive" },
          { status: 400 },
        );
      }
      updates.saturday_rate = body.saturdayRate;
    }

    // Update Sunday pay rate if provided
    if (body.sundayRate !== undefined) {
      if (body.sundayRate < 0) {
        return NextResponse.json(
          { error: "Sunday rate must be positive" },
          { status: 400 },
        );
      }
      updates.sunday_rate = body.sundayRate;
    }

    // Update employee status if provided (active/inactive)
    if (body.status !== undefined) {
      updates.status = body.status;
    }

    // Update pay type if provided (hourly/day_rate)
    if (body.payType !== undefined) {
      if (!["hourly", "day_rate"].includes(body.payType)) {
        return NextResponse.json(
          { error: "Pay type must be 'hourly' or 'day_rate'" },
          { status: 400 },
        );
      }
      updates.pay_type = body.payType;
    }

    // Execute the update query in the database
    const { data: employee, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", employeeId)
      .select()
      .single();

    if (error) {
      // Handle database constraint errors (e.g., duplicate PIN in race condition)
      // PostgreSQL error code 23505 = unique_violation
      if (
        error.code === "23505" &&
        error.message?.includes("employees_client_pin_key")
      ) {
        return NextResponse.json(
          {
            error: `PIN ${body.pin} is already in use. Please choose a different 4-digit PIN.`,
          },
          { status: 400 },
        );
      }
      console.error("Error updating employee:", error);
      return NextResponse.json(
        { error: "Failed to update employee" },
        { status: 500 },
      );
    }

    // Return updated employee data
    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Error in PUT /api/client/employees/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Remove an employee
 *
 * Permanently deletes an employee from the system.
 * This will also cascade delete related records (timesheets, etc.)
 * based on database foreign key constraints.
 *
 * Warning: This action cannot be undone!
 *
 * Returns: { success: true } - Confirmation of deletion
 *
 * Error Responses:
 * - 401: Unauthorized (not logged in)
 * - 500: Server error (e.g., foreign key constraint issues)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createSupabaseAdmin();
    const { id: employeeId } = await params;

    // Validate subdomain (client must exist)
    const subdomain = getSubdomainFromRequest(request);
    if (!subdomain) {
      return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 });
    }

    // Verify client exists
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("subdomain", subdomain)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Execute deletion in database (only for employees belonging to this client)
    // Note: Related records (timesheets) may cascade delete based on FK constraints
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", employeeId)
      .eq("client_id", client.id);

    if (error) {
      console.error("Error deleting employee:", error);
      return NextResponse.json(
        { error: "Failed to delete employee" },
        { status: 500 },
      );
    }

    // Return success confirmation
    return NextResponse.json({ success: true });
  } catch (error) {
    // Handle unexpected errors
    console.error("Error in DELETE /api/client/employees/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
