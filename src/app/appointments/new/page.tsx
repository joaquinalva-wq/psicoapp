'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft, Save, Mail, Plus, X } from 'lucide-react'

export default function NewAppointmentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [psych, setPsych] = useState<any>(null)
  const [showNewPatient, setShowNewPatient] = useState(false)
  const [savingPatient, setSavingPatient] = useState(false)
  const [newPatient, setNewPatient] = useState({
    first_name: '', last_name: '', email: '', phone: ''
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
      const { data: pts } = await supabase.from('patients').select('id, first_name, last_name')
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
    if (error) {
      toast.error('Error al crear paciente')
    } else {
      toast.success(`${data.first_name} ${data.last_name} creado`)
      setPatients(prev => [...prev, data].sort((a, b) => a.last_name.localeCompare(b.last_name)))
      setForm(f => ({ ...f, patient_id: data.id }))
      setShowNewPatient(false)
      setNewPatient({ first_name: '', last_name: '', email: '', phone: '' })
    }
    setSavingPatient(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.patient_id) { toast.error('Seleccioná un paciente'); return }
    setSaving(true)
    try {
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
      toast.success('Turno creado y email enviado al paciente')
      router.push(`/appointments/${data.appointment.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Error al crear turno')
    }
    setSaving(false)
  }

  return (
    <div className="p-8 animate-fade-in max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/appointments" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl text-slate-800">Nuevo turno</h1>
          <p className="text-sm text-slate-500">Se enviará un email automático al paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">

          {/* Selector de paciente */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Paciente *</label>
            <div className="flex gap-2">
              <select
                value={form.patient_id}
                onChange={e => set('patient_id', e.target.value)}
                className="flex-1"
                required
              >
                <option value="">— Seleccionar paciente —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewPatient(!showNewPatient)}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <Plus size={13} /> Nuevo paciente
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
              <button
                type="button"
                onClick={handleCreatePatient}
                disabled={savingPatient}
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {savingPatient ? 'Creando...' : 'Crear y seleccionar paciente'}
              </button>
            </div>
          )}

          {/* Fecha, hora, duración, modalidad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Fecha *</label>
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
            <textarea
              value={form.internal_notes}
              onChange={e => set('internal_notes', e.target.value)}
              placeholder="Solo visibles para vos..."
              rows={3}
            />
          </div>
        </div>

        {/* Info email */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
          <Mail size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Al crear el turno se enviará automáticamente un email al paciente para que confirme o cancele.
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <Link href="/appointments"
            className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </Link>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Save size={14} /> {saving ? 'Creando...' : 'Crear turno'}
          </button>
        </div>
      </form>
    </div>
  )
}