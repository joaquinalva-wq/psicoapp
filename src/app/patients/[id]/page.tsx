import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInYears } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft, Edit, Plus, Calendar, FileText,
  Clock, User, Heart, Briefcase, Phone, Mail,
  AlertCircle, ChevronRight
} from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { AppointmentStatus } from '@/types'

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: psych } = await supabase
    .from('psychologists')
    .select('id, brand_color')
    .eq('user_id', user.id)
    .single()

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('psychologist_id', psych?.id)
    .single()
  if (!patient) notFound()

  const [
    { data: appointments },
    { data: notes },
  ] = await Promise.all([
    supabase.from('appointments')
      .select('id, scheduled_at, duration_minutes, modality, status')
      .eq('patient_id', id)
      .order('scheduled_at', { ascending: false }),
    supabase.from('session_notes')
      .select('id, session_date, consultation_reason, development, next_steps')
      .eq('patient_id', id)
      .order('session_date', { ascending: false }),
  ])

  const now = new Date()
  const upcoming = appointments?.filter(a =>
    new Date(a.scheduled_at) > now &&
    !['cancelled_by_patient', 'cancelled_by_psychologist'].includes(a.status)
  ) || []
  const past = appointments?.filter(a =>
    new Date(a.scheduled_at) <= now &&
    !['cancelled_by_patient', 'cancelled_by_psychologist'].includes(a.status)
  ) || []
  const cancelled = appointments?.filter(a =>
    ['cancelled_by_patient', 'cancelled_by_psychologist'].includes(a.status)
  ) || []

  const attendance = appointments?.length
    ? Math.round(((appointments.length - cancelled.length) / appointments.length) * 100)
    : 100

  const brandColor = psych?.brand_color || '#2d5016'
  const initials = (patient.first_name[0] + patient.last_name[0]).toUpperCase()
  const colorSeed = patient.first_name.charCodeAt(0) % 6
  const avatarColors = [
    { bg: '#dbeafe', text: '#1e40af' },
    { bg: '#d1fae5', text: '#065f46' },
    { bg: '#ede9fe', text: '#5b21b6' },
    { bg: '#fce7f3', text: '#9d174d' },
    { bg: '#fef3c7', text: '#92400e' },
    { bg: '#ccfbf1', text: '#134e4a' },
  ]
  const avatarColor = avatarColors[colorSeed]

  return (
    <div className="p-8 animate-fade-in" style={{ maxWidth: 1100 }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/patients"
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-light" style={{ color: 'var(--text-primary)' }}>
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Historia clínica · En tratamiento desde {format(new Date(patient.created_at), "MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/patients/${id}/edit`} className="btn-secondary" style={{ fontSize: 12, padding: '7px 14px' }}>
            <Edit size={12} /> Editar
          </Link>
          <Link href={`/notes/new?patient=${id}`} className="btn-secondary" style={{ fontSize: 12, padding: '7px 14px', color: brandColor, borderColor: brandColor }}>
            <FileText size={12} /> Nueva nota
          </Link>
          <Link href={`/appointments/new?patient=${id}`} className="btn-primary" style={{ fontSize: 12, padding: '7px 14px' }}>
            <Plus size={12} /> Nuevo turno
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>

        {/* ── Columna izquierda ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Perfil */}
          <div className="card">
            <div style={{ padding: '24px 20px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: avatarColor.bg, color: avatarColor.text,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 600, margin: '0 auto 12px',
              }}>
                {initials}
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                {patient.first_name} {patient.last_name}
              </h2>
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 99,
                background: '#d1fae5', color: '#065f46', fontWeight: 500,
              }}>
                Activo
              </span>
            </div>

            <div style={{ padding: '8px 0' }}>
              {[
                { icon: Mail, label: patient.email },
                { icon: Phone, label: patient.phone || '—' },
                {
                  icon: User,
                  label: patient.date_of_birth
                    ? `${differenceInYears(now, new Date(patient.date_of_birth))} años · ${format(new Date(patient.date_of_birth + 'T12:00:00'), "d MMM yyyy", { locale: es })}`
                    : 'Sin fecha de nacimiento'
                },
                { icon: Briefcase, label: patient.occupation || 'Ocupación no registrada' },
                { icon: Heart, label: patient.marital_status || 'Estado civil no registrado' },
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 20px',
                  borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                }}>
                  <row.icon size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Métricas */}
          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Métricas clínicas
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Sesiones', value: past.length, color: brandColor, bg: '#f0f4ec' },
                { label: 'Notas', value: notes?.length || 0, color: '#7c3aed', bg: '#ede9fe' },
                { label: 'Canceladas', value: cancelled.length, color: '#d97706', bg: '#fef3c7' },
                { label: 'Asistencia', value: `${attendance}%`, color: attendance >= 80 ? '#059669' : '#d97706', bg: attendance >= 80 ? '#d1fae5' : '#fef3c7' },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 10, color: m.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    {m.label}
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 300, color: m.color }}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Datos clínicos */}
          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Datos clínicos
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 3 }}>Motivo de consulta</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {patient.initial_reason || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No registrado</span>}
                </p>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 3 }}>Diagnóstico</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {patient.diagnosis || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No registrado</span>}
                </p>
              </div>
              {patient.referred_by && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 3 }}>Derivado por</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{patient.referred_by}</p>
                </div>
              )}
            </div>
          </div>

          {/* Obra social */}
          {(patient.insurance_name || patient.insurance_number) && (
            <div className="card" style={{ padding: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Cobertura médica
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {patient.insurance_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Obra social</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{patient.insurance_name}</span>
                  </div>
                )}
                {patient.insurance_number && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Número</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{patient.insurance_number}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contacto de emergencia */}
          {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
            <div className="card" style={{ padding: 16, borderColor: '#fde68a', background: '#fffbeb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <AlertCircle size={12} style={{ color: '#d97706' }} />
                <p style={{ fontSize: 10, fontWeight: 600, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Contacto de emergencia
                </p>
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#78350f' }}>{patient.emergency_contact_name}</p>
              {patient.emergency_contact_phone && (
                <p style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>{patient.emergency_contact_phone}</p>
              )}
            </div>
          )}

          {/* Tags */}
          {patient.tags?.length > 0 && (
            <div className="card" style={{ padding: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Etiquetas
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {patient.tags.map((t: string) => (
                  <span key={t} style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 99,
                    background: '#f0f4ec', color: brandColor, fontWeight: 500,
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notas admin */}
          {patient.admin_notes && (
            <div className="card" style={{ padding: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Notas administrativas
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{patient.admin_notes}</p>
            </div>
          )}
        </div>

        {/* ── Columna derecha ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Notas clínicas generales */}
          {patient.clinical_notes && (
            <div className="card" style={{ padding: 20, borderLeft: `3px solid ${brandColor}`, borderRadius: '0 12px 12px 0' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: brandColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Notas clínicas generales
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{patient.clinical_notes}</p>
            </div>
          )}

          {/* Próximos turnos */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Próximos turnos</h3>
              </div>
              <Link href={`/appointments/new?patient=${id}`}
                style={{ fontSize: 11, fontWeight: 500, color: brandColor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={11} /> Nuevo
              </Link>
            </div>
            {!upcoming.length ? (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Sin turnos próximos</p>
                <Link href={`/appointments/new?patient=${id}`}
                  style={{ fontSize: 12, color: brandColor, textDecoration: 'none', fontWeight: 500, display: 'inline-block', marginTop: 8 }}>
                  Agendar turno →
                </Link>
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                {upcoming.map(apt => (
                  <Link key={apt.id} href={`/appointments/${apt.id}`} className="list-row">
                    <div style={{ flexShrink: 0, width: 44, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 500 }}>
                        {format(new Date(apt.scheduled_at), 'EEE', { locale: es })}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        {format(new Date(apt.scheduled_at), 'd')}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                        {format(new Date(apt.scheduled_at), "d 'de' MMMM · HH:mm 'hs'", { locale: es })}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {apt.duration_minutes} min · {apt.modality}
                      </p>
                    </div>
                    <StatusBadge status={apt.status as AppointmentStatus} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Historia clínica — notas de sesión */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={14} style={{ color: 'var(--text-tertiary)' }} />
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Historia clínica</h3>
                {notes?.length ? (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#f0f4ec', color: brandColor, fontWeight: 500 }}>
                    {notes.length} {notes.length === 1 ? 'sesión' : 'sesiones'}
                  </span>
                ) : null}
              </div>
              <Link href={`/notes/new?patient=${id}`}
                style={{ fontSize: 11, fontWeight: 500, color: brandColor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={11} /> Nueva nota
              </Link>
            </div>

            {!notes?.length ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f0f4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <FileText size={18} style={{ color: brandColor }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Sin notas de sesión
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 14 }}>
                  Documentá el trabajo clínico después de cada sesión
                </p>
                <Link href={`/notes/new?patient=${id}`}
                  className="btn-primary"
                  style={{ display: 'inline-flex', fontSize: 12, padding: '8px 16px' }}>
                  <Plus size={12} /> Registrar primera nota
                </Link>
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                {notes.map((note, i) => (
                  <Link key={note.id} href={`/notes/${note.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '16px 20px',
                      borderBottom: i < notes.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.12s',
                      cursor: 'pointer',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      {/* Timeline dot */}
                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: i === 0 ? brandColor : 'var(--border)',
                          border: `2px solid ${i === 0 ? brandColor : 'var(--border)'}`,
                        }} />
                        {i < notes.length - 1 && (
                          <div style={{ width: 1, flex: 1, minHeight: 32, background: 'var(--border)', marginTop: 4 }} />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                            {format(new Date(note.session_date + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })}
                          </p>
                          {i === 0 && (
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: '#f0f4ec', color: brandColor, fontWeight: 500, flexShrink: 0 }}>
                              Última sesión
                            </span>
                          )}
                        </div>
                        {note.consultation_reason && (
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 4 }}>
                            {note.consultation_reason}
                          </p>
                        )}
                        {note.development && (
                          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {note.development}
                          </p>
                        )}
                        {note.next_steps && (
                          <div style={{ marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <ChevronRight size={11} style={{ color: brandColor, flexShrink: 0, marginTop: 1 }} />
                            <p style={{ fontSize: 11, color: brandColor, fontWeight: 500 }}>
                              {note.next_steps}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Historial de turnos */}
          {past.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Historial de turnos</h3>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{past.length} realizados</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)' }}>
                {past.slice(0, 8).map((apt, i) => (
                  <Link key={apt.id} href={`/appointments/${apt.id}`} className="list-row"
                    style={{ opacity: 0.75 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                        {format(new Date(apt.scheduled_at), "d MMM yyyy · HH:mm 'hs'", { locale: es })}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {apt.duration_minutes} min · {apt.modality}
                      </p>
                    </div>
                    <StatusBadge status={apt.status as AppointmentStatus} />
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}