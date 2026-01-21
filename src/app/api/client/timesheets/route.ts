/**
 * Timesheets API Route
 * GET /api/client/timesheets - Get timesheets (filtered by query params)
 * POST /api/client/timesheets - Create new timesheet
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getSubdomainFromRequest } from "@/lib/subdomain";

/**
 * GET - Fetch timesheets
 * Query params:
 * - employeeId: Filter by employee
 * - startDate: Filter from date
 * - endDate: Filter to date
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get subdomain and client
    const subdomain = getSubdomainFromRequest(request);
    if (!subdomain) {
      return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 });
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("subdomain", subdomain)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from("timesheets")
      .select(
        `
        *,
        employee:employees(
          first_name,
          last_name
        )
      `,
      )
      .eq("client_id", client.id);

    // Apply filters
    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    if (startDate) {
      query = query.gte("work_date", startDate);
    }

    if (endDate) {
      query = query.lte("work_date", endDate);
    }

    // Execute query with ordering
    const { data: timesheets, error } = await query.order("work_date", {
      ascending: false,
    });

    if (error) throw error;

    return NextResponse.json({ timesheets });
  } catch (error) {
    console.error("Error fetching timesheets:", error);
    return NextResponse.json(
      { error: "Failed to fetch timesheets" },
      { status: 500 },
    );
  }
}

/**
 * POST - Create or update timesheet
 * Body: { employeeId, workDate, startTime?, endTime?, notes? }
 * Allows saving start time first, then end time later, or vice versa
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();
    const { employeeId, workDate, startTime, endTime, notes } =
      await request.json();

    // Validate required fields
    if (!employeeId || !workDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // At least one time must be provided
    if (!startTime && !endTime) {
      return NextResponse.json(
        { error: "Please provide at least a start time or end time" },
        { status: 400 },
      );
    }

    // Check if timesheet already exists for this employee and date
    const { data: existing } = await supabase
      .from("timesheets")
      .select("id, start_time, end_time")
      .eq("employee_id", employeeId)
      .eq("work_date", workDate)
      .single();

    if (existing) {
      // Update existing timesheet - preserve existing values if not provided
      const newStartTime = startTime ?? existing.start_time;
      const newEndTime = endTime ?? existing.end_time;

      // Check if times are changing - if so, reset break_minutes to null
      // so the database trigger will recalculate it based on new shift duration
      const timesChanged =
        newStartTime !== existing.start_time || newEndTime !== existing.end_time;

      const updateData: Record<string, string | number | null> = {
        start_time: newStartTime,
        end_time: newEndTime,
        notes: notes ?? null,
      };

      // Reset break_minutes when times change so trigger recalculates it
      if (timesChanged) {
        updateData.break_minutes = null;
      }

      const { data: timesheet, error } = await supabase
        .from("timesheets")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ timesheet }, { status: 200 });
    }

    // Create new timesheet - require start_time for new entries
    if (!startTime) {
      return NextResponse.json(
        { error: "Start time is required for new timesheet entries" },
        { status: 400 },
      );
    }

    // Get employee's client_id
    const { data: employee } = await supabase
      .from("employees")
      .select("client_id")
      .eq("id", employeeId)
      .single();

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    // Note: total_hours and break_minutes are auto-calculated by database trigger
    const { data: timesheet, error } = await supabase
      .from("timesheets")
      .insert({
        employee_id: employeeId,
        client_id: employee.client_id,
        work_date: workDate,
        start_time: startTime,
        end_time: endTime ?? null,
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ timesheet }, { status: 201 });
  } catch (error) {
    console.error("Error creating timesheet:", error);
    return NextResponse.json(
      { error: "Failed to create timesheet" },
      { status: 500 },
    );
  }
}
