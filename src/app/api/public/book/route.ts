export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { psychologist_id, scheduled_at, duration_minutes, first_name, last_name, email, phone, reason } = body

    if (!psychologist_id || !scheduled_at || !first_name || !last_name || !email) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const supabase = getClient()

    // Verificar que el slot sigue disponible
    const { data: conflict } = await supabase
      .from('appointments')
      .select('id')
      .eq('psychologist_id', psychologist_id)
      .eq('scheduled_at', scheduled_at)
      .not('status', 'in', '("cancelled_by_patient","cancelled_by_psychologist")')
      .maybeSingle()

    if (conflict) {
      return NextResponse.json({ error: 'Este horario ya fue reservado. Por favor elegí otro.' }, { status: 409 })
    }

    // Buscar o crear paciente
    let patientId: string
    const { data: existing } = await supabase
      .from('patients')
      .select('id')
      .eq('psychologist_id', psychologist_id)
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existing) {
      patientId = existing.id
    } else {
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          psychologist_id,
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone || null,
          admin_notes: 'Creado desde el portal público',
        })
        .select()
        .single()
      if (patientError || !newPatient) {
        return NextResponse.json({ error: 'Error al registrar paciente' }, { status: 500 })
      }
      patientId = newPatient.id
    }

    // Crear el turno
    const { data: apt, error: aptError } = await supabase
      .from('appointments')
      .insert({
        psychologist_id,
        patient_id: patientId,
        scheduled_at,
        duration_minutes: duration_minutes || 50,
        modality: 'presencial',
        status: 'pending_confirmation',
        internal_notes: reason ? `Motivo (portal): ${reason}` : 'Reservado desde portal público',
      })
      .select('*, patient:patients(*)')
      .single()

    if (aptError || !apt) {
      return NextResponse.json({ error: 'Error al crear turno' }, { status: 500 })
    }

    await supabase.from('appointment_events').insert({
      appointment_id: apt.id,
      event_type: 'booked_from_portal',
      to_status: 'pending_confirmation',
    })

    await supabase.from('public_bookings').insert({
      psychologist_id,
      appointment_id: apt.id,
      patient_first_name: first_name,
      patient_last_name: last_name,
      patient_email: email,
      patient_phone: phone || null,
      reason: reason || null,
      requested_at: scheduled_at,
      status: 'pending',
    })

    // Emails
    const { data: psych } = await supabase.from('psychologists').select('*').eq('id', psychologist_id).single()
    if (psych) {
      try {
        const { sendConfirmationEmail } = await import('@/lib/email')
        await sendConfirmationEmail(apt, apt.patient, psych)
      } catch (e) { console.error('Email error:', e) }
    }

    return NextResponse.json({ success: true, appointment_id: apt.id })
  } catch (e) {
    console.error('Booking error:', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}