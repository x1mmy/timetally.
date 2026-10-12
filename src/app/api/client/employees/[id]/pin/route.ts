/**
 * Employee PIN Reveal API Endpoint
 *
 * POST /api/client/employees/[id]/pin - Return one employee's current PIN
 *
 * This is the only route that returns an employee PIN. Every other employee
 * response leaves it out (see EMPLOYEE_PUBLIC_COLUMNS).
 *
 * Authentication: manager session for this client, plus the manager PIN
 * re-entered in the request body. Attempts are rate limited per client.
 */

import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getSubdomainFromRequest } from "@/lib/subdomain";
import { isManagerSession, verifyPIN } from "@/lib/auth";
import {
  ATTEMPT_WINDOW_SECONDS,
  PIN_REVEAL_ACTION,
  clearAttempts,
  registerAttempt,
} from "@/lib/authAttempts";
import { decryptPin } from "@/lib/employeePin";

// The response carries a PIN, so it must never be cached
const NO_STORE = { "Cache-Control": "no-store" };

/**
 * POST - Reveal an employee's PIN
 *
 * POST rather than GET so the manager PIN travels in the body, not the URL.
 *
 * Request Body:
 * - managerPin: string - The manager PIN for this client (re-entered to confirm)
 *
 * Returns: { pin: string } - The employee's current PIN
 *
 * Error Responses:
 * - 400: Missing manager PIN or invalid subdomain
 * - 401: Manager access required (no valid manager session)
 * - 403: Incorrect manager PIN
 * - 404: Client or employee not found
 * - 429: Too many attempts; retry after the window passes
 * - 500: Server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createSupabaseAdmin();
    const { id: employeeId } = await params;

    const subdomain = getSubdomainFromRequest(request);
    if (!subdomain) {
      return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 });
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id, manager_pin")
      .eq("subdomain", subdomain)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!(await isManagerSession(request, client.id))) {
      return NextResponse.json(
        { error: "Manager access required" },
        { status: 401 },
      );
    }

    const { managerPin } = (await request.json()) as { managerPin?: unknown };
    if (typeof managerPin !== "string" || managerPin === "") {
      return NextResponse.json(
        { error: "Manager PIN is required" },
        { status: 400 },
      );
    }

    const clientId = client.id as string;

    // Count the attempt before checking the PIN so guesses cannot outrun the limit
    const allowed = await registerAttempt(supabase, clientId, PIN_REVEAL_ACTION);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again in 15 minutes." },
        {
          status: 429,
          headers: {
            ...NO_STORE,
            "Retry-After": String(ATTEMPT_WINDOW_SECONDS),
          },
        },
      );
    }

    const isValid = await verifyPIN(managerPin, client.manager_pin as string);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect manager PIN" },
        { status: 403, headers: NO_STORE },
      );
    }

    await clearAttempts(supabase, clientId, PIN_REVEAL_ACTION);

    const { data: employee } = await supabase
      .from("employees")
      .select("id, pin, pin_encrypted")
      .eq("id", employeeId)
      .eq("client_id", clientId)
      .maybeSingle();

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    // Rows not yet backfilled still hold a plain text PIN (issue #49)
    const pin = employee.pin_encrypted
      ? decryptPin(clientId, employee.pin_encrypted as string)
      : (employee.pin as string | null);

    if (!pin) {
      throw new Error(`Employee ${employeeId} has no stored PIN`);
    }

    return NextResponse.json({ pin }, { headers: NO_STORE });
  } catch (error) {
    console.error("Error in POST /api/client/employees/[id]/pin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
