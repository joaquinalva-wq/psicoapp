export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const { sendConfirmationEmail } = await import('@/lib/email')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.json()
    const { patient_id, scheduled_at, duration_minutes, modality, internal_notes, psychologist_id } = body

    if (!psychologist_id) {
      return NextResponse.json({ error: 'psychologist_id requerido' }, { status: 400 })
    }

    const { data: psych } = await supabase
      .from('psychologists').select('*').eq('id', psychologist_id).single()

    if (!psych) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

    const { data: apt, error } = await supabase
      .from('appointments')
      .insert({
        psychologist_id: psych.id,
        patient_id,
        scheduled_at,
        duration_minutes,
        modality,
        internal_notes: internal_notes || null,
        status: 'pending_confirmation',
      })
      .select('*, patient:patients(*)').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await supabase.from('appointment_events').insert({
      appointment_id: apt.id,
      event_type: 'created',
      to_status: 'pending_confirmation',
    })

    sendConfirmationEmail(apt, apt.patient, psych).catch(console.error)

    return NextResponse.json({ appointment: apt })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}