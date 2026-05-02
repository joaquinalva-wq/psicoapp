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
    date_of_birth: '', occupation: '', marital_status: '',
    initial_reason: '', diagnosis: '', clinical_notes: '',
    insurance_name: '', insurance_number: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    referred_by: '', admin_notes: '',
    tags: [] as string[],
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function addTag() {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }))
    setTagInput('')
  }

  function removeTag(t: string) {
    setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name || !form.last_name || !form.email) {
      toast.error('Nombre, apellido y email son requeridos')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: psych } = await supabase
      .from('psychologists').select('id').eq('user_id', user!.id).single()

    const { data, error } = await supabase.from('patients').insert({
      psychologist_id: psych?.id,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone || null,
      date_of_birth: form.date_of_birth || null,
      occupation: form.occupation || null,
      marital_status: form.marital_status || null,
      initial_reason: form.initial_reason || null,
      diagnosis: form.diagnosis || null,
      clinical_notes: form.clinical_notes || null,
      insurance_name: form.insurance_name || null,
      insurance_number: form.insurance_number || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      referred_by: form.referred_by || null,
      admin_notes: form.admin_notes || null,
      tags: form.tags,
    }).select().single()

    if (error) { toast.error('Error al guardar: ' + error.message) }
    else { toast.success('Paciente creado'); router.push(`/patients/${data.id}`) }
    setSaving(false)
  }

  const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div style={{ gridColumn: '1 / -1', paddingBottom: 4 }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>{subtitle}</p>}
    </div>
  )

  return (
    <div className="p-8 animate-fade-in" style={{ maxWidth: 780 }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/patients"
          style={{ padding: 8, borderRadius: 8, color: 'var(--text-tertiary)', textDecoration: 'none', display: 'flex' }}>
          <ArrowLeft size={18} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Nuevo paciente</h1>
          <p className="page-subtitle">Completá los datos para crear la historia clínica</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Datos personales */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <SectionTitle title="Datos personales" />

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Nombre *
                </label>
                <input
                  value={form.first_name}
                  onChange={e => set('first_name', e.target.value)}
                  placeholder="María" required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Apellido *
                </label>
                <input
                  value={form.last_name}
                  onChange={e => set('last_name', e.target.value)}
                  placeholder="González" required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="maria@email.com" required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Teléfono
                </label>
                <input
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={e => set('date_of_birth', e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Ocupación
                </label>
                <input
                  value={form.occupation}
                  onChange={e => set('occupation', e.target.value)}
                  placeholder="Docente, contador/a, estudiante..."
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Estado civil
                </label>
                <select value={form.marital_status} onChange={e => set('marital_status', e.target.value)}>
                  <option value="">— Seleccionar —</option>
                  <option value="soltero/a">Soltero/a</option>
                  <option value="casado/a">Casado/a</option>
                  <option value="divorciado/a">Divorciado/a</option>
                  <option value="viudo/a">Viudo/a</option>
                  <option value="en pareja">En pareja</option>
                  <option value="separado/a">Separado/a</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Derivado por
                </label>
                <input
                  value={form.referred_by}
                  onChange={e => set('referred_by', e.target.value)}
                  placeholder="Médico clínico, familiar, búsqueda propia..."
                />
              </div>
            </div>
          </div>

          {/* Datos clínicos */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <SectionTitle
                title="Datos clínicos"
                subtitle="Esta información es confidencial y solo visible para vos"
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Motivo de consulta inicial
                </label>
                <textarea
                  value={form.initial_reason}
                  onChange={e => set('initial_reason', e.target.value)}
                  placeholder="¿Por qué motivo el paciente inicia el tratamiento?"
                  rows={3}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Diagnóstico
                </label>
                <textarea
                  value={form.diagnosis}
                  onChange={e => set('diagnosis', e.target.value)}
                  placeholder="Diagnóstico clínico, CIE-10, DSM-5..."
                  rows={2}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Notas clínicas generales
                </label>
                <textarea
                  value={form.clinical_notes}
                  onChange={e => set('clinical_notes', e.target.value)}
                  placeholder="Observaciones generales del proceso terapéutico..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Etiquetas */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                Etiquetas clínicas
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
                Para clasificar y filtrar pacientes
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Ej: Ansiedad, TCC, EMDR, Duelo..."
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={addTag}
                className="btn-secondary"
                style={{ whiteSpace: 'nowrap', padding: '9px 16px' }}
              >
                Agregar
              </button>
            </div>
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {form.tags.map(t => (
                  <span key={t} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 12, padding: '4px 10px', borderRadius: 99,
                    background: '#f0f4ec', color: '#2d5016', fontWeight: 500,
                  }}>
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#2d5016', opacity: 0.6 }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Cobertura médica */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <SectionTitle title="Cobertura médica" />
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Obra social / prepaga
                </label>
                <input
                  value={form.insurance_name}
                  onChange={e => set('insurance_name', e.target.value)}
                  placeholder="OSDE, Swiss Medical, IOMA..."
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Número de afiliado
                </label>
                <input
                  value={form.insurance_number}
                  onChange={e => set('insurance_number', e.target.value)}
                  placeholder="000-000000"
                />
              </div>
            </div>
          </div>

          {/* Contacto de emergencia */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <SectionTitle
                title="Contacto de emergencia"
                subtitle="Persona a contactar en caso de emergencia"
              />
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Nombre y apellido
                </label>
                <input
                  value={form.emergency_contact_name}
                  onChange={e => set('emergency_contact_name', e.target.value)}
                  placeholder="Juan González"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Teléfono
                </label>
                <input
                  value={form.emergency_contact_phone}
                  onChange={e => set('emergency_contact_phone', e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                />
              </div>
            </div>
          </div>

          {/* Notas administrativas */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                Notas administrativas
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
                Información no clínica: facturación, forma de pago, preferencias
              </p>
            </div>
            <textarea
              value={form.admin_notes}
              onChange={e => set('admin_notes', e.target.value)}
              placeholder="Solo visible para vos, no forma parte de la historia clínica..."
              rows={3}
            />
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingBottom: 8 }}>
            <Link href="/patients" className="btn-secondary">
              Cancelar
            </Link>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={14} />
              {saving ? 'Guardando...' : 'Crear paciente'}
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}