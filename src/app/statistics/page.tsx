import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function StatisticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: psych } = await supabase.from('psychologists').select('id').eq('user_id', user.id).single()
  const now = new Date()

  const months = Array.from({ length: 5 }, (_, i) => {
    const d = subMonths(now, 4 - i)
    return { label: format(d, 'MMM', { locale: es }), start: startOfMonth(d).toISOString(), end: endOfMonth(d).toISOString() }
  })

  const monthlyData = await Promise.all(months.map(async m => {
    const { count: total } = await supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('psychologist_id', psych?.id).gte('scheduled_at', m.start).lte('scheduled_at', m.end)
    const { count: cancelled } = await supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('psychologist_id', psych?.id).gte('scheduled_at', m.start).lte('scheduled_at', m.end)
      .in('status', ['cancelled_by_patient', 'cancelled_by_psychologist'])
    return { label: m.label, total: total || 0, cancelled: cancelled || 0 }
  }))

  const thisMonth = monthlyData[4]
  const lastMonth = monthlyData[3]

  const [
    { count: totalPatients },
    { count: pendingCount },
    { data: modalities },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true })
      .eq('psychologist_id', psych?.id).eq('is_active', true),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .eq('psychologist_id', psych?.id).eq('status', 'pending_confirmation'),
    supabase.from('appointments').select('modality')
      .eq('psychologist_id', psych?.id)
      .not('status', 'in', '("cancelled_by_patient","cancelled_by_psychologist")'),
  ])

  const presencial = modalities?.filter(a => a.modality === 'presencial').length || 0
  const virtual = modalities?.filter(a => a.modality === 'virtual').length || 0
  const totalMod = presencial + virtual
  const pctPresencial = totalMod ? Math.round((presencial / totalMod) * 100) : 0
  const pctVirtual = totalMod ? 100 - pctPresencial : 0

  const maxVal = Math.max(...monthlyData.map(m => m.total), 1)
  const attendance = thisMonth.total ? Math.round(((thisMonth.total - thisMonth.cancelled) / thisMonth.total) * 100) : 100
  const growth = lastMonth.total ? Math.round(((thisMonth.total - lastMonth.total) / lastMonth.total) * 100) : 0

  return (
    <div className="p-8 animate-fade-in max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl text-slate-800">Estadísticas</h1>
        <p className="text-sm text-slate-500 mt-0.5 capitalize">Resumen de {format(now, "MMMM yyyy", { locale: es })}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Sesiones este mes', value: thisMonth.total, sub: growth > 0 ? `+${growth}% vs mes anterior` : growth < 0 ? `${growth}% vs mes anterior` : 'Sin cambio' , color: 'text-blue-600' },
          { label: 'Tasa de asistencia', value: `${attendance}%`, sub: 'Este mes', color: attendance >= 85 ? 'text-emerald-600' : 'text-amber-600' },
          { label: 'Cancelaciones', value: thisMonth.cancelled, sub: 'Este mes', color: thisMonth.cancelled > 3 ? 'text-red-500' : 'text-slate-700' },
          { label: 'Pacientes activos', value: totalPatients || 0, sub: 'Total en tratamiento', color: 'text-violet-600' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">{k.label}</p>
            <p className={`text-3xl font-light mb-1 ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Bar chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-5">Sesiones últimos 5 meses</h2>
          <div className="flex items-end gap-3 h-32">
            {monthlyData.map((m, i) => {
              const h = maxVal > 0 ? Math.round((m.total / maxVal) * 100) : 0
              const isLast = i === monthlyData.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">{m.total}</span>
                  <div className="w-full rounded-t-md transition-all" style={{
                    height: `${Math.max(h, 4)}%`,
                    minHeight: '4px',
                    background: isLast ? '#2563eb' : '#bfdbfe',
                  }} />
                  <span className="text-[10px] text-slate-400 capitalize">{m.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Modality breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-5">Modalidad de atención</h2>
          <div className="space-y-4">
            {[
              { label: 'Presencial', value: presencial, pct: pctPresencial, color: 'bg-blue-500' },
              { label: 'Virtual', value: virtual, pct: pctVirtual, color: 'bg-emerald-500' },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-slate-600">{m.label}</span>
                  <span className="text-sm font-medium text-slate-800">{m.pct}% <span className="text-slate-400 font-normal">({m.value})</span></span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${m.color} transition-all`} style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total histórico', value: totalMod },
                { label: 'Pendientes', value: pendingCount || 0 },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">{s.label}</p>
                  <p className="text-xl font-light text-slate-700 mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly table */}
        <div className="col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Detalle por mes</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Mes','Total','Completadas','Canceladas','Asistencia'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...monthlyData].reverse().map((m, i) => {
                const done = m.total - m.cancelled
                const att = m.total ? Math.round((done / m.total) * 100) : 100
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-700 capitalize">{m.label}</td>
                    <td className="px-5 py-3 text-slate-600">{m.total}</td>
                    <td className="px-5 py-3 text-slate-600">{done}</td>
                    <td className="px-5 py-3">
                      <span className={m.cancelled > 0 ? 'text-red-500 font-medium' : 'text-slate-400'}>{m.cancelled}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`font-medium ${att >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>{att}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
