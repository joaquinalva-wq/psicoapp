import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { AppointmentStatus } from '@/types'
import { CalendarDays, Users, AlertCircle, TrendingUp, Plus, ArrowRight, Clock } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: psych } = await supabase
    .from('psychologists')
    .select('id, full_name, profession, brand_color')
    .eq('user_id', user.id)
    .single()
  if (!psych) redirect('/settings')

  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() + 7)

  const todayStart = format(now, 'yyyy-MM-dd') + 'T00:00:00'
  const todayEnd   = format(now, 'yyyy-MM-dd') + 'T23:59:59'

  const [
    { data: todayApts },
    { data: upcomingApts },
    { count: totalPatients },
    { count: pendingCount },
    { data: recentNotes },
    { data: birthdays },
  ] = await Promise.all([
    supabase.from('appointments')
      .select('id, scheduled_at, duration_minutes, modality, status, patient:patients(id, first_name, last_name)')
      .eq('psychologist_id', psych.id)
      .gte('scheduled_at', todayStart)
      .lte('scheduled_at', todayEnd)
      .not('status', 'in', '("cancelled_by_patient","cancelled_by_psychologist")')
      .order('scheduled_at'),
    supabase.from('appointments')
      .select('id, scheduled_at, duration_minutes, modality, status, patient:patients(id, first_name, last_name)')
      .eq('psychologist_id', psych.id)
      .gt('scheduled_at', todayEnd)
      .lte('scheduled_at', weekEnd.toISOString())
      .not('status', 'in', '("cancelled_by_patient","cancelled_by_psychologist")')
      .order('scheduled_at')
      .limit(5),
    supabase.from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('psychologist_id', psych.id)
      .eq('is_active', true),
    supabase.from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('psychologist_id', psych.id)
      .eq('status', 'pending_confirmation'),
    supabase.from('session_notes')
      .select('id, session_date, consultation_reason, patient:patients(first_name, last_name)')
      .eq('psychologist_id', psych.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase.from('patients')
      .select('first_name, date_of_birth')
      .eq('psychologist_id', psych.id)
      .eq('is_active', true)
      .not('date_of_birth', 'is', null),
  ])

  const todayBirthdays = (birthdays || []).filter(p => {
    if (!p.date_of_birth) return false
    const dob = new Date(p.date_of_birth)
    return dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate()
  })

  const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = psych.full_name?.split(' ').find((w: string) => !w.startsWith('Dr')) || psych.full_name
  const brandColor = psych.brand_color || '#2d5016'
  const totalWeek = (todayApts?.length ?? 0) + (upcomingApts?.length ?? 0)

  return (
    <div className="p-8 animate-fade-in" style={{ maxWidth: 1000 }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>
            {format(now, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
          <h1 className="text-3xl font-light" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {greeting}, <span style={{ color: brandColor }}>{firstName}</span>
          </h1>
        </div>
        <Link href="/appointments/new" className="btn-primary">
          <Plus size={14} /> Nuevo turno
        </Link>
      </div>

      {/* ── Alertas ── */}
      <div className="space-y-3 mb-8">
        {(pendingCount || 0) > 0 && (
          <Link href="/appointments"
            className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors group"
            style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#fef3c7' }}>
              <AlertCircle size={15} style={{ color: '#d97706' }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: '#92400e' }}>
                {pendingCount} turno{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de confirmación
              </p>
              <p className="text-xs" style={{ color: '#b45309' }}>Hacé click para revisar</p>
            </div>
            <ArrowRight size={14} style={{ color: '#d97706' }}
              className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {todayBirthdays.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{ background: '#f5f3ff', borderColor: '#ddd6fe' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
              style={{ background: '#ede9fe' }}>
              🎂
            </div>
            <p className="text-sm font-medium" style={{ color: '#5b21b6' }}>
              Cumpleaños hoy: {todayBirthdays.map(p => p.first_name).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Stat principal — turnos hoy */}
        <div className="col-span-1 rounded-xl p-5 text-white relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${brandColor} 0%, #3d6b1e 100%)` }}>
          <div className="absolute right-4 top-4 opacity-20">
            <CalendarDays size={40} />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-80 mb-3">Turnos hoy</p>
          <p className="text-4xl font-light mb-1">{todayApts?.length ?? 0}</p>
          <p className="text-xs opacity-70">
            {todayApts?.length
              ? `Próximo: ${format(new Date(todayApts[0].scheduled_at), 'HH:mm')} hs`
              : 'Sin turnos programados'}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Esta semana</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#d1fae5' }}>
              <TrendingUp size={13} style={{ color: '#059669' }} />
            </div>
          </div>
          <p className="text-3xl font-light mb-1" style={{ color: 'var(--text-primary)' }}>{totalWeek}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>turnos programados</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Pacientes</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#ede9fe' }}>
              <Users size={13} style={{ color: '#7c3aed' }} />
            </div>
          </div>
          <p className="text-3xl font-light mb-1" style={{ color: 'var(--text-primary)' }}>{totalPatients ?? 0}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>activos en tratamiento</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Sin confirmar</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: pendingCount ? '#fef3c7' : '#f1f5f9' }}>
              <AlertCircle size={13} style={{ color: pendingCount ? '#d97706' : '#94a3b8' }} />
            </div>
          </div>
          <p className="text-3xl font-light mb-1" style={{ color: pendingCount ? '#d97706' : 'var(--text-primary)' }}>
            {pendingCount ?? 0}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>requieren atención</p>
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>

        {/* Turnos de hoy */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Turnos de hoy</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {format(now, "d 'de' MMMM", { locale: es })}
              </p>
            </div>
            <Link href="/appointments/new"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: brandColor, background: 'var(--epsi-green-pale)' }}>
              <Plus size={12} /> Agregar
            </Link>
          </div>

          {!todayApts?.length ? (
            <div className="px-5 py-12 text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'var(--surface-raised)' }}>
                <Clock size={20} style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Sin turnos para hoy</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Disfrutá el día libre 🌿</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {todayApts.map((apt: any) => (
                <Link key={apt.id} href={`/appointments/${apt.id}`} className="list-row">
                  {/* Hora */}
                  <div className="flex-shrink-0 text-center w-12">
                    <div className="text-xs font-semibold" style={{ color: brandColor }}>
                      {format(new Date(apt.scheduled_at), 'HH:mm')}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>hs</div>
                  </div>
                  {/* Separador */}
                  <div className="w-px h-8 flex-shrink-0" style={{ background: 'var(--border)' }} />
                  {/* Paciente */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {apt.patient?.first_name} {apt.patient?.last_name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                      {apt.duration_minutes} min · {apt.modality}
                    </p>
                  </div>
                  <StatusBadge status={apt.status as AppointmentStatus} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div className="space-y-5">

          {/* Próximos turnos */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Próximos turnos</h2>
              <Link href="/calendar" className="text-xs font-medium hover:underline" style={{ color: brandColor }}>
                Ver calendario →
              </Link>
            </div>
            {!upcomingApts?.length ? (
              <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Sin turnos en los próximos 7 días
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {upcomingApts.slice(0, 4).map((apt: any) => (
                  <Link key={apt.id} href={`/appointments/${apt.id}`} className="list-row">
                    <div className="flex-shrink-0 w-10 text-center">
                      <div className="text-[10px] uppercase font-medium" style={{ color: 'var(--text-tertiary)' }}>
                        {isToday(new Date(apt.scheduled_at)) ? 'hoy'
                          : isTomorrow(new Date(apt.scheduled_at)) ? 'mañ'
                          : format(new Date(apt.scheduled_at), 'EEE', { locale: es })}
                      </div>
                      <div className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>
                        {format(new Date(apt.scheduled_at), 'd')}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {apt.patient?.first_name} {apt.patient?.last_name}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {format(new Date(apt.scheduled_at), 'HH:mm')} hs · {apt.modality}
                      </p>
                    </div>
                    <StatusBadge status={apt.status as AppointmentStatus} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Últimas notas */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Últimas notas</h2>
              <Link href="/notes" className="text-xs font-medium hover:underline" style={{ color: brandColor }}>
                Ver todas →
              </Link>
            </div>
            {!recentNotes?.length ? (
              <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Sin notas registradas
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {recentNotes.map((note: any) => (
                  <Link key={note.id} href={`/notes/${note.id}`} className="list-row">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                      style={{ background: 'var(--epsi-green-pale)', color: brandColor }}>
                      {note.patient?.first_name?.[0]}{note.patient?.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {note.patient?.first_name} {note.patient?.last_name}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                        {format(new Date(note.session_date), "d MMM", { locale: es })} · {note.consultation_reason?.slice(0, 35) || 'Sin motivo'}
                      </p>
                    </div>
                    <ArrowRight size={13} style={{ color: 'var(--text-tertiary)' }} className="flex-shrink-0" />
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