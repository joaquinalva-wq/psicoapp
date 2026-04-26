'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Save, Download } from 'lucide-react'
import Link from 'next/link'

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
      const { data: p } = await supabase.from('psychologists').select('*').eq('user_id', user.id).single()
      setPsych(p)
      const { data: pts } = await supabase.from('patients').select('id,first_name,last_name')
        .eq('psychologist_id', p?.id).eq('is_active', true).order('last_name')
      setPatients(pts || [])
    }
    load()
  }, [])

  const handleChange = useCallback((k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
  }, [])

  const selectedPatient = patients.find(p => p.id === form.patient_id)

  async function handleSave() {
    if (!form.patient_id) { toast.error('Seleccioná un paciente'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: p } = await supabase.from('psychologists').select('id').eq('user_id', user!.id).single()
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

    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, pageW, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(psych?.full_name || '', margin, 13)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    if (psych?.license_number) doc.text(`Matrícula: ${psych.license_number}`, margin, 21)
    doc.setTextColor(0, 0, 0)
    y = 42

    doc.setFillColor(248, 250, 252)
    doc.rect(margin, y - 6, contentW, 18, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Fecha:', margin + 3, y + 2)
    doc.setFont('helvetica', 'normal')
    doc.text(
      format(new Date(form.session_date + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es }),
      margin + 22, y + 2
    )
    if (selectedPatient) {
      doc.setFont('helvetica', 'bold')
      doc.text('Paciente:', margin + 3, y + 9)
      doc.setFont('helvetica', 'normal')
      doc.text(`${selectedPatient.first_name} ${selectedPatient.last_name}`, margin + 26, y + 9)
    }
    y += 22

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
      doc.setTextColor(37, 99, 235)
      doc.text(section.title, margin, y)
      y += 5
      doc.setDrawColor(37, 99, 235)
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
      doc.text(`PsicoApp · ${psych?.full_name || ''} · Página ${i}/${pageCount}`, margin, 290)
    }

    doc.save(`nota-${form.session_date}-${selectedPatient?.last_name || 'paciente'}.pdf`)
    toast.success('PDF descargado')
  }

  const taStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1e293b',
    background: 'white',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.6',
    outline: 'none',
    display: 'block',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
  }

  const fields = [
    { key: 'consultation_reason', label: 'Motivo de consulta', rows: 3, ph: '¿Por qué consulta el paciente?' },
    { key: 'development', label: 'Desarrollo de la sesión', rows: 5, ph: 'Descripción de lo trabajado en sesión...' },
    { key: 'interventions', label: 'Intervenciones realizadas', rows: 4, ph: 'Técnicas y herramientas utilizadas...' },
    { key: 'observations', label: 'Observaciones clínicas', rows: 3, ph: 'Observaciones del profesional...' },
    { key: 'next_steps', label: 'Próximos pasos', rows: 3, ph: 'Objetivos para la próxima sesión...' },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: 'white', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/notes" style={{ padding: '4px', borderRadius: '8px', display: 'flex' }}>
            <ArrowLeft size={16} color="#64748b" />
          </Link>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Nueva nota de sesión</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportPDF}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
            <Download size={13} /> PDF
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', background: saving ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            <Save size={13} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT: Editor */}
        <div style={{ width: '50%', overflowY: 'auto', borderRight: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Patient + Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Paciente *</label>
                <select
                  value={form.patient_id}
                  onChange={e => handleChange('patient_id', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">— Seleccionar —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Fecha</label>
                <input
                  type="date"
                  value={form.session_date}
                  onChange={e => handleChange('session_date', e.target.value)}
                />
              </div>
            </div>

            {/* Text fields */}
            {fields.map(({ key, label, rows, ph }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <textarea
                  value={form[key]}
                  onChange={e => handleChange(key, e.target.value)}
                  rows={rows}
                  placeholder={ph}
                  style={taStyle}
                />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Preview */}
        <div style={{ width: '50%', overflowY: 'auto', background: '#f8fafc', padding: '24px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
            Vista previa — Ficha clínica
          </p>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {/* Preview header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', fontFamily: 'Georgia, serif' }}>
                  {psych?.full_name || 'Nombre del profesional'}
                </p>
                {psych?.license_number && (
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Matrícula {psych.license_number}</p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '12px', fontWeight: 500, color: '#475569' }}>
                  {format(new Date(form.session_date + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })}
                </p>
                {selectedPatient && (
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </p>
                )}
              </div>
            </div>

            {/* Preview sections */}
            <div style={{ padding: '20px 24px' }}>
              {fields.map(({ key, label }) => form[key] ? (
                <div key={key} style={{ paddingTop: '14px', borderTop: '1px solid #f1f5f9', marginTop: '14px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    {label}
                  </p>
                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>
                    {form[key]}
                  </p>
                </div>
              ) : null)}
              {!form.consultation_reason && !form.development && !form.interventions && (
                <p style={{ fontSize: '13px', color: '#cbd5e1', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
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