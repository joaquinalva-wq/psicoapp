import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, User, Calendar, Edit } from 'lucide-react'
import NoteExportButton from '@/components/notes/NoteExportButton'

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: psych } = await supabase.from('psychologists').select('*').eq('user_id', user.id).single()

  const { data: note } = await supabase.from('session_notes')
    .select('*, patient:patients(*)')
    .eq('id', id).eq('psychologist_id', psych?.id).single()
  if (!note) notFound()

  const sections = [
    { label: 'Motivo de consulta', value: note.consultation_reason },
    { label: 'Desarrollo de la sesión', value: note.development },
    { label: 'Intervenciones realizadas', value: note.interventions },
    { label: 'Observaciones clínicas', value: note.observations },
    { label: 'Próximos pasos', value: note.next_steps },
  ].filter(s => s.value)

  return (
    <div className="p-8 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/notes" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <h1 className="text-2xl text-slate-800">Nota de sesión</h1>
        <div className="ml-auto flex gap-2">
          <NoteExportButton note={note} psych={psych} />
          <Link href={`/notes/${id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors">
            <Edit size={12} /> Editar
          </Link>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-5 py-3.5 mb-5 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <User size={13} className="text-slate-400" />
          <Link href={`/patients/${note.patient_id}`} className="font-medium hover:text-blue-600 transition-colors">
            {note.patient?.first_name} {note.patient?.last_name}
          </Link>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-2 text-slate-500">
          <Calendar size={13} className="text-slate-400" />
          <span className="capitalize">{format(new Date(note.session_date + 'T12:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })}</span>
        </div>
      </div>

      {/* Note card - professional ficha */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl text-slate-800" style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>
                {psych?.full_name}
              </h2>
              {psych?.license_number && (
                <p className="text-sm text-slate-400 mt-0.5">Matrícula {psych.license_number}</p>
              )}
              {psych?.address && (
                <p className="text-xs text-slate-400 mt-0.5">{psych.address}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-600 capitalize">
                {format(new Date(note.session_date + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">{note.patient?.first_name} {note.patient?.last_name}</p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="px-8 py-6 space-y-6">
          {sections.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sin contenido registrado</p>
          ) : sections.map(s => (
            <div key={s.label} className="note-preview-section">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{s.label}</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Registrado el {format(new Date(note.created_at), "d 'de' MMMM yyyy 'a las' HH:mm 'hs'", { locale: es })}
          </p>
        </div>
      </div>
    </div>
  )
}
