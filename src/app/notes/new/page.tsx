'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Download } from 'lucide-react'
import Link from 'next/link'
import { formatAR, fullDateAR } from '@/lib/dates'

export default function NewNotePage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [psych, setPsych] = useState<any>(null)
  const [form, setForm] = useState({
    patient_id: '',
    appointment_id: '',
    session_date: new Date().toISOString().split('T')[0],
    consultation_reason: '',
    development: '',
    interventions: '',
    observations: '',
    next_steps: '',
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setForm(f => ({
      ...f,
      patient_id: params.get('patient') || '',
      appointment_id: params.get('appointment') || '',
    }))
  }, [])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase
        .from('psychologists').select('*').eq('user_id', user.id).single()
      if (!p) return
      setPsych(p)
      const { data: pts } = await supabase
        .from('patients').select('id,first_name,last_name')
        .eq('psychologist_id', p.id).eq('is_active', true).order('last_name')
      setPatients(pts || [])
    }
    load()
  }, [])

  const handleChange = useCallback((k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
  }, [])

  const selectedPatient = patients.find(p => p.id === form.patient_id)
  const brandColor = psych?.brand_color || '#2d5016'

  async function handleSave() {
    if (!form.patient_id) { toast.error('Seleccioná un paciente'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: p } = await supabase
      .from('psychologists').select('id').eq('user_id', user!.id).single()
    const { data, error } = await supabase.from('session_notes').insert({
      psychologist_id: p?.id,
      patient_id: form.patient_id,
      appointment_id: form.appointment_id || null,
      session_date: form.session_date,
      consultation_reason: form.consultation_reason || null,
      development: form.development || null,
      interventions: form.interventions || null,
      observations: form.observations || null,
      next_steps: form.next_steps || null,
    }).select().single()
    if (error) { toast.error('Error al guardar') }
    else { toast.success('Nota guardada'); router.push(`/notes/${data.id}`) }
    setSaving(false)
  }

  async function handleExportPDF() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const margin = 20
    const pageW = 210
    const contentW = pageW - margin * 2
    let y = margin

    // Header con color EPSI
    doc.setFillColor(45, 80, 22)
    doc.rect(0, 0, pageW, 32, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(psych?.full_name || '', margin, 14)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    if (psych?.license_number) doc.text(`Matrícula: ${psych.license_number}`, margin, 22)
    doc.setFontSize(8)
    doc.text('EPSI — Espacio Psicológico Integral · Campana, Buenos Aires', margin, 29)
    doc.setTextColor(0, 0, 0)
    y = 44

    // Info sesión
    doc.setFillColor(240, 244, 236)
    doc.rect(margin, y - 6, contentW, 20, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Fecha:', margin + 3, y + 2)
    doc.setFont('helvetica', 'normal')
    doc.text(
      fullDateAR(form.session_date + 'T12:00:00'),
      margin + 22, y + 2
    )
    if (selectedPatient) {
      doc.setFont('helvetica', 'bold')
      doc.text('Paciente:', margin + 3, y + 9)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `${selectedPatient.first_name} ${selectedPatient.last_name}`,
        margin + 28, y + 9
      )
    }
    y += 26

    const sections = [
      { title: 'Motivo de consulta', content: form.consultation_reason },
      { title: 'Desarrollo de sesión', content: form.development },
      { title: 'Intervenciones realizadas', content: form.interventions },
      { title: 'Observaciones clínicas', content: form.observations },
      { title: 'Próximos pasos', content: form.next_steps },
    ].filter(s => s.content)

    for (const section of sections) {
      if (y > 250) { doc.addPage(); y = margin }
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(45, 80, 22)
      doc.text(section.title, margin, y)
      y += 5
      doc.setDrawColor(45, 80, 22)
      doc.setLineWidth(0.3)
      doc.line(margin, y, margin + contentW, y)
      y += 5
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const lines = doc.splitTextToSize(section.content!, contentW)
      if (y + lines.length * 5 > 270) { doc.addPage(); y = margin }
      doc.text(lines, margin, y)
      y += lines.length * 5 + 8
    }

    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(
        `EPSI · ${psych?.full_name || ''} · Página ${i}/${pageCount}`,
        margin, 290
      )
    }

    doc.save(`nota-${form.session_date}-${selectedPatient?.last_name || 'paciente'}.pdf`)
    toast.success('PDF descargado')
  }

  const fields = [
    { key: 'consultation_reason', label: 'Motivo de consulta', rows: 3, ph: '¿Por qué consulta el paciente hoy?' },
    { key: 'development', label: 'Desarrollo de la sesión', rows: 6, ph: 'Descripción de lo trabajado en sesión...' },
    { key: 'interventions', label: 'Intervenciones realizadas', rows: 4, ph: 'Técnicas y herramientas utilizadas...' },
    { key: 'observations', label: 'Observaciones clínicas', rows: 3, ph: 'Observaciones del profesional...' },
    { key: 'next_steps', label: 'Próximos pasos', rows: 3, ph: 'Objetivos para la próxima sesión...' },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-sans)' }}>

      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/notes" style={{ padding: 6, borderRadius: 8, display: 'flex', color: 'var(--text-tertiary)', textDecoration: 'none' }}>
            <ArrowLeft size={16} />
          </Link>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Nueva nota de sesión
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExportPDF} className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
            <Download size={13} /> PDF
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ fontSize: 12, padding: '6px 16px' }}>
            <Save size={13} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT: Editor */}
        <div style={{
          width: '50%', overflowY: 'auto',
          borderRight: '1px solid var(--border)',
          background: 'var(--surface)',
        }}>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Paciente + Fecha */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Paciente *
                </label>
                <select
                  value={form.patient_id}
                  onChange={e => handleChange('patient_id', e.target.value)}
                >
                  <option value="">— Seleccionar —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Fecha de sesión
                </label>
                <input
                  type="date"
                  value={form.session_date}
                  onChange={e => handleChange('session_date', e.target.value)}
                />
              </div>
            </div>

            {/* Campos */}
            {fields.map(({ key, label, rows, ph }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  {label}
                </label>
                <textarea
                  value={form[key]}
                  onChange={e => handleChange(key, e.target.value)}
                  rows={rows}
                  placeholder={ph}
                />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Preview */}
        <div style={{
          width: '50%', overflowY: 'auto',
          background: 'var(--surface-raised)',
          padding: 24,
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Vista previa — Ficha clínica
          </p>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 12,
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}>
            {/* Preview header — verde EPSI */}
            <div style={{
              padding: '18px 24px',
              background: `linear-gradient(135deg, ${brandColor} 0%, #3d6b1e 100%)`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'white', fontFamily: 'var(--font-display)' }}>
                  {psych?.full_name || 'Nombre del profesional'}
                </p>
                {psych?.license_number && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    Matrícula {psych.license_number}
                  </p>
                )}
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  EPSI — Campana, Buenos Aires
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'white' }}>
                  {/* Fix timezone: usar fecha local sin conversión UTC */}
                  {fullDateAR(form.session_date + 'T12:00:00')}
                </p>
                {selectedPatient && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </p>
                )}
              </div>
            </div>

            {/* Preview body */}
            <div style={{ padding: '20px 24px' }}>
              {fields.map(({ key, label }) => form[key] ? (
                <div key={key} className="note-preview-section">
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                    {form[key]}
                  </p>
                </div>
              ) : null)}
              {!form.consultation_reason && !form.development && !form.interventions && (
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                  La vista previa aparece aquí mientras escribís...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}