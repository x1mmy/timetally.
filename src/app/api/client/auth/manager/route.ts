/**
 * Manager Authentication API Route
 * POST /api/client/auth/manager - Manager PIN login
 * DELETE /api/client/auth/manager - Manager logout
 * Validates manager PIN for current subdomain
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { endSession, startSession, verifyPIN } from "@/lib/auth";
import { getSubdomainFromRequest } from "@/lib/subdomain";

/**
 * POST - Manager login with PIN
 * Creates manager session cookie on successful authentication
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();
    const { pin } = await request.json();

    // Validate input
    if (!pin) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    // Get subdomain from request
    const subdomain = getSubdomainFromRequest(request);

    if (!subdomain) {
      return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 });
    }

    // Get client by subdomain
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("subdomain", subdomain)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if client is active
    if (client.status !== "active") {
      return NextResponse.json(
        { error: "Client account is not active" },
        { status: 403 },
      );
    }

    // Verify manager PIN
    const isValid = await verifyPIN(pin, client.manager_pin);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    // Create success response
    const response = NextResponse.json({
      success: true,
      client: {
        id: client.id,
        businessName: client.business_name,
      },
    });

    // Start the manager session and set its cookie
    await startSession(response, "manager", {
      client_id: client.id as string,
    });

    return response;
  } catch (error) {
    console.error("Manager auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Manager logout
 * Deletes the session server-side and clears the session cookie
 */
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });

    await endSession(request, response, "manager");

    return response;
  } catch (error) {
    console.error("Manager logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
