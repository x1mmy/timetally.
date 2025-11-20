/**
 * Admin Clients API Route
 * HEAD /api/admin/clients - Check authentication
 * GET /api/admin/clients - List all clients
 * POST /api/admin/clients - Create new client
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { generateSubdomain, validateSubdomain } from "@/lib/utils";
import { hashPIN, validateAdminSession } from "@/lib/auth";

/**
 * Check if admin is authenticated
 */
async function checkAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("admin_session")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await validateAdminSession(sessionId);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // Auth successful
}

/**
 * HEAD - Check authentication status
 */
export async function HEAD() {
  const authError = await checkAuth();
  if (authError) return authError;

  return new NextResponse(null, { status: 200 });
}

/**
 * GET - List all clients with employee counts
 * Returns clients ordered by creation date (newest first)
 */
export async function GET(request: NextRequest) {
  // Check authentication
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const supabase = createSupabaseAdmin();
    // Fetch all clients with employee count
    const { data: clients, error } = await supabase
      .from("clients")
      .select(
        `
        *,
        employees:employees(count)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 },
    );
  }
}

/**
 * POST - Create new client
 * Creates client with subdomain and default break rules
 */
export async function POST(request: NextRequest) {
  // Check authentication
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const supabase = createSupabaseAdmin();
    const {
      businessName,
      contactEmail,
      managerPin,
      subdomain: customSubdomain,
    } = await request.json();

    // Validate required fields
    if (!businessName || !contactEmail) {
      return NextResponse.json(
        { error: "Business name and contact email are required" },
        { status: 400 },
      );
    }

    // Generate or validate subdomain
    const subdomain = customSubdomain || generateSubdomain(businessName);

    if (!validateSubdomain(subdomain)) {
      return NextResponse.json(
        { error: "Invalid subdomain format" },
        { status: 400 },
      );
    }

    // Check if subdomain already exists
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("subdomain", subdomain)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Subdomain already exists" },
        { status: 409 },
      );
    }

    // Hash manager PIN (default: 0000)
    const pin = managerPin || "0000";
    const hashedPin = await hashPIN(pin);

    // Create client record
    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        business_name: businessName,
        subdomain,
        contact_email: contactEmail,
        manager_pin: hashedPin,
      })
      .select()
      .single();

    if (error) throw error;

    // Create default break rules
    // Rule 1: 30 min break for 5+ hours
    // Rule 2: No break for less than 5 hours
    await supabase.from("break_rules").insert([
      { client_id: client.id, min_hours: 5.0, break_minutes: 30 },
      { client_id: client.id, min_hours: 0.0, break_minutes: 0 },
    ]);

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 },
    );
  }
}
