'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Save, Download } from 'lucide-react'
import Link from 'next/link'

export default function NewNotePage() {
  const router = useRouter()
  const sp = useSearchParams()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [psych, setPsych] = useState<any>(null)
  const [form, setForm] = useState({
    patient_id: sp.get('patient') || '',
    appointment_id: sp.get('appointment') || '',
    session_date: new Date().toISOString().split('T')[0],
    consultation_reason: '',
    development: '',
    interventions: '',
    observations: '',
    next_steps: '',
  })

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

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

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

    // Header bar
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, pageW, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text(psych?.full_name || 'Psicólogo/a', margin, 13)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    if (psych?.license_number) doc.text(`Matrícula: ${psych.license_number}`, margin, 20)
    doc.setTextColor(0, 0, 0)
    y = 42

    // Date + patient info box
    doc.setFillColor(248, 250, 252)
    doc.rect(margin, y - 6, contentW, 18, 'F')
    doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.text('Fecha:', margin + 3, y + 2)
    doc.setFont('helvetica', 'normal')
    doc.text(format(new Date(form.session_date + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es }), margin + 22, y + 2)
    if (selectedPatient) {
      doc.setFont('helvetica', 'bold'); doc.text('Paciente:', margin + 3, y + 9)
      doc.setFont('helvetica', 'normal'); doc.text(`${selectedPatient.first_name} ${selectedPatient.last_name}`, margin + 26, y + 9)
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
      doc.setFontSize(10); doc.setFont('helvetica', 'bold')
      doc.setTextColor(37, 99, 235)
      doc.text(section.title, margin, y); y += 5
      doc.setDrawColor(37, 99, 235); doc.setLineWidth(0.3)
      doc.line(margin, y, margin + contentW, y); y += 5
      doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
      const lines = doc.splitTextToSize(section.content!, contentW)
      if (y + lines.length * 5 > 270) { doc.addPage(); y = margin }
      doc.text(lines, margin, y); y += lines.length * 5 + 8
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150)
      doc.text(`PsicoApp · ${psych?.full_name || ''} · Página ${i}/${pageCount}`, margin, 290)
    }

    doc.save(`nota-${form.session_date}-${selectedPatient?.last_name || 'paciente'}.pdf`)
    toast.success('PDF descargado')
  }

  const Field = ({ k, label, rows = 4, placeholder }: { k: keyof typeof form; label: string; rows?: number; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</label>
      <textarea value={form[k] as string} onChange={e => set(k, e.target.value)} rows={rows}
        placeholder={placeholder || 'Escribí aquí...'}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none font-sans leading-relaxed" />
    </div>
  )

  return (
    <div className="flex flex-col h-screen overflow-hidden animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/notes" className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} className="text-slate-500" />
          </Link>
          <span className="text-sm font-semibold text-slate-800">Nueva nota de sesión</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs hover:bg-slate-50 transition-colors">
            <Download size={13} /> PDF
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Save size={13} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Editor */}
        <div className="w-1/2 border-r border-slate-200 overflow-y-auto bg-white">
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Paciente *</label>
                <select value={form.patient_id} onChange={e => set('patient_id', e.target.value)}>
                  <option value="">— Seleccionar —</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Fecha</label>
                <input type="date" value={form.session_date} onChange={e => set('session_date', e.target.value)} />
              </div>
            </div>
            <Field k="consultation_reason" label="Motivo de consulta" rows={3} placeholder="¿Por qué consulta el paciente?" />
            <Field k="development" label="Desarrollo de la sesión" rows={5} placeholder="Descripción de lo trabajado en la sesión..." />
            <Field k="interventions" label="Intervenciones realizadas" rows={4} placeholder="Técnicas, herramientas, estrategias utilizadas..." />
            <Field k="observations" label="Observaciones clínicas" rows={3} placeholder="Observaciones del profesional sobre el proceso..." />
            <Field k="next_steps" label="Próximos pasos" rows={3} placeholder="Tareas, objetivos para la próxima sesión..." />
          </div>
        </div>

        {/* RIGHT: Live preview */}
        <div className="w-1/2 overflow-y-auto bg-slate-50 p-6">
          <div className="mb-3">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Vista previa — Ficha clínica</span>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Preview header */}
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-semibold text-slate-800" style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>
                    {psych?.full_name || 'Nombre del profesional'}
                  </h2>
                  {psych?.license_number && (
                    <p className="text-xs text-slate-400 mt-0.5">Matrícula {psych.license_number}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-600 capitalize">
                    {format(new Date(form.session_date + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                  {selectedPatient && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Preview sections */}
            <div className="px-6 py-5 space-y-4">
              {[
                { label: 'Motivo de consulta', value: form.consultation_reason },
                { label: 'Desarrollo', value: form.development },
                { label: 'Intervenciones', value: form.interventions },
                { label: 'Observaciones', value: form.observations },
                { label: 'Próximos pasos', value: form.next_steps },
              ].map(s => s.value ? (
                <div key={s.label} className="note-preview-section">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{s.label}</p>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{s.value}</p>
                </div>
              ) : null)}

              {!form.consultation_reason && !form.development && !form.interventions && (
                <p className="text-sm text-slate-300 italic text-center py-12">
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
