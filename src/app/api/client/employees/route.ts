/**
 * Client Employees API Route
 * GET /api/client/employees - List all employees for current client
 * POST /api/client/employees - Create new employee
 * Note: Employee PINs are stored as plain text (4 digits) and isolated by client_id
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { getSubdomainFromRequest } from '@/lib/subdomain'

/**
 * GET - List all employees for current client
 * Returns employees ordered by first name
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin()
    // Get subdomain from request
    const subdomain = getSubdomainFromRequest(request)

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Invalid subdomain' },
        { status: 400 }
      )
    }

    // Get client ID from subdomain
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('subdomain', subdomain)
      .single()

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Fetch all employees for this client
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .eq('client_id', client.id)
      .order('first_name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ employees })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create new employee
 * Body: { firstName, lastName, pin, weekdayRate, saturdayRate, sundayRate }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin()
    const { firstName, lastName, pin, weekdayRate, saturdayRate, sundayRate } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !pin || weekdayRate === undefined || saturdayRate === undefined || sundayRate === undefined) {
      return NextResponse.json(
        { error: 'All fields are required' },
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

    // Validate pay rates are positive numbers
    if (weekdayRate < 0 || saturdayRate < 0 || sundayRate < 0) {
      return NextResponse.json(
        { error: 'Pay rates must be positive numbers' },
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
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('subdomain', subdomain)
      .single()

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Create employee with pay rates (PIN stored as plain text, client-isolated)
    const { data: employee, error } = await supabase
      .from('employees')
      .insert({
        client_id: client.id,
        first_name: firstName,
        last_name: lastName,
        pin: pin,
        weekday_rate: weekdayRate,
        saturday_rate: saturdayRate,
        sunday_rate: sundayRate
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ employee }, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}
