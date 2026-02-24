/**
 * Timesheet Edit Log API
 * GET /api/client/timesheet-edit-log - List edit/delete audit log (manager only)
 * Query: startDate?, endDate?, employeeId?, limit?
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getSubdomainFromRequest } from "@/lib/subdomain";

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();
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

    const managerSession = request.cookies.get("manager_session")?.value;
    if (managerSession !== client.id) {
      return NextResponse.json(
        { error: "Manager access required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const employeeId = searchParams.get("employeeId");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 500);

    let query = supabase
      .from("timesheet_edit_log")
      .select(
        `
        id,
        timesheet_id,
        employee_id,
        work_date,
        action,
        edited_at,
        edited_by,
        previous_start_time,
        previous_end_time,
        new_start_time,
        new_end_time,
        employee:employees(first_name, last_name)
      `,
      )
      .eq("client_id", client.id)
      .order("edited_at", { ascending: false })
      .limit(limit);

    if (startDate) query = query.gte("work_date", startDate);
    if (endDate) query = query.lte("work_date", endDate);
    if (employeeId) query = query.eq("employee_id", employeeId);

    const { data: logs, error } = await query;

    if (error) throw error;

    return NextResponse.json({ logs: logs ?? [] });
  } catch (error) {
    console.error("Error fetching timesheet edit log:", error);
    return NextResponse.json(
      { error: "Failed to fetch edit log" },
      { status: 500 },
    );
  }
}
