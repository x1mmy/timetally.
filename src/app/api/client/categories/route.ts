/**
 * Client Categories API Route
 * GET /api/client/categories - List all categories for current client
 * POST /api/client/categories - Create new category
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
 * GET - List all categories for current client
 * Returns categories with employee count, ordered by name
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getClientId(request);
    if (!ctx) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    const { supabase, clientId } = ctx;

    const { data: categories, error } = await supabase
      .from("employee_categories")
      .select("*, employees(id)")
      .eq("client_id", clientId)
      .order("name", { ascending: true });

    if (error) throw error;

    // Map to include employee count
    const result = (categories ?? []).map((cat) => ({
      id: cat.id,
      client_id: cat.client_id,
      name: cat.name,
      created_at: cat.created_at,
      employee_count: Array.isArray(cat.employees) ? cat.employees.length : 0,
    }));

    return NextResponse.json({ categories: result });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

/**
 * POST - Create new category
 * Body: { name: string }
 * Returns: { category } (status 201)
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getClientId(request);
    if (!ctx) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    const { supabase, clientId } = ctx;

    const { name } = (await request.json()) as { name?: string };

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 },
      );
    }

    const { data: category, error } = await supabase
      .from("employee_categories")
      .insert({ client_id: clientId, name: name.trim() })
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

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
