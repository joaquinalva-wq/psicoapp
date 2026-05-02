import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, FileText, ChevronRight } from 'lucide-react'

export default async function NotesPage() {
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

  const { data: notes } = await supabase
    .from('session_notes')
    .select('id, session_date, consultation_reason, development, next_steps, patient:patients(id, first_name, last_name)')
    .eq('psychologist_id', psych.id)
    .order('session_date', { ascending: false })

  // Agrupar por paciente para mostrar stats
  const byPatient: Record<string, number> = {}
  for (const note of notes || []) {
    const pid = (note.patient as any)?.id
    if (pid) byPatient[pid] = (byPatient[pid] || 0) + 1
  }
  const uniquePatients = Object.keys(byPatient).length

  const avatarColors = [
    { bg: '#dbeafe', text: '#1e40af' },
    { bg: '#d1fae5', text: '#065f46' },
    { bg: '#ede9fe', text: '#5b21b6' },
    { bg: '#fce7f3', text: '#9d174d' },
    { bg: '#fef3c7', text: '#92400e' },
    { bg: '#ccfbf1', text: '#134e4a' },
  ]

  return (
    <div className="p-8 animate-fade-in" style={{ maxWidth: 900 }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Notas de sesión</h1>
          <p className="page-subtitle">
            {notes?.length || 0} notas · {uniquePatients} pacientes
          </p>
        </div>
        <Link href="/notes/new" className="btn-primary">
          <Plus size={14} /> Nueva nota
        </Link>
      </div>

      {!notes?.length ? (
        <div className="card" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0f4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FileText size={24} style={{ color: brandColor }} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Sin notas registradas
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>
            Las notas de sesión te permiten documentar el trabajo clínico con cada paciente.
          </p>
          <Link href="/notes/new" className="btn-primary" style={{ display: 'inline-flex' }}>
            <Plus size={14} /> Crear primera nota
          </Link>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {notes.map((note: any, i: number) => {
            const patient = note.patient
            const colorIdx = patient?.first_name?.charCodeAt(0) % avatarColors.length || 0
            const color = avatarColors[colorIdx]
            const initials = ((patient?.first_name?.[0] || '') + (patient?.last_name?.[0] || '')).toUpperCase()

            return (
              <Link key={note.id} href={`/notes/${note.id}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '16px 20px',
                    borderBottom: i < notes.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: color.bg, color: color.text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600, flexShrink: 0,
                  }}>
                    {initials}
                  </div>

                  {/* Contenido */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {patient?.first_name} {patient?.last_name}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {format(new Date(note.session_date + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })}
                      </span>
                    </div>
                    {note.consultation_reason && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {note.consultation_reason}
                      </p>
                    )}
                    {note.development && (
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {note.development}
                      </p>
                    )}
                    {note.next_steps && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <ChevronRight size={11} style={{ color: brandColor, flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: brandColor, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {note.next_steps}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Fecha lateral */}
                  <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 36 }}>
                    <div style={{ fontSize: 18, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1 }}>
                      {format(new Date(note.session_date + 'T12:00:00'), 'd')}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginTop: 2 }}>
                      {format(new Date(note.session_date + 'T12:00:00'), 'MMM', { locale: es })}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}