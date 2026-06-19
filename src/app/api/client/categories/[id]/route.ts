/**
 * Client Category API Route (single)
 * PUT /api/client/categories/[id] - Rename category
 * DELETE /api/client/categories/[id] - Delete category (employees SET NULL via FK)
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getSubdomainFromRequest } from "@/lib/subdomain";

async function getClientId(request: NextRequest) {
  const supabase = createSupabaseAdmin();
  const subdomain = getSubdomainFromRequest(request);
  if (!subdomain) return null;
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("subdomain", subdomain)
    .single();
  return client ? { supabase, clientId: client.id } : null;
}

/**
 * PUT - Rename category
 * Body: { name: string }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getClientId(request);
    if (!ctx) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    const { supabase, clientId } = ctx;
    const { id } = await params;

    const body = (await request.json()) as { name?: string; dashboardView?: string; roundingMinutes?: number; enableBreakTracking?: boolean };
    const { name } = body;

    const updatePayload: Record<string, string | number | boolean> = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: "Category name cannot be empty" },
          { status: 400 },
        );
      }
      updatePayload.name = name.trim();
    }

    if (body.dashboardView !== undefined) {
      if (body.dashboardView !== 'weekly' && body.dashboardView !== 'today_only') {
        return NextResponse.json(
          { error: "Invalid dashboard_view value" },
          { status: 400 },
        );
      }
      updatePayload.dashboard_view = body.dashboardView;
    }

    if (body.roundingMinutes !== undefined) {
      const allowed = [0, 5, 10, 15, 30];
      if (!allowed.includes(body.roundingMinutes)) {
        return NextResponse.json(
          { error: "roundingMinutes must be 0, 5, 10, 15, or 30" },
          { status: 400 },
        );
      }
      updatePayload.clock_in_rounding_minutes = body.roundingMinutes;
    }

    if (body.enableBreakTracking !== undefined) {
      if (typeof body.enableBreakTracking !== "boolean") {
        return NextResponse.json(
          { error: "enableBreakTracking must be a boolean" },
          { status: 400 },
        );
      }
      updatePayload.enable_break_tracking = body.enableBreakTracking;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data: category, error } = await supabase
      .from("employee_categories")
      .update(updatePayload)
      .eq("id", id)
      .eq("client_id", clientId)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 400 },
        );
      }
      throw error;
    }

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Delete category
 * FK ON DELETE SET NULL automatically unassigns employees
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getClientId(request);
    if (!ctx) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    const { supabase, clientId } = ctx;
    const { id } = await params;

    const { error } = await supabase
      .from("employee_categories")
      .delete()
      .eq("id", id)
      .eq("client_id", clientId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
