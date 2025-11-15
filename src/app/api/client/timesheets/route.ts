/**
 * Timesheets API Route
 * GET /api/client/timesheets - Get timesheets (filtered by query params)
 * POST /api/client/timesheets - Create new timesheet
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getSubdomainFromRequest } from '@/lib/subdomain'

/**
 * GET - Fetch timesheets
 * Query params:
 * - employeeId: Filter by employee
 * - startDate: Filter from date
 * - endDate: Filter to date
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get subdomain and client
    const subdomain = getSubdomainFromRequest(request)
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Invalid subdomain' },
        { status: 400 }
      )
    }

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

    // Build query
    let query = supabase
      .from('timesheets')
      .select(`
        *,
        employee:employees(
          employee_number,
          first_name,
          last_name
        )
      `)
      .eq('client_id', client.id)

    // Apply filters
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    if (startDate) {
      query = query.gte('work_date', startDate)
    }

    if (endDate) {
      query = query.lte('work_date', endDate)
    }

    // Execute query with ordering
    const { data: timesheets, error } = await query.order('work_date', {
      ascending: false
    })

    if (error) throw error

    return NextResponse.json({ timesheets })
  } catch (error) {
    console.error('Error fetching timesheets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timesheets' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create new timesheet
 * Body: { employeeId, workDate, startTime, endTime, notes? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { employeeId, workDate, startTime, endTime, notes } = await request.json()

    // Validate required fields
    if (!employeeId || !workDate || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if timesheet already exists for this employee and date
    const { data: existing } = await supabase
      .from('timesheets')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('work_date', workDate)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Timesheet already exists for this date' },
        { status: 409 }
      )
    }

    // Create timesheet
    // Note: total_hours and break_minutes are auto-calculated by database trigger
    const { data: timesheet, error } = await supabase
      .from('timesheets')
      .insert({
        employee_id: employeeId,
        work_date: workDate,
        start_time: startTime,
        end_time: endTime,
        notes: notes || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ timesheet }, { status: 201 })
  } catch (error) {
    console.error('Error creating timesheet:', error)
    return NextResponse.json(
      { error: 'Failed to create timesheet' },
      { status: 500 }
    )
  }
}
