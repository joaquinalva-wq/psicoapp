export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const psychologist_id = req.nextUrl.searchParams.get('psychologist_id')
  const date = req.nextUrl.searchParams.get('date')

  if (!psychologist_id || !date) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: appointments } = await supabase
    .from('appointments')
    .select('scheduled_at')
    .eq('psychologist_id', psychologist_id)
    .gte('scheduled_at', `${date}T00:00:00`)
    .lte('scheduled_at', `${date}T23:59:59`)
    .not('status', 'in', '("cancelled_by_patient","cancelled_by_psychologist")')

  const booked = (appointments || []).map((apt: any) => {
    const d = new Date(apt.scheduled_at)
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  })

  return NextResponse.json({ booked, date })
}