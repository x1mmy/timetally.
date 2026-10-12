/**
 * Authentication utilities: password and PIN hashing/verification, and login sessions
 * Uses bcrypt for secure hashing with 10 salt rounds
 * Sessions are random tokens held in a cookie; only their SHA-256 hash is stored (sessions table)
 */
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabase/server";
import type { AdminUser, Session, SessionRole } from "@/types/database";

const SALT_ROUNDS = 10;

/** Cookie that carries the session token for each role */
export const SESSION_COOKIES: Record<SessionRole, string> = {
  manager: "manager_session",
  employee: "employee_session",
  admin: "admin_session",
};

/** Session lifetime in seconds (7 days), used for both the cookie and the stored row */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Who a session acts for: the role plus the records it is tied to */
export type SessionIdentity = Pick<
  Session,
  "role" | "client_id" | "employee_id" | "admin_id"
>;

/**
 * Hash a session token for storage and lookup
 * Plain SHA-256 is enough here because the token is 32 random bytes, not a guessable secret
 * @param token - Session token from the cookie
 * @returns Hex-encoded hash
 */
function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Start a session: store a new token's hash and set the role's cookie on the response
 * Throws if the session cannot be stored, so a failed login never leaves a cookie behind.
 * @param response - Response the session cookie is set on
 * @param role - Role the session is for
 * @param owner - Records the session is tied to (client for managers, client and employee for employees, admin for admins)
 */
export async function startSession(
  response: NextResponse,
  role: SessionRole,
  owner: Partial<Pick<Session, "client_id" | "employee_id" | "admin_id">>,
): Promise<void> {
  const supabase = createSupabaseAdmin();

  // Drop sessions that have expired so the table stays small
  await supabase
    .from("sessions")
    .delete()
    .lt("expires_at", new Date().toISOString());

  const token = randomBytes(32).toString("base64url");
  const { error } = await supabase.from("sessions").insert({
    token_hash: hashSessionToken(token),
    role,
    client_id: owner.client_id ?? null,
    employee_id: owner.employee_id ?? null,
    admin_id: owner.admin_id ?? null,
    expires_at: new Date(
      Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    ).toISOString(),
  });

  if (error) throw error;

  response.cookies.set(SESSION_COOKIES[role], token, {
    httpOnly: true, // Cannot be accessed by JavaScript
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax", // CSRF protection
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Resolve a session token to the session it belongs to
 * @param role - Role the cookie was read for; a token issued for another role does not match
 * @param token - Session token from the role's cookie, if any
 * @returns The session's role and owner, or null if the token is missing, unknown or expired
 */
export async function getSession(
  role: SessionRole,
  token: string | undefined,
): Promise<SessionIdentity | null> {
  if (!token) return null;

  const supabase = createSupabaseAdmin();
  const { data: session, error } = await supabase
    .from("sessions")
    .select("role, client_id, employee_id, admin_id")
    .eq("token_hash", hashSessionToken(token))
    .eq("role", role)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("Session lookup error:", error);
    return null;
  }

  return session as SessionIdentity | null;
}

/**
 * End a session: delete its stored row and clear the role's cookie on the response
 * Throws if the row cannot be deleted, so a logout is never reported as done while the token still works.
 * @param request - Incoming request carrying the session cookie
 * @param response - Response the cookie is cleared on
 * @param role - Role being logged out
 */
export async function endSession(
  request: NextRequest,
  response: NextResponse,
  role: SessionRole,
): Promise<void> {
  const token = request.cookies.get(SESSION_COOKIES[role])?.value;

  if (token) {
    const { error } = await createSupabaseAdmin()
      .from("sessions")
      .delete()
      .eq("token_hash", hashSessionToken(token))
      .eq("role", role);

    if (error) throw error;
  }

  response.cookies.set(SESSION_COOKIES[role], "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
  });
}

/**
 * Check that the request carries a manager session for the given client
 * @param request - Incoming API request
 * @param clientId - Client ID resolved from the request's subdomain (unknown because Supabase rows are untyped)
 * @returns True if the manager session belongs to this client, false otherwise
 */
export async function isManagerSession(
  request: NextRequest,
  clientId: unknown,
): Promise<boolean> {
  const session = await getSession(
    "manager",
    request.cookies.get(SESSION_COOKIES.manager)?.value,
  );
  return session !== null && session.client_id === clientId;
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Hash a PIN using bcrypt
 * @param pin - Plain text PIN to hash
 * @returns Hashed PIN string
 */
export async function hashPIN(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

/**
 * Verify a password against its hash
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Verify a PIN against its hash
 * @param pin - Plain text PIN to verify
 * @param hash - Stored PIN hash
 * @returns True if PIN matches, false otherwise
 */
export async function verifyPIN(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Validate an admin session and load the admin it belongs to
 * @param token - Session token from the admin_session cookie
 * @returns Admin user object if valid, null otherwise
 */
export async function validateAdminSession(
  token: string,
): Promise<AdminUser | null> {
  try {
    const session = await getSession("admin", token);
    if (!session?.admin_id) return null;

    const supabase = await createSupabaseServer();

    const { data: admin, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", session.admin_id)
      .single();

    if (error || !admin) {
      return null;
    }

    return admin;
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}
