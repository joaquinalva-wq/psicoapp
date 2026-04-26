import { createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

export default async function ConfirmPage({
  params, searchParams
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ action?: string }>
}) {
  const { token } = await params
  const { action } = await searchParams
  const supabase = await createServiceClient()

  const { data: apt } = await supabase.from('appointments')
    .select('*, patient:patients(*), psychologist:psychologists(*)')
    .eq('confirmation_token', token).single()

  if (!apt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center bg-white border border-slate-200 rounded-2xl p-10 max-w-sm w-full">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">Link inválido</h2>
          <p className="text-sm text-slate-400">Este enlace no existe o ya expiró.</p>
        </div>
      </div>
    )
  }

  const dateStr = format(new Date(apt.scheduled_at), "EEEE d 'de' MMMM 'a las' HH:mm 'hs'", { locale: es })
  const brand = apt.psychologist?.brand_color || '#2563eb'

  // Show result page after action
  if (action === 'confirmed' || action === 'reconfirmed' || action === 'cancelled') {
    const isCancel = action === 'cancelled'
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-slate-200 text-center p-10 animate-slide-up">
          <div className={`w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl ${isCancel ? 'bg-red-50' : 'bg-emerald-50'}`}>
            {isCancel ? '✕' : '✓'}
          </div>
          <h2 className="text-xl text-slate-800 mb-2">
            {action === 'confirmed' && 'Turno confirmado'}
            {action === 'reconfirmed' && '¡Asistencia confirmada!'}
            {action === 'cancelled' && 'Turno cancelado'}
          </h2>
          <p className="text-sm text-slate-500 capitalize">{dateStr}</p>
          <p className="text-sm text-slate-400 mt-1">con {apt.psychologist?.full_name}</p>
          {!isCancel && (
            <p className="text-xs text-slate-400 mt-4">
              Te esperamos. Ante cualquier duda, contactá al profesional.
            </p>
          )}
        </div>
      </div>
    )
  }

  // Show confirmation options
  const confirmUrl = `/api/confirm/${token}?action=confirm`
  const cancelUrl  = `/api/confirm/${token}?action=cancel`

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-slide-up">
        <div className="p-6 text-center" style={{ background: brand }}>
          <p className="text-white font-semibold text-lg">{apt.psychologist?.full_name}</p>
          <p className="text-white/70 text-sm mt-0.5">Confirmación de turno</p>
        </div>

        <div className="p-7">
          <p className="text-slate-600 mb-5">
            Hola <strong className="text-slate-800">{apt.patient?.first_name}</strong>, ¿confirmás tu turno?
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-slate-800 capitalize mb-1">{dateStr}</p>
            <p className="text-sm text-slate-500">{apt.duration_minutes} minutos · {apt.modality === 'presencial' ? 'Presencial' : 'Virtual'}</p>
          </div>

          <div className="space-y-3">
            <a href={confirmUrl}
              className="block w-full py-3 text-center rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: brand }}>
              ✓ Confirmar turno
            </a>
            <a href={cancelUrl}
              className="block w-full py-3 text-center rounded-xl text-sm font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
              ✕ No puedo asistir
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
