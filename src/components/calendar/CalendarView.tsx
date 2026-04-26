'use client'
import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Appointment, CALENDAR_EVENT_COLORS } from '@/types'
import Link from 'next/link'

const STATUS_TEXT: Record<string, string> = {
  pending_confirmation: '#475569',
  confirmed: '#065f46',
  pending_reconfirmation: '#78350f',
  reconfirmed: '#1e3a8a',
  completed: '#4c1d95',
}

export default function CalendarView({ appointments, month, year }: {
  appointments: Appointment[]
  month: number
  year: number
}) {
  const router = useRouter()
  const currentDate = new Date(year, month, 1)

  function navigate(delta: number) {
    const d = new Date(year, month + delta, 1)
    router.push(`/calendar?month=${d.getMonth()}&year=${d.getFullYear()}`)
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd   = endOfMonth(currentDate)
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 })

  const weeks: Date[][] = []
  let day = calStart
  while (day <= calEnd) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) { week.push(day); day = addDays(day, 1) }
    weeks.push(week)
  }

  const getDayApts = (d: Date) =>
    appointments.filter(a => isSameDay(new Date(a.scheduled_at), d))

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-slate-800 capitalize">
            {format(currentDate, "MMMM yyyy", { locale: es })}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{appointments.length} turnos este mes</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/appointments/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus size={14} /> Nuevo turno
          </Link>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => navigate(-1)} className="px-3 py-2 hover:bg-slate-50 transition-colors border-r border-slate-200">
              <ChevronLeft size={16} className="text-slate-600" />
            </button>
            <button onClick={() => router.push(`/calendar?month=${new Date().getMonth()}&year=${new Date().getFullYear()}`)}
              className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors border-r border-slate-200">
              Hoy
            </button>
            <button onClick={() => navigate(1)} className="px-3 py-2 hover:bg-slate-50 transition-colors">
              <ChevronRight size={16} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 flex-wrap">
        {[
          { label: 'Confirmado',     color: '#10b981' },
          { label: 'Sin reconfirmar', color: '#f59e0b' },
          { label: 'Reconfirmado',   color: '#3b82f6' },
          { label: 'Pendiente',      color: '#94a3b8' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-slate-100 last:border-0">
            {week.map((d, di) => {
              const dayApts = getDayApts(d)
              const inMonth = isSameMonth(d, currentDate)
              const today   = isToday(d)
              return (
                <div key={di}
                  className={`min-h-[90px] p-2 border-r border-slate-100 last:border-0 ${!inMonth ? 'bg-slate-50/60' : ''}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium ${
                      today ? 'bg-blue-600 text-white' : inMonth ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      {format(d, 'd')}
                    </span>
                    {inMonth && dayApts.length > 0 && (
                      <span className="text-[10px] text-slate-400">{dayApts.length}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayApts.slice(0, 3).map((apt) => (
                      <Link key={apt.id} href={`/appointments/${apt.id}`}
                        className="cal-event-block hover:opacity-80 transition-opacity"
                        style={{
                          background: CALENDAR_EVENT_COLORS[apt.status] + '22',
                          color: STATUS_TEXT[apt.status] || '#334155',
                          borderLeft: `2px solid ${CALENDAR_EVENT_COLORS[apt.status]}`,
                        }}>
                        {format(new Date(apt.scheduled_at), 'HH:mm')} {(apt as any).patient?.first_name}
                      </Link>
                    ))}
                    {dayApts.length > 3 && (
                      <div className="text-[10px] text-slate-400 pl-1">+{dayApts.length - 3} más</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
