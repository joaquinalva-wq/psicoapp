import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInYears } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Users, ChevronRight, Calendar } from 'lucide-react'

export default async function PatientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: psych } = await supabase
    .from('psychologists')
    .select('id, brand_color')
    .eq('user_id', user.id)
    .single()

  if (!psych) redirect('/settings')

  const brandColor = psych.brand_color || '#2d5016'

  const { data: patients } = await supabase
    .from('patients')
    .select('id, first_name, last_name, email, phone, date_of_birth, tags, created_at')
    .eq('psychologist_id', psych.id)
    .eq('is_active', true)
    .order('last_name')

  // Último turno por paciente
  const patientIds = (patients || []).map(p => p.id)
  const { data: lastApts } = patientIds.length > 0
    ? await supabase
        .from('appointments')
        .select('patient_id, scheduled_at')
        .eq('psychologist_id', psych.id)
        .in('patient_id', patientIds)
        .in('status', ['completed', 'confirmed'])
        .order('scheduled_at', { ascending: false })
    : { data: [] }

  const lastAptMap: Record<string, string> = {}
  for (const apt of (lastApts || [])) {
    if (!lastAptMap[apt.patient_id]) {
      lastAptMap[apt.patient_id] = apt.scheduled_at
    }
  }

  const COLORS = [
    { bg: '#dbeafe', text: '#1e40af' },
    { bg: '#d1fae5', text: '#065f46' },
    { bg: '#ede9fe', text: '#5b21b6' },
    { bg: '#fce7f3', text: '#9d174d' },
    { bg: '#fef3c7', text: '#92400e' },
    { bg: '#ccfbf1', text: '#134e4a' },
  ]

  return (
    <div className="p-8 animate-fade-in" style={{ maxWidth: 1000 }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-subtitle">{patients?.length || 0} pacientes activos en tratamiento</p>
        </div>
        <Link href="/patients/new" className="btn-primary">
          <Plus size={14} /> Nuevo paciente
        </Link>
      </div>

      {!patients?.length ? (
        <div className="card py-16 text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--surface-raised)' }}>
            <Users size={24} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Sin pacientes aún</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>Agregá tu primer paciente para comenzar</p>
          <Link href="/patients/new" className="btn-primary" style={{ display: 'inline-flex' }}>
            <Plus size={14} /> Agregar paciente
          </Link>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {patients.map((p, i) => {
            const color = COLORS[i % COLORS.length]
            const lastApt = lastAptMap[p.id]
            return (
              <Link key={p.id} href={`/patients/${p.id}`}
                className="group block rounded-xl border p-5 transition-all"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}>

                {/* Cabecera paciente */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                    style={{ background: color.bg, color: color.text }}>
                    {p.first_name[0]}{p.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate transition-colors"
                      style={{ color: 'var(--text-primary)' }}>
                      {p.last_name}, {p.first_name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{p.email}</p>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                </div>

                {/* Info */}
                <div className="space-y-1.5 text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {p.phone && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--text-tertiary)' }}>📞</span>
                      <span>{p.phone}</span>
                    </div>
                  )}
                  {p.date_of_birth && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--text-tertiary)' }}>🎂</span>
                      <span>
                        {differenceInYears(new Date(), new Date(p.date_of_birth))} años ·{' '}
                        {format(new Date(p.date_of_birth + 'T12:00:00'), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                  )}
                  {lastApt && (
                    <div className="flex items-center gap-2">
                      <Calendar size={11} style={{ color: 'var(--text-tertiary)' }} />
                      <span>
                        Última sesión: {format(new Date(lastApt), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {p.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 3).map((t: string) => (
                      <span key={t}
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--epsi-green-pale)', color: brandColor }}>
                        {t}
                      </span>
                    ))}
                    {p.tags.length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--surface-raised)', color: 'var(--text-tertiary)' }}>
                        +{p.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            )
          })}

          {/* Card agregar */}
          <Link href="/patients/new"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 transition-all"
            style={{
              borderColor: 'var(--border)',
              minHeight: 160,
              color: 'var(--text-tertiary)',
            }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'var(--surface-raised)' }}>
              <Plus size={16} />
            </div>
            <span className="text-sm">Agregar paciente</span>
          </Link>
        </div>
      )}
    </div>
  )
}