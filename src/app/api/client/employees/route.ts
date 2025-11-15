/**
 * Client Employees API Route
 * GET /api/client/employees - List all employees for current client
 * POST /api/client/employees - Create new employee
 * Note: Employee PINs are stored as plain text (4 digits) and isolated by client_id
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getSubdomainFromRequest } from '@/lib/subdomain'

/**
 * GET - List all employees for current client
 * Returns employees ordered by employee number
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
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
      .order('employee_number', { ascending: true })

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
 * Body: { employeeNumber, firstName, lastName, pin }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { employeeNumber, firstName, lastName, pin } = await request.json()

    // Validate required fields
    if (!employeeNumber || !firstName || !lastName || !pin) {
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

    // Check if employee number already exists for this client
    const { data: existing } = await supabase
      .from('employees')
      .select('id')
      .eq('client_id', client.id)
      .eq('employee_number', employeeNumber)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Employee number already exists' },
        { status: 409 }
      )
    }

    // Create employee (PIN stored as plain text, client-isolated)
    const { data: employee, error } = await supabase
      .from('employees')
      .insert({
        client_id: client.id,
        employee_number: employeeNumber,
        first_name: firstName,
        last_name: lastName,
        pin: pin
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
