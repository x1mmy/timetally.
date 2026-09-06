/**
 * Timesheet Breaks API Route
 * POST /api/client/timesheets/breaks - Start or end a break on today's (or any) timesheet
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
 * POST - Start or end a break
 * Body: { employeeId, workDate, action: "start" | "end", time }
 * Employee can only log breaks on their own timesheet; manager can log for any employee.
 * Requires an existing timesheet for the day with a start_time and no end_time yet
 * (i.e. currently clocked in).
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

    const { employeeId, workDate, action, time } = await request.json();

    if (!employeeId || !workDate || !time || (action !== "start" && action !== "end")) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (session.type === "employee" && session.employeeId !== employeeId) {
      return NextResponse.json(
        { error: "You can only log breaks on your own timesheet" },
        { status: 403 },
      );
    }

    const { data: employee } = await supabase
      .from("employees")
      .select("client_id, category:employee_categories(allow_break_logging)")
      .eq("id", employeeId)
      .single();

    if (!employee || employee.client_id !== clientBySubdomain.id) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    if (session.type === "manager" && session.clientId !== clientBySubdomain.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const categoryData = Array.isArray(employee.category)
      ? employee.category[0]
      : employee.category;
    const allowBreakLogging =
      (categoryData as { allow_break_logging?: boolean } | undefined)
        ?.allow_break_logging ?? false;

    // Starting a new break requires the manager to have enabled it for this
    // employee's category. Ending an already-open break is always allowed,
    // so no one gets stuck on break if the setting is turned off mid-shift.
    if (action === "start" && !allowBreakLogging) {
      return NextResponse.json(
        { error: "Break logging is not enabled for this employee" },
        { status: 403 },
      );
    }

    const { data: timesheet } = await supabase
      .from("timesheets")
      .select("id, start_time, end_time")
      .eq("employee_id", employeeId)
      .eq("work_date", workDate)
      .single();

    if (!timesheet?.start_time || timesheet.end_time) {
      return NextResponse.json(
        { error: "You must be clocked in to log a break" },
        { status: 400 },
      );
    }

    const { data: openBreak } = await supabase
      .from("timesheet_breaks")
      .select("id")
      .eq("timesheet_id", timesheet.id)
      .is("break_end_time", null)
      .maybeSingle();

    if (action === "start") {
      if (openBreak) {
        return NextResponse.json(
          { error: "A break is already in progress" },
          { status: 400 },
        );
      }
      const { data: timesheetBreak, error } = await supabase
        .from("timesheet_breaks")
        .insert({ timesheet_id: timesheet.id, break_start_time: time })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ break: timesheetBreak }, { status: 201 });
    }

    if (!openBreak) {
      return NextResponse.json(
        { error: "No break is currently in progress" },
        { status: 400 },
      );
    }

    const { data: timesheetBreak, error } = await supabase
      .from("timesheet_breaks")
      .update({ break_end_time: time })
      .eq("id", openBreak.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ break: timesheetBreak }, { status: 200 });
  } catch (error) {
    console.error("Error logging timesheet break:", error);
    return NextResponse.json(
      { error: "Failed to save break" },
      { status: 500 },
    );
  }
}