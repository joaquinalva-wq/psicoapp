import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInYears } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Edit, Plus, Calendar, FileText, Clock } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { AppointmentStatus } from '@/types'

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: psych } = await supabase.from('psychologists').select('*').eq('user_id', user.id).single()

  const { data: patient } = await supabase.from('patients').select('*')
    .eq('id', id).eq('psychologist_id', psych?.id).single()
  if (!patient) notFound()

  const [
    { data: appointments },
    { data: notes },
  ] = await Promise.all([
    supabase.from('appointments').select('*')
      .eq('patient_id', id).order('scheduled_at', { ascending: false }),
    supabase.from('session_notes').select('*')
      .eq('patient_id', id).order('session_date', { ascending: false }),
  ])

  const upcoming = appointments?.filter(a => new Date(a.scheduled_at) > new Date() && !['cancelled_by_patient','cancelled_by_psychologist'].includes(a.status)) || []
  const past     = appointments?.filter(a => new Date(a.scheduled_at) <= new Date() || a.status === 'completed') || []
  const cancelled = appointments?.filter(a => ['cancelled_by_patient','cancelled_by_psychologist'].includes(a.status)) || []

  const attendance = appointments?.length
    ? Math.round(((appointments.length - cancelled.length) / appointments.length) * 100)
    : 100

  const initials = (patient.first_name[0] + patient.last_name[0]).toUpperCase()
  const COLORS = ['bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-violet-100 text-violet-700','bg-amber-100 text-amber-700']
  const colorIdx = patient.first_name.charCodeAt(0) % COLORS.length

  return (
    <div className="p-8 animate-fade-in max-w-5xl">
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/patients" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <h1 className="text-2xl text-slate-800">{patient.first_name} {patient.last_name}</h1>
        <Link href={`/patients/${id}/edit`}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors">
          <Edit size={12} /> Editar
        </Link>
        <Link href={`/appointments/new?patient=${id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
          <Plus size={12} /> Nuevo turno
        </Link>
        <Link href={`/notes/new?patient=${id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
          <FileText size={12} /> Nueva nota
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: profile */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-6 text-center border-b border-slate-100">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold mx-auto mb-3 ${COLORS[colorIdx]}`}>
                {initials}
              </div>
              <h2 className="text-base font-semibold text-slate-800">{patient.first_name} {patient.last_name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Paciente activo</p>
            </div>
            <div className="divide-y divide-slate-100 text-sm px-4">
              {[
                { label: 'Email', value: patient.email },
                { label: 'Teléfono', value: patient.phone || '—' },
                { label: 'Nacimiento', value: patient.date_of_birth ? format(new Date(patient.date_of_birth + 'T12:00:00'), "d MMM yyyy", { locale: es }) : '—' },
                { label: 'Edad', value: patient.date_of_birth ? `${differenceInYears(new Date(), new Date(patient.date_of_birth))} años` : '—' },
                { label: 'En tratamiento', value: format(new Date(patient.created_at), "MMM yyyy", { locale: es }) },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-2.5">
                  <span className="text-slate-500">{row.label}</span>
                  <span className="text-slate-800 font-medium text-right max-w-[55%] truncate">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Métricas</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Sesiones', value: past.length },
                { label: 'Canceladas', value: cancelled.length },
                { label: 'Asistencia', value: `${attendance}%` },
                { label: 'Notas', value: notes?.length || 0 },
              ].map(m => (
                <div key={m.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">{m.label}</p>
                  <p className="text-xl font-light text-slate-800 mt-0.5">{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {patient.tags?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Etiquetas</h3>
              <div className="flex flex-wrap gap-1.5">
                {patient.tags.map((t: string) => (
                  <span key={t} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Admin notes */}
          {patient.admin_notes && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notas administrativas</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{patient.admin_notes}</p>
            </div>
          )}
        </div>

        {/* Right: appointments + notes */}
        <div className="col-span-2 space-y-5">
          {/* Upcoming */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Próximos turnos</h3>
              </div>
              <Link href={`/appointments/new?patient=${id}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Plus size={11} /> Nuevo
              </Link>
            </div>
            {!upcoming.length ? (
              <p className="text-sm text-slate-400 text-center py-8">Sin turnos próximos</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcoming.map(apt => (
                  <Link key={apt.id} href={`/appointments/${apt.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="w-12 text-center">
                      <div className="text-[10px] text-slate-400 uppercase capitalize">
                        {format(new Date(apt.scheduled_at), 'EEE', { locale: es })}
                      </div>
                      <div className="text-base font-medium text-slate-700">{format(new Date(apt.scheduled_at), 'd')}</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{format(new Date(apt.scheduled_at), "d MMM · HH:mm 'hs'", { locale: es })}</p>
                      <p className="text-xs text-slate-400">{apt.duration_minutes} min · {apt.modality}</p>
                    </div>
                    <StatusBadge status={apt.status as AppointmentStatus} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Notas de sesión</h3>
              </div>
              <Link href={`/notes/new?patient=${id}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Plus size={11} /> Nueva nota
              </Link>
            </div>
            {!notes?.length ? (
              <p className="text-sm text-slate-400 text-center py-8">Sin notas registradas</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {notes.map(note => (
                  <Link key={note.id} href={`/notes/${note.id}`}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="text-center w-12 flex-shrink-0">
                      <div className="text-[10px] text-slate-400 uppercase capitalize">
                        {format(new Date(note.session_date + 'T12:00:00'), 'MMM', { locale: es })}
                      </div>
                      <div className="text-base font-medium text-slate-700">{format(new Date(note.session_date + 'T12:00:00'), 'd')}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {note.consultation_reason || 'Sin motivo registrado'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {note.development?.slice(0, 80) || 'Sin desarrollo'}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{format(new Date(note.session_date + 'T12:00:00'), 'd MMM', { locale: es })}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          {past.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
                <Clock size={14} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Historial de turnos</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {past.slice(0, 5).map(apt => (
                  <Link key={apt.id} href={`/appointments/${apt.id}`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <p className="text-sm text-slate-600 flex-1">
                      {format(new Date(apt.scheduled_at), "d MMM yyyy · HH:mm 'hs'", { locale: es })}
                    </p>
                    <span className="text-xs text-slate-400">{apt.modality}</span>
                    <StatusBadge status={apt.status as AppointmentStatus} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
