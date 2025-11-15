/**
 * Subdomain utility functions
 * Extract and work with subdomain information from requests
 */
import { headers } from 'next/headers'

/**
 * Get the current subdomain from request headers
 * Set by middleware in x-subdomain header
 * @returns Subdomain string or null if on root domain
 */
export async function getSubdomain(): Promise<string | null> {
  const headersList = await headers()
  const subdomain = headersList.get('x-subdomain')
  return subdomain || null
}

/**
 * Check if current request is on admin subdomain
 * @returns True if on admin subdomain
 */
export async function isAdminSubdomain(): Promise<boolean> {
  const subdomain = await getSubdomain()
  return subdomain === 'admin'
}

/**
 * Check if current request is on a client subdomain
 * @returns True if on a client subdomain (not admin, not root)
 */
export async function isClientSubdomain(): Promise<boolean> {
  const subdomain = await getSubdomain()
  return subdomain !== null && subdomain !== 'admin'
}

/**
 * Get subdomain from request object (for API routes)
 * @param request - Next.js request object
 * @returns Subdomain string or null
 */
export function getSubdomainFromRequest(request: Request): string | null {
  const headersList = new Headers(request.headers)
  const subdomain = headersList.get('x-subdomain')
  return subdomain || null
}
