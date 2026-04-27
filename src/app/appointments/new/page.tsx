'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, X, RefreshCw, Info } from 'lucide-react'

export default function NewAppointmentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [psych, setPsych] = useState<any>(null)
  const [showNewPatient, setShowNewPatient] = useState(false)
  const [savingPatient, setSavingPatient] = useState(false)
  const [newPatient, setNewPatient] = useState({ first_name: '', last_name: '', email: '', phone: '' })
  const [recurring, setRecurring] = useState(false)
  const [recurrenceForm, setRecurrenceForm] = useState({
    frequency: 'weekly',
    end_type: '3months',
  })
  const [form, setForm] = useState({
    patient_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    duration_minutes: '50',
    modality: 'presencial',
    internal_notes: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('psychologists').select('*').eq('user_id', user.id).single()
      setPsych(p)
      const { data: pts } = await supabase.from('patients')
        .select('id, first_name, last_name')
        .eq('psychologist_id', p?.id).eq('is_active', true).order('last_name')
      setPatients(pts || [])
      const params = new URLSearchParams(window.location.search)
      const patientParam = params.get('patient')
      if (patientParam) setForm(f => ({ ...f, patient_id: patientParam }))
    }
    load()
  }, [])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }
  function setNP(k: string, v: string) { setNewPatient(p => ({ ...p, [k]: v })) }

  async function handleCreatePatient() {
    if (!newPatient.first_name || !newPatient.last_name || !newPatient.email) {
      toast.error('Nombre, apellido y email son requeridos')
      return
    }
    setSavingPatient(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: p } = await supabase.from('psychologists').select('id').eq('user_id', user!.id).single()
    const { data, error } = await supabase.from('patients').insert({
      psychologist_id: p?.id,
      first_name: newPatient.first_name.trim(),
      last_name: newPatient.last_name.trim(),
      email: newPatient.email.trim().toLowerCase(),
      phone: newPatient.phone || null,
    }).select().single()
    if (error) { toast.error('Error al crear paciente') }
    else {
      toast.success(`${data.first_name} ${data.last_name} creado`)
      setPatients(prev => [...prev, data].sort((a, b) => a.last_name.localeCompare(b.last_name)))
      setForm(f => ({ ...f, patient_id: data.id }))
      setShowNewPatient(false)
      setNewPatient({ first_name: '', last_name: '', email: '', phone: '' })
    }
    setSavingPatient(false)
  }

  function getEndDate(startDate: Date, endType: string): Date | null {
    const d = new Date(startDate)
    switch (endType) {
      case '1month':  d.setMonth(d.getMonth() + 1); return d
      case '2months': d.setMonth(d.getMonth() + 2); return d
      case '3months': d.setMonth(d.getMonth() + 3); return d
      case '6months': d.setMonth(d.getMonth() + 6); return d
      case 'indefinite': return null
      default: return d
    }
  }

  function generateDates(startDate: Date, frequency: string, endDate: Date | null): Date[] {
    const dates: Date[] = [new Date(startDate)]
    const intervalDays = frequency === 'weekly' ? 7 : 14
    const maxOccurrences = endDate ? 200 : 52
    let current = new Date(startDate)
    for (let i = 1; i < maxOccurrences; i++) {
      current = new Date(current)
      current.setDate(current.getDate() + intervalDays)
      if (endDate && current > endDate) break
      dates.push(new Date(current))
    }
    return dates
  }

  function countOccurrences(): number {
    const startDate = new Date(`${form.date}T${form.time}:00`)
    const endDate = getEndDate(startDate, recurrenceForm.end_type)
    return generateDates(startDate, recurrenceForm.frequency, endDate).length
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.patient_id) { toast.error('Seleccioná un paciente'); return }
    setSaving(true)
    try {
      if (!recurring) {
        const scheduled_at = new Date(`${form.date}T${form.time}:00`).toISOString()
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            scheduled_at,
            duration_minutes: parseInt(form.duration_minutes),
            psychologist_id: psych?.id,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success('Turno creado — el paciente recibirá un recordatorio 24hs antes')
        router.push(`/appointments/${data.appointment.id}`)
      } else {
        const startDate = new Date(`${form.date}T${form.time}:00`)
        const endDate = getEndDate(startDate, recurrenceForm.end_type)
        const dates = generateDates(startDate, recurrenceForm.frequency, endDate)
        const res = await fetch('/api/appointments/recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: form.patient_id,
            duration_minutes: parseInt(form.duration_minutes),
            modality: form.modality,
            internal_notes: form.internal_notes,
            psychologist_id: psych?.id,
            frequency: recurrenceForm.frequency,
            end_date: endDate?.toISOString() || null,
            dates: dates.map(d => d.toISOString()),
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        toast.success(`${dates.length} turnos recurrentes creados — el paciente recibirá recordatorios 24hs antes de cada uno`)
        router.push('/appointments')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al crear turno')
    }
    setSaving(false)
  }

  const endTypeLabel: Record<string, string> = {
    '1month': '1 mes', '2months': '2 meses', '3months': '3 meses',
    '6months': '6 meses', 'indefinite': 'sin fecha de fin',
  }

  return (
    <div className="p-8 animate-fade-in max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/appointments" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl text-slate-800">Nuevo turno</h1>
          <p className="text-sm text-slate-500">Turno individual o recurrente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">

          {/* Paciente */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Paciente *</label>
            <div className="flex gap-2">
              <select value={form.patient_id} onChange={e => set('patient_id', e.target.value)} className="flex-1" required>
                <option value="">— Seleccionar paciente —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowNewPatient(!showNewPatient)}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
                <Plus size={13} /> Nuevo
              </button>
            </div>
          </div>

          {/* Formulario rápido nuevo paciente */}
          {showNewPatient && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-blue-800">Crear paciente nuevo</p>
                <button type="button" onClick={() => setShowNewPatient(false)} className="text-blue-400 hover:text-blue-600">
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Nombre *</label>
                  <input value={newPatient.first_name} onChange={e => setNP('first_name', e.target.value)} placeholder="María" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Apellido *</label>
                  <input value={newPatient.last_name} onChange={e => setNP('last_name', e.target.value)} placeholder="González" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Email *</label>
                  <input type="email" value={newPatient.email} onChange={e => setNP('email', e.target.value)} placeholder="maria@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Teléfono</label>
                  <input value={newPatient.phone} onChange={e => setNP('phone', e.target.value)} placeholder="+54 11..." />
                </div>
              </div>
              <button type="button" onClick={handleCreatePatient} disabled={savingPatient}
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {savingPatient ? 'Creando...' : 'Crear y seleccionar paciente'}
              </button>
            </div>
          )}

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {recurring ? 'Primer turno *' : 'Fecha *'}
              </label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Hora *</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Duración</label>
              <select value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)}>
                <option value="45">45 minutos</option>
                <option value="50">50 minutos</option>
                <option value="60">60 minutos</option>
                <option value="90">90 minutos</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Modalidad</label>
              <select value={form.modality} onChange={e => set('modality', e.target.value)}>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>
          </div>

          {/* Notas internas */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Notas internas</label>
            <textarea value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)}
              placeholder="Solo visibles para vos..." rows={2} />
          </div>
        </div>

        {/* Toggle recurrencia */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setRecurring(!recurring)}
            className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${recurring ? 'bg-violet-50' : 'hover:bg-slate-50'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${recurring ? 'bg-violet-100' : 'bg-slate-100'}`}>
                <RefreshCw size={15} className={recurring ? 'text-violet-600' : 'text-slate-400'} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-semibold ${recurring ? 'text-violet-800' : 'text-slate-700'}`}>
                  Turno recurrente
                </p>
                <p className="text-xs text-slate-400">El paciente viene todas las semanas o quincenas</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${recurring ? 'bg-violet-600' : 'bg-slate-200'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${recurring ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>

          {recurring && (
            <div className="px-5 pb-5 space-y-4 border-t border-violet-100">
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Frecuencia</label>
                  <select value={recurrenceForm.frequency}
                    onChange={e => setRecurrenceForm(f => ({ ...f, frequency: e.target.value }))}>
                    <option value="weekly">Semanal (cada 7 días)</option>
                    <option value="biweekly">Quincenal (cada 14 días)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Duración del tratamiento</label>
                  <select value={recurrenceForm.end_type}
                    onChange={e => setRecurrenceForm(f => ({ ...f, end_type: e.target.value }))}>
                    <option value="1month">1 mes</option>
                    <option value="2months">2 meses</option>
                    <option value="3months">3 meses</option>
                    <option value="6months">6 meses</option>
                    <option value="indefinite">Indefinido</option>
                  </select>
                </div>
              </div>

              <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-3">
                <div className="flex items-start gap-2">
                  <Info size={13} className="text-violet-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-violet-700 space-y-1">
                    <p>
                      Se crearán <strong>{countOccurrences()} turnos</strong> {recurrenceForm.frequency === 'weekly' ? 'semanales' : 'quincenales'}
                      {recurrenceForm.end_type !== 'indefinite'
                        ? ` durante ${endTypeLabel[recurrenceForm.end_type]}`
                        : ' sin fecha de fin'}
                    </p>
                    <p>📧 El paciente recibirá un recordatorio <strong>24hs antes de cada turno</strong> — no todos de una vez.</p>
                    <p>✏️ Podés cancelar un turno individual o toda la recurrencia desde el detalle del turno.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info turno simple */}
        {!recurring && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <Info size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              El paciente recibirá un recordatorio por email <strong>24hs antes del turno</strong> para confirmar o cancelar.
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <Link href="/appointments"
            className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </Link>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Save size={14} />
            {saving
              ? 'Creando...'
              : recurring
                ? `Crear ${countOccurrences()} turnos recurrentes`
                : 'Crear turno'}
          </button>
        </div>
      </form>
    </div>
  )
}