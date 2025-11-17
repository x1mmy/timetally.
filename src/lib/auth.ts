/**
 * Authentication utilities for password and PIN hashing/verification
 * Uses bcrypt for secure hashing with 10 salt rounds
 */
import bcrypt from 'bcryptjs'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { AdminUser } from '@/types/database'

const SALT_ROUNDS = 10

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Hash a PIN using bcrypt
 * @param pin - Plain text PIN to hash
 * @returns Hashed PIN string
 */
export async function hashPIN(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS)
}

/**
 * Verify a password against its hash
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Verify a PIN against its hash
 * @param pin - Plain text PIN to verify
 * @param hash - Stored PIN hash
 * @returns True if PIN matches, false otherwise
 */
export async function verifyPIN(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

/**
 * Validate an admin session by checking if the admin user exists
 * @param sessionId - Admin user ID from session cookie
 * @returns Admin user object if valid, null otherwise
 */
export async function validateAdminSession(
  sessionId: string
): Promise<AdminUser | null> {
  try {
    const supabase = await createSupabaseServer()

    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error || !admin) {
      return null
    }

    return admin
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}
