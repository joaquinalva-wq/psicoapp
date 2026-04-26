import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Clock } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { AppointmentStatus } from '@/types'
import Empty from '@/components/ui/Empty'

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: psych } = await supabase.from('psychologists').select('id').eq('user_id', user.id).single()

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, patient:patients(first_name, last_name, email)')
    .eq('psychologist_id', psych?.id)
    .not('status', 'in', '("cancelled_by_patient","cancelled_by_psychologist")')
    .order('scheduled_at', { ascending: true })

  const now = new Date()
  const upcoming = appointments?.filter(a => new Date(a.scheduled_at) >= now) || []
  const past = appointments?.filter(a => new Date(a.scheduled_at) < now) || []

  return (
    <div className="p-8 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-slate-800">Turnos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{upcoming.length} próximos · {past.length} pasados</p>
        </div>
        <Link href="/appointments/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Nuevo turno
        </Link>
      </div>

      {/* Pending alert */}
      {appointments?.some(a => a.status === 'pending_confirmation') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800">
          ⚠️ Hay turnos pendientes de confirmación. Revisá los estados a continuación.
        </div>
      )}

      {!appointments?.length ? (
        <div className="bg-white border border-slate-200 rounded-xl">
          <Empty icon={<Clock size={36} />} title="Sin turnos" description="Creá el primer turno para comenzar."
            action={<Link href="/appointments/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Nuevo turno</Link>} />
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Próximos</h2>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {upcoming.map((apt: any) => (
                  <Link key={apt.id} href={`/appointments/${apt.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                    <div className="text-center w-12 flex-shrink-0">
                      <div className="text-[10px] text-slate-400 uppercase capitalize">
                        {format(new Date(apt.scheduled_at), 'EEE', { locale: es })}
                      </div>
                      <div className="text-lg font-light text-slate-700">{format(new Date(apt.scheduled_at), 'd')}</div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {format(new Date(apt.scheduled_at), 'MMM', { locale: es })}
                      </div>
                    </div>
                    <div className="w-px h-10 bg-slate-200 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                        {apt.patient?.first_name} {apt.patient?.last_name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {format(new Date(apt.scheduled_at), "HH:mm 'hs'")} · {apt.duration_minutes} min · {apt.modality}
                      </p>
                    </div>
                    <StatusBadge status={apt.status as AppointmentStatus} />
                  </Link>
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Pasados</h2>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {past.slice(0, 10).map((apt: any) => (
                  <Link key={apt.id} href={`/appointments/${apt.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors opacity-75 hover:opacity-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">{apt.patient?.first_name} {apt.patient?.last_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
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
