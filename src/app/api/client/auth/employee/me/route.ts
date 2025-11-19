/**
 * Current Employee API
 * GET /api/client/auth/employee/me
 * Returns the logged-in employee based on the employee_session cookie and subdomain.
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getSubdomainFromRequest } from "@/lib/subdomain";

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();

    // Require subdomain
    const subdomain = getSubdomainFromRequest(request);
    if (!subdomain) {
      return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 });
    }

    // Read employee session cookie
    const sessionCookie = request.cookies.get("employee_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Look up client by subdomain
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, status")
      .eq("subdomain", subdomain)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch employee by id constrained to client
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", sessionCookie)
      .eq("client_id", client.id)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    if (employee.status !== "active") {
      return NextResponse.json(
        { error: "Employee account is not active" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      employee: {
        id: employee.id,
        firstName: employee.first_name,
        lastName: employee.last_name,
      },
    });
  } catch (error) {
    console.error("Error fetching current employee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
