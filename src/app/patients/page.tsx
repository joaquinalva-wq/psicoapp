import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInYears } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Users } from 'lucide-react'
import Empty from '@/components/ui/Empty'

export default async function PatientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: psych } = await supabase.from('psychologists').select('id').eq('user_id', user.id).single()

  const { data: patients } = await supabase
    .from('patients').select('*')
    .eq('psychologist_id', psych?.id)
    .eq('is_active', true)
    .order('last_name')

  const initials = (fn: string, ln: string) => (fn[0] + ln[0]).toUpperCase()
  const COLORS = ['bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-violet-100 text-violet-700','bg-amber-100 text-amber-700','bg-rose-100 text-rose-700','bg-teal-100 text-teal-700']
  const colorFor = (i: number) => COLORS[i % COLORS.length]

  return (
    <div className="p-8 animate-fade-in max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-slate-800">Pacientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{patients?.length || 0} pacientes activos</p>
        </div>
        <Link href="/patients/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Nuevo paciente
        </Link>
      </div>

      {!patients?.length ? (
        <div className="bg-white border border-slate-200 rounded-xl">
          <Empty icon={<Users size={36} />} title="Sin pacientes aún" description="Agregá tu primer paciente para comenzar." action={<Link href="/patients/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Agregar paciente</Link>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((p, i) => (
            <Link key={p.id} href={`/patients/${p.id}`}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all group">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${colorFor(i)}`}>
                  {initials(p.first_name, p.last_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                    {p.last_name}, {p.first_name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{p.email}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-slate-500">
                {p.phone && <p>📞 {p.phone}</p>}
                {p.date_of_birth && (
                  <p>🎂 {format(new Date(p.date_of_birth + 'T12:00:00'), "d MMM yyyy", { locale: es })} · {differenceInYears(new Date(), new Date(p.date_of_birth))} años</p>
                )}
              </div>
              {p.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {p.tags.slice(0, 3).map((t: string) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">{t}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
          <Link href="/patients/new"
            className="bg-white border border-dashed border-slate-300 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/30 transition-all min-h-[120px]">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <Plus size={16} className="text-slate-400" />
            </div>
            <span className="text-sm text-slate-400">Agregar paciente</span>
          </Link>
        </div>
      )}
    </div>
  )
}
