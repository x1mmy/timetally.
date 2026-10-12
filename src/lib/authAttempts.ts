/**
 * Attempt-based rate limiting backed by the auth_attempts table
 * Stored in the database because API routes run on separate serverless instances,
 * so an in-memory counter would not be shared between requests.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export const PIN_REVEAL_ACTION = "pin_reveal";
export const MANAGER_LOGIN_ACTION = "manager_login";

/** Attempts allowed per client within the window before requests are refused */
export const MAX_ATTEMPTS = 5;
/** Length of the window in seconds */
export const ATTEMPT_WINDOW_SECONDS = 15 * 60;

/**
 * Record an attempt and report whether it is within the limit
 * The attempt is written before it is counted, so parallel requests cannot all slip under the limit.
 * Refused attempts are recorded too, so hammering the endpoint keeps it locked.
 * Throws if the table cannot be read or written, so callers fail closed.
 * @param supabase - Service-role Supabase client
 * @param clientId - Client the attempt is made against
 * @param action - What is being attempted, e.g. PIN_REVEAL_ACTION
 * @returns True if the attempt may proceed, false if the limit is exceeded
 */
export async function registerAttempt(
  supabase: SupabaseClient,
  clientId: string,
  action: string,
): Promise<boolean> {
  const windowStart = new Date(
    Date.now() - ATTEMPT_WINDOW_SECONDS * 1000,
  ).toISOString();

  // Drop attempts that have aged out of the window so the table stays small
  await supabase
    .from("auth_attempts")
    .delete()
    .eq("client_id", clientId)
    .eq("action", action)
    .lt("created_at", windowStart);

  const { error: insertError } = await supabase
    .from("auth_attempts")
    .insert({ client_id: clientId, action });

  if (insertError) throw insertError;

  const { count, error: countError } = await supabase
    .from("auth_attempts")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("action", action)
    .gte("created_at", windowStart);

  if (countError || count === null) {
    throw countError ?? new Error("Could not count auth attempts");
  }

  return count <= MAX_ATTEMPTS;
}

/**
 * Clear recorded attempts after a successful check
 * @param supabase - Service-role Supabase client
 * @param clientId - Client the attempts were made against
 * @param action - Action whose attempts should be cleared
 */
export async function clearAttempts(
  supabase: SupabaseClient,
  clientId: string,
  action: string,
): Promise<void> {
  const { error } = await supabase
    .from("auth_attempts")
    .delete()
    .eq("client_id", clientId)
    .eq("action", action);

  if (error) throw error;
}
