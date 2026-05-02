'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function EditPatientPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    date_of_birth: '', occupation: '', marital_status: '',
    initial_reason: '', diagnosis: '', clinical_notes: '',
    insurance_name: '', insurance_number: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    referred_by: '', admin_notes: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: psych } = await supabase.from('psychologists').select('id').eq('user_id', user.id).single()
      const { data } = await supabase.from('patients').select('*').eq('id', id).eq('psychologist_id', psych?.id).single()
      if (data) setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        date_of_birth: data.date_of_birth || '',
        occupation: data.occupation || '',
        marital_status: data.marital_status || '',
        initial_reason: data.initial_reason || '',
        diagnosis: data.diagnosis || '',
        clinical_notes: data.clinical_notes || '',
        insurance_name: data.insurance_name || '',
        insurance_number: data.insurance_number || '',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        referred_by: data.referred_by || '',
        admin_notes: data.admin_notes || '',
      })
    }
    load()
  }, [id])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('patients').update(form).eq('id', id)
    if (error) toast.error('Error al guardar')
    else {
      toast.success('Paciente actualizado')
      router.push(`/patients/${id}`)
    }
    setSaving(false)
  }

  const Section = ({ title }: { title: string }) => (
    <div style={{ gridColumn: '1 / -1', paddingTop: 8, marginTop: 4, borderTop: '1px solid var(--border)' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {title}
      </p>
    </div>
  )

  const Field = ({ label, k, type = 'text', placeholder = '', as = 'input' }: { label: string; k: string; type?: string; placeholder?: string; as?: string }) => (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
        {label}
      </label>
      {as === 'textarea' ? (
        <textarea
          value={(form as any)[k]}
          onChange={e => set(k, e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      ) : as === 'select' ? (
        <select value={(form as any)[k]} onChange={e => set(k, e.target.value)}>
          <option value="">— Seleccionar —</option>
          <option value="soltero/a">Soltero/a</option>
          <option value="casado/a">Casado/a</option>
          <option value="divorciado/a">Divorciado/a</option>
          <option value="viudo/a">Viudo/a</option>
          <option value="en pareja">En pareja</option>
          <option value="separado/a">Separado/a</option>
        </select>
      ) : (
        <input
          type={type}
          value={(form as any)[k]}
          onChange={e => set(k, e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  )

  return (
    <div className="p-8 animate-fade-in" style={{ maxWidth: 760 }}>
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/patients/${id}`}
          style={{ padding: 8, borderRadius: 8, color: 'var(--text-tertiary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={18} />
        </Link>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Editar paciente</h1>
          <p className="page-subtitle">Historia clínica completa</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          <Save size={14} /> {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          <Section title="Datos personales" />
          <Field label="Nombre *" k="first_name" placeholder="María" />
          <Field label="Apellido *" k="last_name" placeholder="González" />
          <Field label="Email *" k="email" type="email" placeholder="maria@email.com" />
          <Field label="Teléfono" k="phone" placeholder="+54 9 11..." />
          <Field label="Fecha de nacimiento" k="date_of_birth" type="date" />
          <Field label="Ocupación" k="occupation" placeholder="Docente, contador/a..." />
          <Field label="Estado civil" k="marital_status" as="select" />
          <Field label="Derivado por" k="referred_by" placeholder="Médico, familiar, búsqueda propia..." />

          <Section title="Datos clínicos" />
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Motivo de consulta inicial" k="initial_reason" as="textarea"
              placeholder="¿Por qué motivo comenzó el tratamiento?" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Diagnóstico" k="diagnosis" as="textarea"
              placeholder="Diagnóstico clínico, CIE-10, DSM-5..." />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Notas clínicas generales" k="clinical_notes" as="textarea"
              placeholder="Observaciones generales del proceso terapéutico..." />
          </div>

          <Section title="Cobertura médica" />
          <Field label="Obra social / prepaga" k="insurance_name" placeholder="OSDE, Swiss Medical..." />
          <Field label="Número de afiliado" k="insurance_number" placeholder="000-000000" />

          <Section title="Contacto de emergencia" />
          <Field label="Nombre y apellido" k="emergency_contact_name" placeholder="Juan González" />
          <Field label="Teléfono de emergencia" k="emergency_contact_phone" placeholder="+54 9 11..." />

          <Section title="Notas administrativas" />
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Notas internas (no clínicas)" k="admin_notes" as="textarea"
              placeholder="Información de facturación, preferencias de contacto, etc." />
          </div>

        </div>
      </div>
    </div>
  )
}