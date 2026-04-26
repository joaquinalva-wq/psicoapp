import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { XCircle } from 'lucide-react'
import Empty from '@/components/ui/Empty'

export default async function CancelledPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: psych } = await supabase.from('psychologists').select('id').eq('user_id', user.id).single()

  const { data: cancelled } = await supabase
    .from('appointments')
    .select('*, patient:patients(first_name, last_name)')
    .eq('psychologist_id', psych?.id)
    .in('status', ['cancelled_by_patient', 'cancelled_by_psychologist'])
    .order('cancelled_at', { ascending: false })

  return (
    <div className="p-8 animate-fade-in max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl text-slate-800">Turnos cancelados</h1>
        <p className="text-sm text-slate-500 mt-0.5">{cancelled?.length || 0} cancelaciones registradas</p>
      </div>

      {!cancelled?.length ? (
        <div className="bg-white border border-slate-200 rounded-xl">
          <Empty icon={<XCircle size={36} />} title="Sin cancelaciones" description="Los turnos cancelados aparecerán aquí." />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {cancelled.map((apt: any) => (
            <div key={apt.id} className="flex items-start gap-4 px-5 py-4">
              <div className="w-10 text-center flex-shrink-0">
                <div className="text-[10px] text-slate-400 uppercase capitalize">
                  {format(new Date(apt.scheduled_at), 'MMM', { locale: es })}
                </div>
                <div className="text-base font-light text-slate-600">{format(new Date(apt.scheduled_at), 'd')}</div>
                <div className="text-[10px] text-slate-400">{format(new Date(apt.scheduled_at), 'yyyy')}</div>
              </div>
              <div className="w-px h-12 bg-red-100 flex-shrink-0 self-center" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/patients/${apt.patient_id}`}
                    className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                    {apt.patient?.first_name} {apt.patient?.last_name}
                  </Link>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                    {apt.status === 'cancelled_by_patient' ? 'Por paciente' : 'Por profesional'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {format(new Date(apt.scheduled_at), "HH:mm 'hs'", { locale: es })} · {apt.duration_minutes} min · {apt.modality}
                </p>
                {apt.cancelled_reason && apt.cancelled_reason !== 'cancelled_by_patient' && apt.cancelled_reason !== 'cancelled_by_psychologist' && (
                  <p className="text-xs text-slate-500 mt-1 italic">"{apt.cancelled_reason}"</p>
                )}
              </div>
              {apt.cancelled_at && (
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-slate-400">Cancelado el</p>
                  <p className="text-xs text-slate-500">{format(new Date(apt.cancelled_at), "d MMM", { locale: es })}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
