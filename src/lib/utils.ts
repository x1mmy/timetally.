import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind CSS classes with proper precedence
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns True if valid email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate subdomain format
 * - Must be 3-63 characters
 * - Only lowercase letters, numbers, and hyphens
 * - Cannot start or end with hyphen
 * @param subdomain - Subdomain string to validate
 * @returns True if valid subdomain format
 */
export function validateSubdomain(subdomain: string): boolean {
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/
  return subdomainRegex.test(subdomain)
}

/**
 * Generate a subdomain from business name
 * - Converts to lowercase
 * - Replaces spaces and special chars with hyphens
 * - Removes consecutive hyphens
 * - Truncates to 63 characters
 * @param businessName - Business name to convert
 * @returns Generated subdomain string
 */
export function generateSubdomain(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 63)
}

/**
 * Format time string to HH:MM format
 * @param time - Time string to format
 * @returns Formatted time string HH:MM
 */
export function formatTime(time: string): string {
  const cleaned = time.replace(/[^0-9]/g, '')
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2) + ':' + cleaned.slice(2, 4)
  }
  return cleaned
}

/**
 * Calculate hours between two time strings
 * @param start - Start time HH:MM
 * @param end - End time HH:MM
 * @returns Hours as decimal number
 */
export function calculateHours(start: string, end: string): number {
  const [startHour = 0, startMin = 0] = start.split(':').map(Number)
  const [endHour = 0, endMin = 0] = end.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  const diffMinutes = endMinutes - startMinutes
  return diffMinutes / 60
}
