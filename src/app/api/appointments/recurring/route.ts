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
      psychologist_id,
      duration_minutes,
      modality,
      internal_notes,
      frequency,
      dates,
    } = body

    if (!psychologist_id || !patient_id || !dates?.length) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const supabase = getClient()

    // Verificar psicólogo
    const { data: psych, error: psychError } = await supabase
      .from('psychologists')
      .select('*')
      .eq('id', psychologist_id)
      .single()

    if (psychError || !psych) {
      return NextResponse.json({ error: 'Psicólogo no encontrado' }, { status: 404 })
    }

    // Crear grupo de recurrencia
    const { data: group, error: groupError } = await supabase
      .from('recurrence_groups')
      .insert({
        psychologist_id,
        patient_id,
        frequency,
        total_occurrences: dates.length,
      })
      .select()
      .single()

    if (groupError || !group) {
      return NextResponse.json(
        { error: groupError?.message || 'Error al crear grupo de recurrencia' },
        { status: 400 }
      )
    }

    // Crear todos los turnos
    const appointmentsToInsert = dates.map((date: string, index: number) => ({
      psychologist_id,
      patient_id,
      scheduled_at: date,
      duration_minutes,
      modality,
      internal_notes: internal_notes || null,
      status: 'pending_confirmation',
      is_recurring: true,
      recurrence_id: group.id,
      recurrence_index: index,
    }))

    const { data: appointments, error: aptsError } = await supabase
      .from('appointments')
      .insert(appointmentsToInsert)
      .select('*, patient:patients(*)')

    if (aptsError || !appointments) {
      // Rollback: eliminar el grupo si fallaron los turnos
      await supabase.from('recurrence_groups').delete().eq('id', group.id)
      return NextResponse.json(
        { error: aptsError?.message || 'Error al crear turnos' },
        { status: 400 }
      )
    }

    // Registrar eventos de creación
    const events = appointments.map((apt: any) => ({
      appointment_id: apt.id,
      event_type: 'created',
      to_status: 'pending_confirmation',
    }))
    await supabase.from('appointment_events').insert(events)

    // Email solo del primer turno (no spamear con todos)
    try {
      const { sendConfirmationEmail } = await import('@/lib/email')
      await sendConfirmationEmail(appointments[0], appointments[0].patient, psych)
    } catch (emailErr) {
      console.error('Email error:', emailErr)
    }

    return NextResponse.json({
      success: true,
      count: appointments.length,
      recurrence_id: group.id,
    })
  } catch (e) {
    console.error('Error creating recurring appointments:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}