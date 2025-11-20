/**
 * Admin Authentication API Route
 * POST /api/admin/auth - Admin login (validates credentials and creates session cookie)
 * DELETE /api/admin/auth - Admin logout (clears session cookie)
 */
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/auth";
import { validateEmail } from "@/lib/utils";

/**
 * POST - Admin login
 * Validates email and password, creates session cookie on success
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { email, password } = await request.json();

    // Validate input
    if (!validateEmail(email) || !password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 },
      );
    }

    // Fetch admin user from database
    const { data: admin, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .single();

    // If user not found or error occurred
    if (error || !admin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Verify password against stored hash
    const isValid = await verifyPassword(password, admin.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Create success response with admin data (exclude password)
    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
      },
    });

    // Set session cookie
    response.cookies.set("admin_session", admin.id, {
      httpOnly: true, // Cannot be accessed by JavaScript
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // CSRF protection
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE - Admin logout
 * Clears the admin session cookie
 */
export async function DELETE() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear the session cookie by setting it to expire immediately
    response.cookies.set("admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
