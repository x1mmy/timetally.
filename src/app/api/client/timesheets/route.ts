/**
 * Timesheets API Route
 * GET /api/client/timesheets - Get timesheets (filtered by query params)
 * POST /api/client/timesheets - Create or update timesheet (employee own or manager)
 * DELETE /api/client/timesheets - Delete a timesheet (employee own or manager)
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getSubdomainFromRequest } from "@/lib/subdomain";

type SessionType = "manager" | "employee" | null;

function getClientSession(request: NextRequest): {
  type: SessionType;
  clientId: string | null;
  employeeId: string | null;
} {
  const subdomain = getSubdomainFromRequest(request);
  if (!subdomain) return { type: null, clientId: null, employeeId: null };
  const managerSession = request.cookies.get("manager_session")?.value;
  const employeeSession = request.cookies.get("employee_session")?.value;
  if (managerSession) return { type: "manager", clientId: managerSession, employeeId: null };
  if (employeeSession) return { type: "employee", clientId: null, employeeId: employeeSession };
  return { type: null, clientId: null, employeeId: null };
}

/**
 * GET - Fetch timesheets
 * Query params:
 * - employeeId: Filter by employee (managers only; employees always see own)
 * - startDate: Filter from date
 * - endDate: Filter to date
 * Requires manager or employee session. Employees only get their own timesheets.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();
    const subdomain = getSubdomainFromRequest(request);
    if (!subdomain) {
      return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 });
    }
    const { data: clientBySubdomain } = await supabase
      .from("clients")
      .select("id")
      .eq("subdomain", subdomain)
      .single();
    if (!clientBySubdomain) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const session = getClientSession(request);
    if (!session.type) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let employeeId = searchParams.get("employeeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let clientId: string;
    if (session.type === "employee") {
      if (!session.employeeId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      const { data: emp } = await supabase
        .from("employees")
        .select("client_id")
        .eq("id", session.employeeId)
        .eq("client_id", clientBySubdomain.id)
        .single();
      if (!emp) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      clientId = emp.client_id;
      employeeId = session.employeeId;
    } else {
      if (session.clientId !== clientBySubdomain.id) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      clientId = session.clientId!;
    }

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
      .eq("client_id", clientId);

    if (employeeId) query = query.eq("employee_id", employeeId);
    if (startDate) query = query.gte("work_date", startDate);
    if (endDate) query = query.lte("work_date", endDate);

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
 * Manager can create/update any employee's timesheet; employee can only their own.
 * Edits are logged to timesheet_edit_log for manager audit.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();
    const subdomain = getSubdomainFromRequest(request);
    if (!subdomain) {
      return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 });
    }
    const { data: clientBySubdomain } = await supabase
      .from("clients")
      .select("id")
      .eq("subdomain", subdomain)
      .single();
    if (!clientBySubdomain) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const session = getClientSession(request);
    if (!session.type) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { employeeId, workDate, startTime, endTime, notes } =
      await request.json();

    if (!employeeId || !workDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!startTime && !endTime) {
      return NextResponse.json(
        { error: "Please provide at least a start time or end time" },
        { status: 400 },
      );
    }

    // Employees can only create/update their own timesheet
    if (session.type === "employee" && session.employeeId !== employeeId) {
      return NextResponse.json(
        { error: "You can only edit your own timesheet" },
        { status: 403 },
      );
    }

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

    if (employee.client_id !== clientBySubdomain.id) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }
    if (session.type === "manager" && session.clientId !== clientBySubdomain.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { data: existing } = await supabase
      .from("timesheets")
      .select("id, start_time, end_time")
      .eq("employee_id", employeeId)
      .eq("work_date", workDate)
      .single();

    if (existing) {
      const newStartTime = startTime ?? existing.start_time;
      const newEndTime = endTime ?? existing.end_time;
      const timesChanged =
        newStartTime !== existing.start_time || newEndTime !== existing.end_time;

      const updateData: Record<string, string | number | null> = {
        start_time: newStartTime,
        end_time: newEndTime,
        notes: notes ?? null,
      };
      if (timesChanged) updateData.break_minutes = null;

      const { data: timesheet, error } = await supabase
        .from("timesheets")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;

      if (timesChanged) {
        // Attribute to employee when they edited their own (by cookie), else manager
        const employeeSession = request.cookies.get("employee_session")?.value;
        const editedBy =
          employeeSession && employeeSession === employeeId ? "employee" : "manager";
        await supabase.from("timesheet_edit_log").insert({
          timesheet_id: existing.id,
          client_id: employee.client_id,
          employee_id: employeeId,
          work_date: workDate,
          action: "edit",
          edited_by: editedBy,
          previous_start_time: existing.start_time,
          previous_end_time: existing.end_time,
          new_start_time: newStartTime,
          new_end_time: newEndTime,
        });
      }

      return NextResponse.json({ timesheet }, { status: 200 });
    }

    if (!startTime) {
      return NextResponse.json(
        { error: "Start time is required for new timesheet entries" },
        { status: 400 },
      );
    }

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
    console.error("Error creating/updating timesheet:", error);
    return NextResponse.json(
      { error: "Failed to save timesheet" },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Delete a timesheet entry
 * Body: { timesheetId } or { employeeId, workDate }
 * Manager can delete any; employee can only delete their own (e.g. wrong day).
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();
    const subdomain = getSubdomainFromRequest(request);
    if (!subdomain) {
      return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 });
    }
    const { data: clientBySubdomain } = await supabase
      .from("clients")
      .select("id")
      .eq("subdomain", subdomain)
      .single();
    if (!clientBySubdomain) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const session = getClientSession(request);
    if (!session.type) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const timesheetId = body.timesheetId as string | undefined;
    const employeeIdParam = body.employeeId as string | undefined;
    const workDate = body.workDate as string | undefined;

    let timesheet: { id: string; employee_id: string; client_id: string; work_date: string; start_time: string | null; end_time: string | null } | null = null;

    if (timesheetId) {
      const { data, error } = await supabase
        .from("timesheets")
        .select("id, employee_id, client_id, work_date, start_time, end_time")
        .eq("id", timesheetId)
        .single();
      if (error || !data) {
        return NextResponse.json(
          { error: "Timesheet not found" },
          { status: 404 },
        );
      }
      timesheet = data;
    } else if (employeeIdParam && workDate) {
      const { data, error } = await supabase
        .from("timesheets")
        .select("id, employee_id, client_id, work_date, start_time, end_time")
        .eq("employee_id", employeeIdParam)
        .eq("work_date", workDate)
        .single();
      if (error || !data) {
        return NextResponse.json(
          { error: "Timesheet not found" },
          { status: 404 },
        );
      }
      timesheet = data;
    } else {
      return NextResponse.json(
        { error: "Provide timesheetId or employeeId and workDate" },
        { status: 400 },
      );
    }

    if (session.type === "employee") {
      if (session.employeeId !== timesheet.employee_id) {
        return NextResponse.json(
          { error: "You can only delete your own timesheet entries" },
          { status: 403 },
        );
      }
    } else {
      if (session.clientId !== clientBySubdomain.id || timesheet.client_id !== clientBySubdomain.id) {
        return NextResponse.json(
          { error: "Not authorized to delete this timesheet" },
          { status: 403 },
        );
      }
    }

    const { error: deleteError } = await supabase
      .from("timesheets")
      .delete()
      .eq("id", timesheet.id);

    if (deleteError) throw deleteError;

    const employeeSession = request.cookies.get("employee_session")?.value;
    const editedBy =
      employeeSession && employeeSession === timesheet.employee_id
        ? "employee"
        : "manager";
    await supabase.from("timesheet_edit_log").insert({
      timesheet_id: null,
      client_id: timesheet.client_id,
      employee_id: timesheet.employee_id,
      work_date: timesheet.work_date,
      action: "delete",
      edited_by: editedBy,
      previous_start_time: timesheet.start_time,
      previous_end_time: timesheet.end_time,
      new_start_time: null,
      new_end_time: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting timesheet:", error);
    return NextResponse.json(
      { error: "Failed to delete timesheet" },
      { status: 500 },
    );
  }
}
