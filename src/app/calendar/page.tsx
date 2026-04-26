import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarView from '@/components/calendar/CalendarView'

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; year?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: psych } = await supabase.from('psychologists').select('id').eq('user_id', user.id).single()

  const sp = await searchParams
  const now = new Date()
  const month = parseInt(sp.month || String(now.getMonth()))
  const year  = parseInt(sp.year  || String(now.getFullYear()))

  const start = new Date(year, month, 1)
  const end   = new Date(year, month + 1, 0)

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, patient:patients(first_name, last_name)')
    .eq('psychologist_id', psych?.id)
    .gte('scheduled_at', start.toISOString())
    .lte('scheduled_at', end.toISOString())
    .not('status', 'in', '("cancelled_by_patient","cancelled_by_psychologist")')
    .order('scheduled_at')

  return (
    <div className="p-8 animate-fade-in">
      <CalendarView appointments={appointments || []} month={month} year={year} />
    </div>
  )
}
