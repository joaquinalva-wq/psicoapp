import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { AppointmentStatus } from '@/types'
import { CalendarDays, Users, AlertCircle, TrendingUp, Plus, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: psych } = await supabase.from('psychologists').select('*').eq('user_id', user.id).single()
  if (!psych) redirect('/settings')

  const now = new Date()
  const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7)

  const [
    { data: todayApts },
    { data: upcomingApts },
    { count: totalPatients },
    { count: pendingCount },
    { data: recentNotes },
    { data: birthdays },
  ] = await Promise.all([
    supabase.from('appointments').select('*, patient:patients(*)')
      .eq('psychologist_id', psych.id)
      .gte('scheduled_at', format(now, 'yyyy-MM-dd') + 'T00:00:00')
      .lte('scheduled_at', format(now, 'yyyy-MM-dd') + 'T23:59:59')
      .not('status', 'in', '("cancelled_by_patient","cancelled_by_psychologist")')
      .order('scheduled_at'),
    supabase.from('appointments').select('*, patient:patients(*)')
      .eq('psychologist_id', psych.id)
      .gt('scheduled_at', format(now, 'yyyy-MM-dd') + 'T23:59:59')
      .lte('scheduled_at', weekEnd.toISOString())
      .not('status', 'in', '("cancelled_by_patient","cancelled_by_psychologist")')
      .order('scheduled_at').limit(5),
    supabase.from('patients').select('*', { count: 'exact', head: true })
      .eq('psychologist_id', psych.id).eq('is_active', true),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('psychologist_id', psych.id).eq('status', 'pending_confirmation'),
    supabase.from('session_notes').select('*, patient:patients(*)')
      .eq('psychologist_id', psych.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('patients').select('first_name, last_name, date_of_birth')
      .eq('psychologist_id', psych.id).eq('is_active', true).not('date_of_birth', 'is', null),
  ])

  const todayBirthdays = (birthdays || []).filter(p => {
    if (!p.date_of_birth) return false
    const dob = new Date(p.date_of_birth)
    return dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate()
  })

  const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = psych.full_name?.split(' ').find((w: string) => !w.startsWith('Dr')) || psych.full_name

  return (
    <div className="p-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl text-slate-800 mb-0.5">{greeting}, {firstName}</h1>
        <p className="text-sm text-slate-500 capitalize">
          {format(now, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Alert: pendientes */}
      {(pendingCount || 0) > 0 && (
        <Link href="/appointments" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 hover:bg-amber-100 transition-colors group">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{pendingCount} {pendingCount === 1 ? 'turno' : 'turnos'}</strong> pendiente{pendingCount === 1 ? '' : 's'} de confirmación
          </p>
          <ArrowRight size={14} className="text-amber-500 ml-auto group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {/* Birthdays */}
      {todayBirthdays.length > 0 && (
        <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 mb-6">
          <span className="text-base">🎂</span>
          <p className="text-sm text-violet-800">
            Cumpleaños hoy: <strong>{todayBirthdays.map(p => p.first_name).join(', ')}</strong>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          { label: 'Turnos hoy', value: todayApts?.length ?? 0, sub: todayApts?.length ? `Próx: ${format(new Date(todayApts[0].scheduled_at), 'HH:mm')} hs` : 'Sin turnos', icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Esta semana', value: (todayApts?.length ?? 0) + (upcomingApts?.length ?? 0), sub: 'turnos programados', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pacientes activos', value: totalPatients ?? 0, sub: 'en tratamiento', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Sin confirmar', value: pendingCount ?? 0, sub: 'requieren atención', icon: AlertCircle, color: pendingCount ? 'text-amber-600' : 'text-slate-400', bg: pendingCount ? 'bg-amber-50' : 'bg-slate-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{s.label}</p>
              <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon size={13} className={s.color} />
              </div>
            </div>
            <p className="text-3xl font-light text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Today's appointments */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Turnos de hoy</h2>
            <Link href="/appointments/new" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
              <Plus size={12} /> Nuevo
            </Link>
          </div>
          {!todayApts?.length ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">No hay turnos para hoy</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {todayApts.map((apt: any) => (
                <Link key={apt.id} href={`/appointments/${apt.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="text-center w-10">
                    <div className="text-[11px] text-slate-400 uppercase">{format(new Date(apt.scheduled_at), 'HH:mm')}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {apt.patient?.first_name} {apt.patient?.last_name}
                    </p>
                    <p className="text-xs text-slate-400">{apt.duration_minutes} min · {apt.modality}</p>
                  </div>
                  <StatusBadge status={apt.status as AppointmentStatus} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming + recent notes */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Próximos turnos</h2>
              <Link href="/calendar" className="text-xs text-blue-600 hover:underline">Ver calendario</Link>
            </div>
            {!upcomingApts?.length ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">Sin turnos próximos</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingApts.slice(0, 3).map((apt: any) => (
                  <Link key={apt.id} href={`/appointments/${apt.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-10 text-center">
                      <div className="text-[10px] text-slate-400 uppercase">
                        {isToday(new Date(apt.scheduled_at)) ? 'hoy' : isTomorrow(new Date(apt.scheduled_at)) ? 'mañana' : format(new Date(apt.scheduled_at), 'EEE', { locale: es })}
                      </div>
                      <div className="text-sm font-medium text-slate-700">{format(new Date(apt.scheduled_at), 'd')}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">
                        {apt.patient?.first_name} {apt.patient?.last_name}
                      </p>
                      <p className="text-[11px] text-slate-400">{format(new Date(apt.scheduled_at), 'HH:mm')} hs</p>
                    </div>
                    <StatusBadge status={apt.status as AppointmentStatus} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Últimas notas</h2>
              <Link href="/notes" className="text-xs text-blue-600 hover:underline">Ver todas</Link>
            </div>
            {!recentNotes?.length ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">Sin notas registradas</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentNotes.map((note: any) => (
                  <Link key={note.id} href={`/notes/${note.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-[11px] font-medium text-blue-600 flex-shrink-0">
                      {note.patient?.first_name?.[0]}{note.patient?.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">
                        {note.patient?.first_name} {note.patient?.last_name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {format(new Date(note.session_date), "d MMM", { locale: es })} · {note.consultation_reason?.slice(0, 40) || 'Sin motivo'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
