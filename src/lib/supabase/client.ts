/**
 * Supabase browser client for client-side operations
 * Used in client components and browser-based interactions
 */
import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase browser client instance
 * Configured with public URL and anonymous key from environment variables
 */
export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
