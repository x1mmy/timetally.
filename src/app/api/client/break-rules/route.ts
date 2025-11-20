/**
 * Break Rules API
 * Manage client break rules
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getSubdomainFromRequest } from "@/lib/subdomain";

/**
 * GET /api/client/break-rules
 * Fetch break rules for the current client
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

    const clientId = client.id;

    // Fetch break rules for this client
    const { data: rules, error } = await supabase
      .from("break_rules")
      .select("*")
      .eq("client_id", clientId)
      .order("min_hours", { ascending: true });

    if (error) {
      console.error("Error fetching break rules:", error);
      return NextResponse.json(
        { error: "Failed to fetch break rules" },
        { status: 500 },
      );
    }

    return NextResponse.json({ rules: rules || [] });
  } catch (error) {
    console.error("Break rules fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/client/break-rules
 * Save/update break rules for the current client
 * Expects: { underFiveHours: number, fiveToSevenHours: number, overSevenHours: number }
 */
export async function POST(request: NextRequest) {
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

    const clientId = client.id;

    // Parse request body
    const body = await request.json();
    const { underFiveHours, fiveToSevenHours, overSevenHours } = body;

    // Validate input
    if (
      typeof underFiveHours !== "number" ||
      typeof fiveToSevenHours !== "number" ||
      typeof overSevenHours !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid break rule values" },
        { status: 400 },
      );
    }

    // Delete existing break rules for this client
    const { error: deleteError } = await supabase
      .from("break_rules")
      .delete()
      .eq("client_id", clientId);

    if (deleteError) {
      console.error("Error deleting old break rules:", deleteError);
      return NextResponse.json(
        { error: "Failed to update break rules" },
        { status: 500 },
      );
    }

    // Insert new break rules
    // Rule 1: Under 5 hours
    // Rule 2: 5-7 hours (min_hours = 5.0)
    // Rule 3: Over 7 hours (min_hours = 7.0)
    const newRules = [
      {
        client_id: clientId,
        min_hours: 0.0,
        break_minutes: underFiveHours,
      },
      {
        client_id: clientId,
        min_hours: 5.0,
        break_minutes: fiveToSevenHours,
      },
      {
        client_id: clientId,
        min_hours: 7.0,
        break_minutes: overSevenHours,
      },
    ];

    const { data, error: insertError } = await supabase
      .from("break_rules")
      .insert(newRules)
      .select();

    if (insertError) {
      console.error("Error inserting break rules:", insertError);
      return NextResponse.json(
        { error: "Failed to save break rules" },
        { status: 500 },
      );
    }

    // Recalculate all existing timesheets for this client
    // This triggers the database trigger to recalculate break_minutes
    // We set break_minutes to NULL so the trigger recalculates it
    const { error: recalcError } = await supabase
      .from("timesheets")
      .update({
        break_minutes: null,
        updated_at: new Date().toISOString(),
      })
      .eq("client_id", clientId);

    if (recalcError) {
      console.error("Error recalculating timesheets:", recalcError);
      // Don't fail the request - rules are saved, just log the warning
      console.warn(
        "Break rules saved but existing timesheets may not be recalculated",
      );
    }

    return NextResponse.json({
      success: true,
      rules: data,
      recalculated: !recalcError,
    });
  } catch (error) {
    console.error("Break rules save error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
