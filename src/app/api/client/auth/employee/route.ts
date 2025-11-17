/**
 * Employee Authentication API Route
 * POST /api/client/auth/employee - Employee PIN-only login
 * Validates 4-digit PIN for current subdomain
 * Note: Employee PINs are stored as plain text (4 digits) and isolated by client_id
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { getSubdomainFromRequest } from '@/lib/subdomain'

/**
 * POST - Employee login with PIN only
 * Creates session cookie on successful authentication
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin()
    const { pin } = await request.json()

    // Validate input
    if (!pin) {
      return NextResponse.json(
        { error: 'PIN is required' },
        { status: 400 }
      )
    }

    // Validate PIN format (should be 4 digits)
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be 4 digits' },
        { status: 400 }
      )
    }

    // Get subdomain from request
    const subdomain = getSubdomainFromRequest(request)

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Invalid subdomain' },
        { status: 400 }
      )
    }

    // Get client ID from subdomain
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, status')
      .eq('subdomain', subdomain)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Check if client is active
    if (client.status !== 'active') {
      return NextResponse.json(
        { error: 'Client account is not active' },
        { status: 403 }
      )
    }

    // Find employee by PIN and client ID
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('client_id', client.id)
      .eq('pin', pin)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      )
    }

    // Check if employee is active
    if (employee.status !== 'active') {
      return NextResponse.json(
        { error: 'Employee account is not active' },
        { status: 403 }
      )
    }

    // Create success response
    const response = NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        firstName: employee.first_name,
        lastName: employee.last_name
      }
    })

    // Set session cookie
    response.cookies.set('employee_session', employee.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    console.error('Employee auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
