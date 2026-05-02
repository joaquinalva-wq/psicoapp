'use client'
import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EPSIBookingWidget({ prof }: { prof: any }) {
  const [step, setStep] = useState<'date' | 'time' | 'form' | 'success'>('date')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)
  const [patientForm, setPatientForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', reason: ''
  })

  const today = new Date()
  const weekStart = addDays(today, weekOffset * 7)
  const availableDays: number[] = prof.available_days || [1,2,3,4,5]
  const slotDuration = prof.slot_duration || prof.default_duration || 50
  const fromHour = parseInt(prof.available_from?.split(':')[0] || '9')
  const toHour = parseInt(prof.available_to?.split(':')[0] || '18')
  const brandColor = prof.brand_color || '#2d5016'

  const weekDays = Array.from({ length: 14 }, (_, i) => addDays(weekStart, i))
    .filter(d => availableDays.includes(d.getDay()) && d >= today)
    .slice(0, 6)

  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    fetch(`/api/public/availability?psychologist_id=${prof.id}&date=${dateStr}`)
      .then(r => r.json())
      .then(data => setBookedSlots(data.booked || []))
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, prof.id])

  function generateSlots(): string[] {
    const slots: string[] = []
    for (let h = fromHour; h < toHour; h++) {
      for (let m = 0; m < 60; m += slotDuration) {
        if (h * 60 + m + slotDuration > toHour * 60) break
        slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
      }
    }
    return slots
  }

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !selectedSlot) return
    if (!patientForm.first_name || !patientForm.last_name || !patientForm.email) {
      toast.error('Completá nombre, apellido y email')
      return
    }
    setSubmitting(true)
    try {
      const scheduled_at = new Date(
        `${format(selectedDate, 'yyyy-MM-dd')}T${selectedSlot}:00`
      ).toISOString()
      const res = await fetch('/api/public/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychologist_id: prof.id,
          scheduled_at,
          duration_minutes: slotDuration,
          ...patientForm,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStep('success')
    } catch (err: any) {
      toast.error(err.message || 'Error al reservar. Intentá nuevamente.')
    }
    setSubmitting(false)
  }

  function resetWidget() {
    setStep('date')
    setSelectedDate(null)
    setSelectedSlot(null)
    setPatientForm({ first_name:'', last_name:'', email:'', phone:'', reason:'' })
  }

  // SUCCESS
  if (step === 'success') {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={24} className="text-emerald-500" />
        </div>
        <p className="text-sm font-semibold text-slate-800 mb-1">¡Turno solicitado!</p>
        <p className="text-xs text-slate-500 mb-1">
          {selectedDate && format(selectedDate, "d 'de' MMMM", { locale: es })} · {selectedSlot} hs
        </p>
        <p className="text-xs text-slate-400 mb-5">
          Confirmación a <strong>{patientForm.email}</strong>
        </p>
        <button onClick={resetWidget} className="text-xs font-medium hover:underline"
          style={{ color: brandColor }}>
          Solicitar otro turno
        </button>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Reservar turno · {slotDuration} min
      </p>

      {/* Progress bar */}
      <div className="flex gap-1 mb-4">
        {['Fecha','Horario','Datos'].map((label, i) => {
          const current = ['date','time','form'].indexOf(step)
          return (
            <div key={label} className="flex-1 h-1 rounded-full transition-colors"
              style={{
                background: i <= current ? brandColor : '#e2e8f0'
              }} />
          )
        })}
      </div>

      {/* PASO 1: FECHA */}
      {step === 'date' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500 font-medium">Elegí un día</p>
            <div className="flex gap-1">
              <button type="button"
                onClick={() => setWeekOffset(w => Math.max(0, w-1))}
                disabled={weekOffset === 0}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors">
                <ChevronLeft size={13} />
              </button>
              <button type="button"
                onClick={() => setWeekOffset(w => w+1)}
                className="p-1 rounded hover:bg-slate-100 transition-colors">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
          {weekDays.length === 0
            ? <p className="text-xs text-slate-400 text-center py-6">Sin días disponibles</p>
            : (
              <div className="grid grid-cols-3 gap-1.5">
                {weekDays.map(d => (
                  <button key={d.toISOString()} type="button"
                    onClick={() => { setSelectedDate(d); setStep('time') }}
                    className="flex flex-col items-center py-2.5 rounded-xl border border-slate-200 text-center transition-all hover:text-white hover:border-transparent"
                    onMouseEnter={e => {
                      const el = e.currentTarget
                      el.style.background = brandColor
                      el.style.borderColor = brandColor
                      el.style.color = 'white'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget
                      el.style.background = ''
                      el.style.borderColor = '#e2e8f0'
                      el.style.color = ''
                    }}>
                    <span className="text-[9px] uppercase opacity-60 capitalize">
                      {format(d, 'EEE', { locale: es })}
                    </span>
                    <span className="text-base font-light">{format(d, 'd')}</span>
                    <span className="text-[9px] opacity-60 capitalize">
                      {format(d, 'MMM', { locale: es })}
                    </span>
                  </button>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* PASO 2: HORARIO */}
      {step === 'time' && selectedDate && (
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <button type="button" onClick={() => setStep('date')}
              className="p-1 rounded hover:bg-slate-100 transition-colors">
              <ChevronLeft size={15} className="text-slate-500" />
            </button>
            <p className="text-xs font-medium text-slate-700 capitalize">
              {format(selectedDate, "EEE d 'de' MMMM", { locale: es })}
            </p>
          </div>
          {loadingSlots
            ? <div className="flex justify-center py-8">
                <Loader2 size={18} className="animate-spin text-slate-300" />
              </div>
            : (
              <div className="grid grid-cols-3 gap-1.5">
                {generateSlots().map(slot => {
                  const isBooked = bookedSlots.includes(slot)
                  return (
                    <button key={slot} type="button"
                      disabled={isBooked}
                      onClick={() => { setSelectedSlot(slot); setStep('form') }}
                      className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                        isBooked
                          ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed line-through'
                          : 'border-slate-200 hover:text-white hover:border-transparent'
                      }`}
                      onMouseEnter={e => {
                        if (!isBooked) {
                          const el = e.currentTarget
                          el.style.background = brandColor
                          el.style.borderColor = brandColor
                          el.style.color = 'white'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isBooked) {
                          const el = e.currentTarget
                          el.style.background = ''
                          el.style.borderColor = '#e2e8f0'
                          el.style.color = ''
                        }
                      }}>
                      {slot}
                    </button>
                  )
                })}
              </div>
            )
          }
        </div>
      )}

      {/* PASO 3: DATOS */}
      {step === 'form' && (
        <form onSubmit={handleBook} className="space-y-2.5">
          <div className="flex items-center gap-1.5 mb-3">
            <button type="button" onClick={() => setStep('time')}
              className="p-1 rounded hover:bg-slate-100 transition-colors">
              <ChevronLeft size={15} className="text-slate-500" />
            </button>
            <div>
              <p className="text-xs font-semibold text-slate-700 capitalize">
                {selectedDate && format(selectedDate, "d 'de' MMMM", { locale: es })} · {selectedSlot} hs
              </p>
              <p className="text-[10px] text-slate-400">{prof.full_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">Nombre *</label>
              <input value={patientForm.first_name}
                onChange={e => setPatientForm(f => ({ ...f, first_name: e.target.value }))}
                placeholder="María" required className="text-xs py-2" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">Apellido *</label>
              <input value={patientForm.last_name}
                onChange={e => setPatientForm(f => ({ ...f, last_name: e.target.value }))}
                placeholder="González" required className="text-xs py-2" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1">Email *</label>
            <input type="email" value={patientForm.email}
              onChange={e => setPatientForm(f => ({ ...f, email: e.target.value }))}
              placeholder="tu@email.com" required className="text-xs py-2" />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1">Teléfono</label>
            <input value={patientForm.phone}
              onChange={e => setPatientForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+54 2477 123456" className="text-xs py-2" />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1">
              Motivo de consulta (opcional)
            </label>
            <textarea value={patientForm.reason}
              onChange={e => setPatientForm(f => ({ ...f, reason: e.target.value }))}
              rows={2} placeholder="Breve descripción..."
              style={{
                width: '100%', padding: '6px 10px',
                border: '1px solid #e2e8f0', borderRadius: '6px',
                fontSize: '12px', fontFamily: 'inherit',
                resize: 'none', outline: 'none'
              }} />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: brandColor }}>
            {submitting ? 'Enviando solicitud...' : 'Confirmar solicitud de turno'}
          </button>

          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            Recibirás confirmación por{' '}
            {prof.contact_method === 'whatsapp' ? 'WhatsApp'
              : prof.contact_method === 'both' ? 'email y WhatsApp'
              : 'email'}
          </p>
        </form>
      )}
    </div>
  )
}