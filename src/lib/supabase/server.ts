/**
 * Supabase server client for server-side operations
 * Used in server components, API routes, and server actions
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase server client for the current request
 * Must be called within a request context (API route, server component, etc.)
 * Configured with cookie handling for session management in server-side operations
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Get all cookies for authentication
        getAll() {
          return cookieStore.getAll()
        },
        // Set cookies for session persistence
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}
