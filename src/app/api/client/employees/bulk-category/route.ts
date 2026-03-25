/**
 * Bulk Category Assignment API Route
 * POST /api/client/employees/bulk-category - Assign a category to multiple employees
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getSubdomainFromRequest } from "@/lib/subdomain";

/**
 * POST - Assign category to multiple employees
 * Body: { employeeIds: string[], categoryId: string | null }
 * Returns: { updated: number }
 */
export async function POST(request: NextRequest) {
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

    const { employeeIds, categoryId } = (await request.json()) as {
      employeeIds?: string[];
      categoryId?: string | null;
    };

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { error: "employeeIds must be a non-empty array" },
        { status: 400 },
      );
    }

    // Verify all employees belong to this client (prevent cross-client writes)
    const { data: ownedEmployees } = await supabase
      .from("employees")
      .select("id")
      .eq("client_id", client.id)
      .in("id", employeeIds);

    const ownedIds = new Set((ownedEmployees ?? []).map((e) => e.id));
    const unauthorized = employeeIds.filter((id) => !ownedIds.has(id));

    if (unauthorized.length > 0) {
      return NextResponse.json(
        { error: "One or more employees do not belong to this client" },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("employees")
      .update({ category_id: categoryId ?? null })
      .eq("client_id", client.id)
      .in("id", employeeIds)
      .select("id");

    if (error) throw error;

    return NextResponse.json({ updated: (data ?? []).length });
  } catch (error) {
    console.error("Error bulk assigning category:", error);
    return NextResponse.json(
      { error: "Failed to assign category" },
      { status: 500 },
    );
  }
}
