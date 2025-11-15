/**
 * Admin Single Client API Route
 * GET /api/admin/clients/[id] - Get client details
 * PATCH /api/admin/clients/[id] - Update client
 * DELETE /api/admin/clients/[id] - Delete client
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { hashPIN } from '@/lib/auth'

/**
 * GET - Get single client by ID
 * Returns client details with all fields
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServer()
    const params = await props.params
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Client not found' },
      { status: 404 }
    )
  }
}

/**
 * PATCH - Update client
 * Allows updating: business_name, contact_email, status, manager_pin
 */
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServer()
    const params = await props.params
    const body = await request.json()
    const updates: any = {}

    // Build updates object from request body
    if (body.businessName) updates.business_name = body.businessName
    if (body.contactEmail) updates.contact_email = body.contactEmail
    if (body.status) updates.status = body.status

    // Hash new PIN if provided
    if (body.managerPin) {
      updates.manager_pin = await hashPIN(body.managerPin)
    }

    // Update client in database
    const { data: client, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete client
 * Cascades to delete all employees, timesheets, and break rules
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServer()
    const params = await props.params
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}
