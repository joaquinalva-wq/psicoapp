import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Calendar, Clock, MapPin, FileText, User } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { AppointmentStatus } from '@/types'
import AppointmentActions from '@/components/appointments/AppointmentActions'

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: psych } = await supabase.from('psychologists').select('id').eq('user_id', user.id).single()

  const { data: apt } = await supabase.from('appointments')
    .select('*, patient:patients(*)')
    .eq('id', id).eq('psychologist_id', psych?.id).single()
  if (!apt) notFound()

  const { data: events } = await supabase.from('appointment_events')
    .select('*').eq('appointment_id', id).order('created_at', { ascending: false })

  const { data: note } = await supabase.from('session_notes')
    .select('id, consultation_reason, session_date').eq('appointment_id', id).maybeSingle()

  const isCancelled = ['cancelled_by_patient','cancelled_by_psychologist'].includes(apt.status)
  const isPast = new Date(apt.scheduled_at) < new Date()

  return (
    <div className="p-8 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/appointments" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <h1 className="text-2xl text-slate-800">Detalle del turno</h1>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Main info */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={apt.status as AppointmentStatus} />
                  {isCancelled && <span className="text-xs text-red-500">· {apt.cancelled_reason}</span>}
                </div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {apt.patient?.first_name} {apt.patient?.last_name}
                </h2>
              </div>
              <Link href={`/patients/${apt.patient_id}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <User size={11} /> Ver paciente
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Calendar, label: 'Fecha y hora', value: format(new Date(apt.scheduled_at), "EEEE d 'de' MMMM · HH:mm 'hs'", { locale: es }) },
                { icon: Clock, label: 'Duración', value: `${apt.duration_minutes} minutos` },
                { icon: MapPin, label: 'Modalidad', value: apt.modality === 'presencial' ? 'Presencial' : 'Virtual' },
                { icon: Calendar, label: 'Creado el', value: format(new Date(apt.created_at), "d MMM yyyy", { locale: es }) },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <item.icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-medium text-slate-700 capitalize">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {apt.internal_notes && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Notas internas</p>
                <p className="text-sm text-amber-800">{apt.internal_notes}</p>
              </div>
            )}
          </div>

          {/* Session note */}
          {note ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700">Nota de sesión registrada</h3>
                </div>
                <Link href={`/notes/${note.id}`} className="text-xs text-blue-600 hover:underline">Ver completa</Link>
              </div>
              <p className="text-sm text-slate-600">{note.consultation_reason || 'Sin motivo registrado'}</p>
            </div>
          ) : !isCancelled && isPast ? (
            <Link href={`/notes/new?appointment=${apt.id}&patient=${apt.patient_id}`}
              className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-5 hover:bg-blue-100 transition-colors group">
              <FileText size={16} className="text-blue-500" />
              <div>
                <p className="text-sm font-medium text-blue-800">Registrar nota de sesión</p>
                <p className="text-xs text-blue-600">Documentá lo trabajado en esta sesión</p>
              </div>
            </Link>
          ) : null}
        </div>

        {/* Sidebar: actions + timeline */}
        <div className="space-y-4">
          {!isCancelled && <AppointmentActions appointmentId={apt.id} status={apt.status} patientId={apt.patient_id} />}

          {/* Event timeline */}
          {events && events.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Historial</h3>
              <div className="space-y-2.5">
                {events.map(ev => (
                  <div key={ev.id} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-700">{ev.event_type.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-slate-400">
                        {format(new Date(ev.created_at), "d MMM · HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
