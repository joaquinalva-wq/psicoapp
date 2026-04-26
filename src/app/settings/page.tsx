'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Save, Upload, X } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    full_name: '', license_number: '', email: '', phone: '',
    address: '', brand_color: '#2563eb',
    default_duration: '50', reminder_hours: '24',
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [psychId, setPsychId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: psych } = await supabase.from('psychologists').select('*').eq('user_id', user.id).single()
      if (psych) {
        setPsychId(psych.id)
        setLogoUrl(psych.logo_url)
        setForm({
          full_name: psych.full_name || '',
          license_number: psych.license_number || '',
          email: psych.email || '',
          phone: psych.phone || '',
          address: psych.address || '',
          brand_color: psych.brand_color || '#2563eb',
          default_duration: String(psych.default_duration || 50),
          reminder_hours: String(psych.reminder_hours || 24),
        })
      }
    }
    load()
  }, [])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !psychId) return
    if (file.size > 2 * 1024 * 1024) { toast.error('El logo debe ser menor a 2MB'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${psychId}/logo.${ext}`
    const { error: uploadError } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (uploadError) { toast.error('Error al subir logo'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
    await supabase.from('psychologists').update({ logo_url: publicUrl }).eq('id', psychId)
    setLogoUrl(publicUrl + '?t=' + Date.now())
    toast.success('Logo actualizado')
    setUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name) { toast.error('El nombre es requerido'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('psychologists').update({
      full_name: form.full_name.trim(),
      license_number: form.license_number || null,
      email: form.email,
      phone: form.phone || null,
      address: form.address || null,
      brand_color: form.brand_color,
      default_duration: parseInt(form.default_duration),
      reminder_hours: parseInt(form.reminder_hours),
    }).eq('user_id', user!.id)
    if (error) { toast.error('Error al guardar') }
    else { toast.success('Configuración guardada') }
    setSaving(false)
  }

  const section = (title: string, children: React.ReactNode) => (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <h2 className="text-sm font-semibold text-slate-700 pb-3 border-b border-slate-100">{title}</h2>
      {children}
    </div>
  )

  return (
    <div className="p-8 animate-fade-in max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl text-slate-800">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">Personalizá tu perfil profesional y preferencias</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {section('Perfil profesional', <>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre completo *</label>
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Dra. Laura Martínez" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Matrícula profesional</label>
              <input value={form.license_number} onChange={e => set('license_number', e.target.value)} placeholder="MP 12345" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Teléfono</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+54 11 4567-8901" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Dirección del consultorio</label>
              <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Av. Santa Fe 1234, CABA" />
            </div>
          </div>
        </>)}

        {section('Logo y marca', <>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 flex-shrink-0">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                : <span className="text-2xl text-slate-300">🖼</span>
              }
            </div>
            <div className="flex-1">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                <Upload size={14} /> {uploading ? 'Subiendo...' : 'Subir logo'}
              </button>
              <p className="text-xs text-slate-400 mt-1.5">PNG o JPG · máx. 2MB · Aparece en las notas de sesión</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Color principal del sistema</label>
            <div className="flex items-center gap-4">
              <input type="color" value={form.brand_color} onChange={e => set('brand_color', e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 p-1 cursor-pointer" style={{ width: '40px', padding: '2px' }} />
              <div className="flex gap-2">
                {['#2563eb','#7c3aed','#059669','#dc2626','#d97706','#0891b2'].map(c => (
                  <button key={c} type="button" onClick={() => set('brand_color', c)}
                    className="w-7 h-7 rounded-full transition-all hover:scale-110"
                    style={{ background: c, outline: form.brand_color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />
                ))}
              </div>
            </div>
          </div>
        </>)}

        {section('Preferencias de turnos', <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Duración predeterminada</label>
              <select value={form.default_duration} onChange={e => set('default_duration', e.target.value)}>
                <option value="45">45 minutos</option>
                <option value="50">50 minutos</option>
                <option value="60">60 minutos</option>
                <option value="90">90 minutos</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Recordatorio automático</label>
              <select value={form.reminder_hours} onChange={e => set('reminder_hours', e.target.value)}>
                <option value="24">24 horas antes</option>
                <option value="48">48 horas antes</option>
                <option value="0">No enviar</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            El recordatorio se envía automáticamente por email al paciente. Podés cambiarlo en cualquier momento.
          </p>
        </>)}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Save size={14} /> {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
