export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const action = req.nextUrl.searchParams.get('action')
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const supabase = getClient()

  const { data: apt, error } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('confirmation_token', token)
    .single()

  if (error || !apt) {
    return NextResponse.redirect(`${APP_URL}/confirm/${token}`)
  }

  let newStatus: string
  switch (action) {
    case 'confirm':   newStatus = 'confirmed'; break
    case 'cancel':    newStatus = 'cancelled_by_patient'; break
    case 'reconfirm': newStatus = 'reconfirmed'; break
    default:
      return NextResponse.redirect(`${APP_URL}/confirm/${token}`)
  }

  const update: any = { status: newStatus }
  if (action === 'cancel') {
    update.cancelled_at = new Date().toISOString()
    update.cancelled_reason = 'cancelled_by_patient'
  }

  await supabase.from('appointments').update(update).eq('id', apt.id)

  await supabase.from('appointment_events').insert({
    appointment_id: apt.id,
    event_type: `patient_${action}`,
    from_status: apt.status,
    to_status: newStatus,
  })

  const resultAction =
    action === 'cancel' ? 'cancelled' :
    action === 'reconfirm' ? 'reconfirmed' : 'confirmed'

  return NextResponse.redirect(`${APP_URL}/confirm/${token}?action=${resultAction}`)
}