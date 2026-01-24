/**
 * Client Employees API Route
 * GET /api/client/employees - List all employees for current client
 * POST /api/client/employees - Create new employee
 * Note: Employee PINs are stored as plain text (4 digits) and isolated by client_id
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getSubdomainFromRequest } from "@/lib/subdomain";

/**
 * GET - List all employees for current client
 * Returns employees ordered by first name
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();
    // Get subdomain from request
    const subdomain = getSubdomainFromRequest(request);

    if (!subdomain) {
      return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 });
    }

    // Get client ID from subdomain
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("subdomain", subdomain)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Fetch all employees for this client
    const { data: employees, error } = await supabase
      .from("employees")
      .select("*")
      .eq("client_id", client.id)
      .order("first_name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 },
    );
  }
}

/**
 * POST - Create new employee
 *
 * Creates a new employee record with name, PIN, and pay rates.
 * PIN must be unique within the client (enforced at database level).
 *
 * Request Body:
 * - firstName: string - Employee's first name (required)
 * - lastName: string - Employee's last name (required)
 * - pin: string - 4-digit PIN for clock in/out (required, must be unique)
 * - weekdayRate: number - Rate for Monday-Friday (required, must be >= 0)
 * - saturdayRate: number - Rate for Saturday (required, must be >= 0)
 * - sundayRate: number - Rate for Sunday (required, must be >= 0)
 * - payType: 'hourly' | 'day_rate' - How employee is paid (optional, defaults to 'hourly')
 *
 * Returns: { employee: Employee } - Created employee object (status 201)
 *
 * Error Responses:
 * - 400: Validation error (missing fields, invalid PIN format, negative rates, duplicate PIN)
 * - 404: Client not found (invalid subdomain)
 * - 500: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();
    const {
      firstName,
      lastName,
      pin,
      weekdayRate,
      saturdayRate,
      sundayRate,
      payType,
    } = await request.json();

    // Validate all required fields are present
    if (
      !firstName ||
      !lastName ||
      !pin ||
      weekdayRate === undefined ||
      saturdayRate === undefined ||
      sundayRate === undefined
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Validate PIN format: must be exactly 4 digits
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be 4 digits" },
        { status: 400 },
      );
    }

    // Validate pay rates are non-negative numbers
    if (weekdayRate < 0 || saturdayRate < 0 || sundayRate < 0) {
      return NextResponse.json(
        { error: "Pay rates must be positive numbers" },
        { status: 400 },
      );
    }

    // Get subdomain from request
    const subdomain = getSubdomainFromRequest(request);

    if (!subdomain) {
      return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 });
    }

    // Resolve client ID from subdomain
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("subdomain", subdomain)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Insert new employee record
    // Note: PIN is stored as plain text, but isolated per client via unique constraint (client_id, pin)
    const { data: employee, error } = await supabase
      .from("employees")
      .insert({
        client_id: client.id,
        first_name: firstName,
        last_name: lastName,
        pin: pin,
        weekday_rate: weekdayRate,
        saturday_rate: saturdayRate,
        sunday_rate: sundayRate,
        pay_type: payType ?? "hourly",
      })
      .select()
      .single();

    if (error) {
      // Check for duplicate PIN error (PostgreSQL unique constraint violation)
      // Error code 23505 = unique_violation on (client_id, pin)
      if (
        error.code === "23505" &&
        error.message?.includes("employees_client_pin_key")
      ) {
        return NextResponse.json(
          {
            error: `PIN ${pin} is already in use. Please choose a different 4-digit PIN.`,
          },
          { status: 400 },
        );
      }
      throw error;
    }

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 },
    );
  }
}
