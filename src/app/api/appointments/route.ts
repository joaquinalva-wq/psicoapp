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
    const {
      patient_id,
      scheduled_at,
      duration_minutes,
      modality,
      internal_notes,
      psychologist_id,
    } = body

    if (!psychologist_id || !patient_id || !scheduled_at) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const supabase = getClient()

    // Obtener datos del psicólogo
    const { data: psych, error: psychError } = await supabase
      .from('psychologists')
      .select('*')
      .eq('id', psychologist_id)
      .single()

    if (psychError || !psych) {
      return NextResponse.json({ error: 'Psicólogo no encontrado' }, { status: 404 })
    }

    // Crear el turno
    const { data: apt, error: aptError } = await supabase
      .from('appointments')
      .insert({
        psychologist_id,
        patient_id,
        scheduled_at,
        duration_minutes,
        modality,
        internal_notes: internal_notes || null,
        status: 'pending_confirmation',
      })
      .select('*, patient:patients(*)')
      .single()

    if (aptError || !apt) {
      return NextResponse.json({ error: aptError?.message || 'Error al crear turno' }, { status: 400 })
    }

    // Registrar evento
    await supabase.from('appointment_events').insert({
      appointment_id: apt.id,
      event_type: 'created',
      to_status: 'pending_confirmation',
    })

    // Enviar email (sin bloquear la respuesta)
    try {
      const { sendConfirmationEmail } = await import('@/lib/email')
      await sendConfirmationEmail(apt, apt.patient, psych)
    } catch (emailErr) {
      console.error('Email error:', emailErr)
      // No fallamos el request si el email falla
    }

    return NextResponse.json({ appointment: apt })
  } catch (e) {
    console.error('Error creating appointment:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}