'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft, Save, X } from 'lucide-react'

export default function NewPatientPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    date_of_birth: '', admin_notes: '', tags: [] as string[],
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function addTag() {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }))
    setTagInput('')
  }

  function removeTag(t: string) { setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name || !form.last_name || !form.email) {
      toast.error('Nombre, apellido y email son requeridos')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: psych } = await supabase.from('psychologists').select('id').eq('user_id', user!.id).single()
    const { data, error } = await supabase.from('patients').insert({
      psychologist_id: psych?.id,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone || null,
      date_of_birth: form.date_of_birth || null,
      admin_notes: form.admin_notes || null,
      tags: form.tags,
    }).select().single()

    if (error) { toast.error('Error al guardar: ' + error.message) }
    else { toast.success('Paciente creado'); router.push(`/patients/${data.id}`) }
    setSaving(false)
  }

  return (
    <div className="p-8 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/patients" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl text-slate-800">Nuevo paciente</h1>
          <p className="text-sm text-slate-500">Completá los datos del paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Datos personales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre *</label>
              <input value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="María" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Apellido *</label>
              <input value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="González" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="maria@email.com" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Teléfono</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+54 11 1234-5678" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Fecha de nacimiento</label>
              <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Etiquetas clínicas</h2>
          <div className="flex gap-2 mb-3">
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() }}}
              placeholder="Ej: Ansiedad, TCC, EMDR..." className="flex-1" />
            <button type="button" onClick={addTag}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors whitespace-nowrap">
              Agregar
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map(t => (
                <span key={t} className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                  {t}
                  <button type="button" onClick={() => removeTag(t)}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Notas administrativas</h2>
          <textarea value={form.admin_notes} onChange={e => set('admin_notes', e.target.value)}
            placeholder="Obra social, forma de pago, derivación, etc. (solo visible para vos)"
            rows={3} />
        </div>

        <div className="flex gap-3">
          <Link href="/patients" className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </Link>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Save size={14} /> {saving ? 'Guardando...' : 'Crear paciente'}
          </button>
        </div>
      </form>
    </div>
  )
}
