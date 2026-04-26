import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, FileText } from 'lucide-react'
import Empty from '@/components/ui/Empty'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: psych } = await supabase.from('psychologists').select('id').eq('user_id', user.id).single()

  const { data: notes } = await supabase.from('session_notes')
    .select('*, patient:patients(first_name, last_name)')
    .eq('psychologist_id', psych?.id)
    .order('session_date', { ascending: false })

  const COLORS = ['bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-violet-100 text-violet-700','bg-amber-100 text-amber-700','bg-rose-100 text-rose-700']

  return (
    <div className="p-8 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-slate-800">Notas de sesión</h1>
          <p className="text-sm text-slate-500 mt-0.5">{notes?.length || 0} notas registradas</p>
        </div>
        <Link href="/notes/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Nueva nota
        </Link>
      </div>

      {!notes?.length ? (
        <div className="bg-white border border-slate-200 rounded-xl">
          <Empty icon={<FileText size={36} />} title="Sin notas registradas" description="Las notas de sesión te permiten documentar el trabajo clínico."
            action={<Link href="/notes/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Nueva nota</Link>} />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {notes.map((note: any, i: number) => {
            const colorClass = COLORS[i % COLORS.length]
            const initials = (note.patient?.first_name?.[0] || '') + (note.patient?.last_name?.[0] || '')
            return (
              <Link key={note.id} href={`/notes/${note.id}`}
                className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${colorClass}`}>
                  {initials.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                      {note.patient?.first_name} {note.patient?.last_name}
                    </p>
                    <span className="text-xs text-slate-400">
                      {format(new Date(note.session_date + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 truncate">
                    {note.consultation_reason || 'Sin motivo registrado'}
                  </p>
                  {note.next_steps && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      → {note.next_steps}
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0 group-hover:text-blue-500 transition-colors">Ver →</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
