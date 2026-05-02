import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Clock, ChevronRight } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { AppointmentStatus } from '@/types'

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: psych } = await supabase
    .from('psychologists')
    .select('id, brand_color')
    .eq('user_id', user.id)
    .single()

  if (!psych) redirect('/settings')

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, scheduled_at, duration_minutes, modality, status, is_recurring, patient:patients(first_name, last_name)')
    .eq('psychologist_id', psych.id)
    .not('status', 'in', '("cancelled_by_patient","cancelled_by_psychologist")')
    .order('scheduled_at', { ascending: true })
    .limit(100)

  const now = new Date()
  const upcoming = appointments?.filter(a => new Date(a.scheduled_at) >= now) || []
  const past = appointments?.filter(a => new Date(a.scheduled_at) < now) || []
  const pending = upcoming.filter(a => a.status === 'pending_confirmation')
  const brandColor = psych.brand_color || '#2d5016'

  return (
    <div className="p-8 animate-fade-in" style={{ maxWidth: 900 }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Turnos</h1>
          <p className="page-subtitle">{upcoming.length} próximos · {past.length} realizados</p>
        </div>
        <Link href="/appointments/new" className="btn-primary">
          <Plus size={14} /> Nuevo turno
        </Link>
      </div>

      {/* Alerta pendientes */}
      {pending.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-6"
          style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <Clock size={15} style={{ color: '#d97706' }} />
          <p className="text-sm" style={{ color: '#92400e' }}>
            <strong>{pending.length}</strong> turno{pending.length !== 1 ? 's' : ''} esperando confirmación del paciente
          </p>
        </div>
      )}

      {!appointments?.length ? (
        <div className="card py-16 text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--surface-raised)' }}>
            <Clock size={24} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Sin turnos aún</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>Creá el primer turno para comenzar</p>
          <Link href="/appointments/new" className="btn-primary" style={{ display: 'inline-flex' }}>
            <Plus size={14} /> Nuevo turno
          </Link>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Próximos */}
          {upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  Próximos
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'var(--epsi-green-pale)', color: brandColor }}>
                  {upcoming.length}
                </span>
              </div>
              <div className="card divide-y" style={{ borderColor: 'var(--border)' }}>
                {upcoming.map((apt: any) => (
                  <Link key={apt.id} href={`/appointments/${apt.id}`} className="list-row group">
                    {/* Fecha */}
                    <div className="flex-shrink-0 w-14 text-center">
                      <div className="text-[10px] font-semibold uppercase"
                        style={{ color: 'var(--text-tertiary)' }}>
                        {format(new Date(apt.scheduled_at), 'EEE', { locale: es })}
                      </div>
                      <div className="text-xl font-light" style={{ color: 'var(--text-primary)' }}>
                        {format(new Date(apt.scheduled_at), 'd')}
                      </div>
                      <div className="text-[10px] capitalize" style={{ color: 'var(--text-tertiary)' }}>
                        {format(new Date(apt.scheduled_at), 'MMM', { locale: es })}
                      </div>
                    </div>
                    {/* Separador */}
                    <div className="w-px h-10 flex-shrink-0" style={{ background: 'var(--border)' }} />
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate transition-colors"
                          style={{ color: 'var(--text-primary)' }}>
                          {apt.patient?.first_name} {apt.patient?.last_name}
                        </p>
                        {apt.is_recurring && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                            style={{ background: '#ede9fe', color: '#6d28d9' }}>
                            recurrente
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {format(new Date(apt.scheduled_at), "HH:mm 'hs'")} · {apt.duration_minutes} min · {apt.modality}
                      </p>
                    </div>
                    <StatusBadge status={apt.status as AppointmentStatus} />
                    <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Pasados */}
          {past.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  Realizados
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'var(--surface-raised)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>
                  {past.length}
                </span>
              </div>
              <div className="card divide-y" style={{ borderColor: 'var(--border)' }}>
                {past.slice(0, 15).map((apt: any) => (
                  <Link key={apt.id} href={`/appointments/${apt.id}`} className="list-row"
                    style={{ opacity: 0.65 }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {apt.patient?.first_name} {apt.patient?.last_name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                        {format(new Date(apt.scheduled_at), "d MMM yyyy · HH:mm 'hs'", { locale: es })} · {apt.modality}
                      </p>
                    </div>
                    <StatusBadge status={apt.status as AppointmentStatus} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}