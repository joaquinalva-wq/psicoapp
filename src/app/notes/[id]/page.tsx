import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Calendar, Edit } from 'lucide-react'
import NoteExportButton from '@/components/notes/NoteExportButton'
import NoteAttachments from '@/components/notes/NoteAttachments'
import { fullDateAR, formatAR } from '@/lib/dates'

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: psych } = await supabase
    .from('psychologists')
    .select('id, full_name, profession, license_number, brand_color, office_address')
    .eq('user_id', user.id)
    .single()
  if (!psych) redirect('/settings')

  const { data: note } = await supabase
    .from('session_notes')
    .select('*, patient:patients(id, first_name, last_name)')
    .eq('id', id)
    .eq('psychologist_id', psych.id)
    .single()
  if (!note) notFound()

  const brandColor = psych.brand_color || '#2d5016'

  const sections = [
    { label: 'Motivo de consulta',       value: note.consultation_reason },
    { label: 'Desarrollo de la sesión',  value: note.development },
    { label: 'Intervenciones realizadas', value: note.interventions },
    { label: 'Observaciones clínicas',   value: note.observations },
    { label: 'Próximos pasos',           value: note.next_steps },
  ].filter(s => s.value)

  return (
    <div className="p-8 animate-fade-in" style={{ maxWidth: 820 }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/notes"
          style={{ padding: 8, borderRadius: 8, display: 'flex', color: 'var(--text-tertiary)', textDecoration: 'none' }}>
          <ArrowLeft size={18} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Nota de sesión</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <NoteExportButton note={note} psych={psych} />
          <Link href={`/notes/${id}/edit`} className="btn-secondary" style={{ fontSize: 12, padding: '7px 14px' }}>
            <Edit size={12} /> Editar
          </Link>
        </div>
      </div>

      {/* Info bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '12px 20px', marginBottom: 20,
        fontSize: 13,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <User size={13} style={{ color: 'var(--text-tertiary)' }} />
          <Link href={`/patients/${note.patient_id}`}
            style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>
            {(note.patient as any)?.first_name} {(note.patient as any)?.last_name}
          </Link>
        </div>
        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-secondary)' }}>
          <Calendar size={13} style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ textTransform: 'capitalize' }}>
            {fullDateAR(note.session_date + 'T12:00:00')}
          </span>
        </div>
      </div>

      {/* Ficha clínica */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
      }}>
        {/* Header ficha */}
        <div style={{
          padding: '24px 32px',
          background: `linear-gradient(135deg, ${brandColor} 0%, #3d6b1e 100%)`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 300, color: 'white', fontFamily: 'var(--font-display)', margin: '0 0 4px' }}>
              {psych.full_name}
            </h2>
            {psych.profession && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: '0 0 2px' }}>{psych.profession}</p>
            )}
            {psych.license_number && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Matrícula {psych.license_number}</p>
            )}
            {psych.office_address && (
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{psych.office_address}</p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'white', textTransform: 'capitalize', margin: '0 0 4px' }}>
              {fullDateAR(note.session_date + 'T12:00:00')}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
              {(note.patient as any)?.first_name} {(note.patient as any)?.last_name}
            </p>
          </div>
        </div>

        {/* Secciones */}
        <div style={{ padding: '24px 32px' }}>
          {sections.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0' }}>
              Sin contenido registrado
            </p>
          ) : sections.map(s => (
            <div key={s.label} className="note-preview-section">
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                {s.label}
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 32px',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface-raised)',
        }}>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
            Registrado el {formatAR(note.created_at, "d 'de' MMMM yyyy 'a las' HH:mm 'hs'")}
          </p>
        </div>
      </div>

      {/* Archivos adjuntos */}
      <NoteAttachments
        noteId={note.id}
        psychologistId={psych.id}
        patientId={note.patient_id}
      />

    </div>
  )
}