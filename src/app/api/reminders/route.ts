export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return run()
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return run()
}

async function run() {
  const { createClient } = await import('@supabase/supabase-js')
  const { sendReminderEmail } = await import('@/lib/email')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const in24h = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  const in26h = new Date(now.getTime() + 26 * 60 * 60 * 1000)

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, patient:patients(*), psychologist:psychologists(*)')
    .in('status', ['confirmed'])
    .gte('scheduled_at', in24h.toISOString())
    .lte('scheduled_at', in26h.toISOString())
    .is('reminder_sent_at', null)

  const results = []
  for (const apt of appointments || []) {
    try {
      await sendReminderEmail(apt, apt.patient, apt.psychologist)
      await supabase.from('appointments').update({
        reminder_sent_at: now.toISOString(),
        status: 'pending_reconfirmation',
      }).eq('id', apt.id)
      await supabase.from('appointment_events').insert({
        appointment_id: apt.id,
        event_type: 'reminder_sent',
        from_status: 'confirmed',
        to_status: 'pending_reconfirmation',
      })
      results.push({ id: apt.id, status: 'sent' })
    } catch (e) {
      results.push({ id: apt.id, status: 'error', error: String(e) })
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
    timestamp: now.toISOString(),
  })
}