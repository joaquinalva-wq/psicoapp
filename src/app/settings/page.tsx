'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Save, Upload, X, ExternalLink, Eye, EyeOff } from 'lucide-react'

const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
]

export default function SettingsPage() {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [psychId, setPsychId] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [specialtyInput, setSpecialtyInput] = useState('')
  const [insuranceInput, setInsuranceInput] = useState('')
  const [form, setForm] = useState({
    full_name: '', license_number: '', email: '', phone: '',
    address: '', brand_color: '#2563eb',
    default_duration: '50', reminder_hours: '24',
    is_public: false,
    profession: 'Psicólogo/a',
    bio: '',
    specialties: [] as string[],
    office_name: '',
    office_address: '',
    office_city: '',
    office_province: '',
    consultation_fee: '',
    accepts_insurance: false,
    insurance_list: [] as string[],
    available_days: [1,2,3,4,5] as number[],
    available_from: '09:00',
    available_to: '18:00',
    slot_duration: '50',
    social_instagram: '',
    social_web: '',
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: psych } = await supabase.from('psychologists').select('*').eq('user_id', user.id).single()
      if (psych) {
        setPsychId(psych.id)
        setSlug(psych.slug)
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
          is_public: psych.is_public || false,
          profession: psych.profession || 'Psicólogo/a',
          bio: psych.bio || '',
          specialties: psych.specialties || [],
          office_name: psych.office_name || '',
          office_address: psych.office_address || '',
          office_city: psych.office_city || '',
          office_province: psych.office_province || '',
          consultation_fee: psych.consultation_fee || '',
          accepts_insurance: psych.accepts_insurance || false,
          insurance_list: psych.insurance_list || [],
          available_days: psych.available_days || [1,2,3,4,5],
          available_from: psych.available_from?.slice(0,5) || '09:00',
          available_to: psych.available_to?.slice(0,5) || '18:00',
          slot_duration: String(psych.slot_duration || psych.default_duration || 50),
          social_instagram: psych.social_instagram || '',
          social_web: psych.social_web || '',
        })
      }
    }
    load()
  }, [])

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  function toggleDay(d: number) {
    setForm(f => ({
      ...f,
      available_days: f.available_days.includes(d)
        ? f.available_days.filter(x => x !== d)
        : [...f.available_days, d].sort()
    }))
  }

  function addSpecialty() {
    const t = specialtyInput.trim()
    if (t && !form.specialties.includes(t)) set('specialties', [...form.specialties, t])
    setSpecialtyInput('')
  }

  function addInsurance() {
    const t = insuranceInput.trim()
    if (t && !form.insurance_list.includes(t)) set('insurance_list', [...form.insurance_list, t])
    setInsuranceInput('')
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !psychId) return
    if (file.size > 2 * 1024 * 1024) { toast.error('El logo debe ser menor a 2MB'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${psychId}/logo.${ext}`
    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (error) { toast.error('Error al subir logo'); setUploading(false); return }
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
      is_public: form.is_public,
      profession: form.profession || null,
      bio: form.bio || null,
      specialties: form.specialties,
      office_name: form.office_name || null,
      office_address: form.office_address || null,
      office_city: form.office_city || null,
      office_province: form.office_province || null,
      consultation_fee: form.consultation_fee || null,
      accepts_insurance: form.accepts_insurance,
      insurance_list: form.insurance_list,
      available_days: form.available_days,
      available_from: form.available_from,
      available_to: form.available_to,
      slot_duration: parseInt(form.slot_duration),
      social_instagram: form.social_instagram || null,
      social_web: form.social_web || null,
    }).eq('user_id', user!.id)
    if (error) { toast.error('Error al guardar: ' + error.message) }
    else { toast.success('Configuración guardada') }
    setSaving(false)
  }

  const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="pb-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )

  return (
    <div className="p-8 animate-fade-in max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl text-slate-800">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">Perfil profesional y preferencias del sistema</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        <Section title="Perfil profesional">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre completo *</label>
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Dra. Laura Martínez" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Profesión</label>
              <input value={form.profession} onChange={e => set('profession', e.target.value)} placeholder="Psicóloga, Nutricionista..." />
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
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Dirección del consultorio</label>
              <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Av. Santa Fe 1234, CABA" />
            </div>
          </div>
        </Section>

        <Section title="Logo y marca">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 flex-shrink-0">
              {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-2xl">🖼</span>}
            </div>
            <div className="flex-1">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                <Upload size={14} /> {uploading ? 'Subiendo...' : 'Subir logo'}
              </button>
              <p className="text-xs text-slate-400 mt-1.5">PNG o JPG · máx. 2MB</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Color principal del sistema</label>
            <div className="flex items-center gap-4">
              <input type="color" value={form.brand_color} onChange={e => set('brand_color', e.target.value)}
                style={{ width: '40px', height: '40px', padding: '2px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }} />
              <div className="flex gap-2">
                {['#2563eb','#7c3aed','#059669','#dc2626','#d97706','#0891b2'].map(c => (
                  <button key={c} type="button" onClick={() => set('brand_color', c)}
                    className="w-7 h-7 rounded-full transition-all hover:scale-110"
                    style={{ background: c, outline: form.brand_color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section title="Portal público" subtitle="Configurá tu perfil visible para pacientes que buscan profesionales">

          {/* Toggle público/privado */}
          <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${form.is_public ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-3">
              {form.is_public ? <Eye size={18} className="text-emerald-600" /> : <EyeOff size={18} className="text-slate-400" />}
              <div>
                <p className={`text-sm font-semibold ${form.is_public ? 'text-emerald-800' : 'text-slate-600'}`}>
                  {form.is_public ? 'Perfil público — visible en el portal' : 'Perfil privado — solo gestión interna'}
                </p>
                <p className="text-xs text-slate-400">
                  {form.is_public
                    ? 'Los pacientes pueden encontrarte y reservar turnos online'
                    : 'Solo vos ves tu agenda. Los pacientes no pueden encontrarte'}
                </p>
              </div>
            </div>
            <button type="button" onClick={() => set('is_public', !form.is_public)}
              className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.is_public ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${form.is_public ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {form.is_public && slug && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-800">Tu perfil público</p>
                <p className="text-xs text-blue-600 mt-0.5">psicoapp1.netlify.app/p/{slug}</p>
              </div>
              <a href={`/p/${slug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                <ExternalLink size={12} /> Ver perfil
              </a>
            </div>
          )}

          {form.is_public && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Descripción / Bio</label>
                <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
                  placeholder="Contá quién sos, tu enfoque, experiencia..." rows={3} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Especialidades</label>
                <div className="flex gap-2 mb-2">
                  <input value={specialtyInput} onChange={e => setSpecialtyInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSpecialty() }}}
                    placeholder="Ej: Ansiedad, TCC, Infanto-juvenil..." className="flex-1" />
                  <button type="button" onClick={addSpecialty}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 whitespace-nowrap">
                    + Agregar
                  </button>
                </div>
                {form.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.specialties.map(s => (
                      <span key={s} className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                        {s}
                        <button type="button" onClick={() => set('specialties', form.specialties.filter(x => x !== s))}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre del centro / consultorio</label>
                  <input value={form.office_name} onChange={e => set('office_name', e.target.value)} placeholder="Centro de Salud Mental" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Dirección pública</label>
                  <input value={form.office_address} onChange={e => set('office_address', e.target.value)} placeholder="Av. Córdoba 1234, Piso 2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Ciudad</label>
                  <input value={form.office_city} onChange={e => set('office_city', e.target.value)} placeholder="Buenos Aires" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Provincia</label>
                  <input value={form.office_province} onChange={e => set('office_province', e.target.value)} placeholder="CABA" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Honorarios</label>
                  <input value={form.consultation_fee} onChange={e => set('consultation_fee', e.target.value)} placeholder="$15.000 · Consultar" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Duración de turnos</label>
                  <select value={form.slot_duration} onChange={e => set('slot_duration', e.target.value)}>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="50">50 minutos</option>
                    <option value="60">60 minutos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Días de atención</label>
                <div className="flex gap-2">
                  {DAYS.map(d => (
                    <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        form.available_days.includes(d.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Horario desde</label>
                  <input type="time" value={form.available_from} onChange={e => set('available_from', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Horario hasta</label>
                  <input type="time" value={form.available_to} onChange={e => set('available_to', e.target.value)} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-600">Obras sociales / Prepaga</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{form.accepts_insurance ? 'Acepta' : 'No acepta'}</span>
                    <button type="button" onClick={() => set('accepts_insurance', !form.accepts_insurance)}
                      className={`w-8 h-4 rounded-full transition-colors relative ${form.accepts_insurance ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${form.accepts_insurance ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
                {form.accepts_insurance && (
                  <>
                    <div className="flex gap-2 mb-2">
                      <input value={insuranceInput} onChange={e => setInsuranceInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInsurance() }}}
                        placeholder="OSDE, Swiss Medical, PAMI..." className="flex-1" />
                      <button type="button" onClick={addInsurance}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 whitespace-nowrap">
                        + Agregar
                      </button>
                    </div>
                    {form.insurance_list.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.insurance_list.map(s => (
                          <span key={s} className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                            {s}
                            <button type="button" onClick={() => set('insurance_list', form.insurance_list.filter(x => x !== s))}>
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Instagram</label>
                  <input value={form.social_instagram} onChange={e => set('social_instagram', e.target.value)} placeholder="@tu_usuario" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Sitio web</label>
                  <input value={form.social_web} onChange={e => set('social_web', e.target.value)} placeholder="https://tuweb.com" />
                </div>
              </div>
            </>
          )}
        </Section>

        <Section title="Preferencias de turnos">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Duración predeterminada</label>
              <select value={form.default_duration} onChange={e => set('default_duration', e.target.value)}>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="50">50 minutos</option>
                <option value="60">60 minutos</option>
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
        </Section>

        <div className="flex gap-3 pb-4">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Save size={14} /> {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {form.is_public && slug && (
            <a href={`/p/${slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <ExternalLink size={14} /> Ver mi perfil público
            </a>
          )}
        </div>
      </form>
    </div>
  )
}