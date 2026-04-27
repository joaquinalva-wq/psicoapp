'use client'
import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BookingSection({ prof }: { prof: any }) {
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

  const allSlots = generateSlots()

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !selectedSlot) return
    if (!patientForm.first_name || !patientForm.last_name || !patientForm.email) {
      toast.error('Completá los datos requeridos')
      return
    }
    setSubmitting(true)
    try {
      const scheduled_at = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedSlot}:00`).toISOString()
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

  if (step === 'success') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">¡Turno solicitado!</h3>
        <p className="text-sm text-slate-500 mb-1">
          {selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })} a las {selectedSlot} hs
        </p>
        <p className="text-xs text-slate-400 mb-5">
          Te enviaremos un email de confirmación a <strong>{patientForm.email}</strong>
        </p>
        <button onClick={() => {
          setStep('date'); setSelectedDate(null); setSelectedSlot(null)
          setPatientForm({ first_name:'', last_name:'', email:'', phone:'', reason:'' })
        }} className="text-sm text-blue-600 hover:underline">
          Solicitar otro turno
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100" style={{ background: `${prof.brand_color || '#2563eb'}11` }}>
        <h2 className="text-sm font-semibold text-slate-800">Reservar turno</h2>
        <p className="text-xs text-slate-500 mt-0.5">Sesiones de {slotDuration} minutos</p>
      </div>

      <div className="p-5">
        {/* Steps */}
        <div className="flex gap-2 mb-5">
          {['Fecha', 'Horario', 'Tus datos'].map((label, i) => {
            const current = ['date','time','form'].indexOf(step)
            const isActive = i === current
            const isDone = i < current
            return (
              <div key={label} className="flex items-center gap-1.5 flex-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span className={`text-[11px] ${isActive ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{label}</span>
                {i < 2 && <div className="flex-1 h-px bg-slate-100" />}
              </div>
            )
          })}
        </div>

        {/* STEP 1: DATE */}
        {step === 'date' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-600">
                Elegí un día
              </p>
              <div className="flex gap-1">
                <button type="button" onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
                  disabled={weekOffset === 0}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <button type="button" onClick={() => setWeekOffset(w => w + 1)}
                  className="p-1 rounded hover:bg-slate-100 transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            {weekDays.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Sin días disponibles</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {weekDays.map(d => (
                  <button key={d.toISOString()} type="button"
                    onClick={() => { setSelectedDate(d); setStep('time') }}
                    className="flex flex-col items-center py-3 px-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-center">
                    <span className="text-[10px] text-slate-400 uppercase capitalize">
                      {format(d, 'EEE', { locale: es })}
                    </span>
                    <span className="text-lg font-light text-slate-700">{format(d, 'd')}</span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {format(d, 'MMM', { locale: es })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: TIME */}
        {step === 'time' && selectedDate && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button type="button" onClick={() => setStep('date')} className="p-1 rounded hover:bg-slate-100 transition-colors">
                <ChevronLeft size={16} className="text-slate-500" />
              </button>
              <p className="text-sm font-medium text-slate-700 capitalize">
                {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </p>
            </div>
            {loadingSlots ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-slate-400" />
              </div>
            ) : allSlots.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Sin horarios configurados</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {allSlots.map(slot => {
                  const isBooked = bookedSlots.includes(slot)
                  return (
                    <button key={slot} type="button"
                      disabled={isBooked}
                      onClick={() => { setSelectedSlot(slot); setStep('form') }}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        isBooked
                          ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed line-through'
                          : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700'
                      }`}>
                      {slot}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: FORM */}
        {step === 'form' && (
          <form onSubmit={handleBook} className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <button type="button" onClick={() => setStep('time')} className="p-1 rounded hover:bg-slate-100 transition-colors">
                <ChevronLeft size={16} className="text-slate-500" />
              </button>
              <div>
                <p className="text-xs font-semibold text-slate-700 capitalize">
                  {selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })} · {selectedSlot} hs
                </p>
                <p className="text-[11px] text-slate-400">{prof.full_name} · {slotDuration} min</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Nombre *</label>
                <input value={patientForm.first_name}
                  onChange={e => setPatientForm(f => ({ ...f, first_name: e.target.value }))}
                  placeholder="María" required className="text-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Apellido *</label>
                <input value={patientForm.last_name}
                  onChange={e => setPatientForm(f => ({ ...f, last_name: e.target.value }))}
                  placeholder="González" required className="text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Email *</label>
              <input type="email" value={patientForm.email}
                onChange={e => setPatientForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com" required className="text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Teléfono</label>
              <input value={patientForm.phone}
                onChange={e => setPatientForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+54 11 1234-5678" className="text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Motivo de consulta</label>
              <textarea value={patientForm.reason}
                onChange={e => setPatientForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Contanos brevemente por qué consultás (opcional)"
                rows={2} className="text-sm resize-none" />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: prof.brand_color || '#2563eb' }}>
              {submitting ? 'Solicitando...' : 'Confirmar turno'}
            </button>
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              Recibirás un email de confirmación. El profesional revisará tu solicitud.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}