'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { CheckCircle, XCircle, FileText, CheckCheck } from 'lucide-react'
import { AppointmentStatus } from '@/types'

export default function AppointmentActions({
  appointmentId, status, patientId
}: { appointmentId: string; status: AppointmentStatus; patientId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState('')

  async function updateStatus(newStatus: AppointmentStatus, reason?: string) {
    setLoading(newStatus)
    const update: any = { status: newStatus }
    if (newStatus.startsWith('cancelled')) {
      update.cancelled_at = new Date().toISOString()
      update.cancelled_reason = reason || 'cancelled_by_psychologist'
    }
    const { error } = await supabase.from('appointments').update(update).eq('id', appointmentId)
    if (error) { toast.error('Error al actualizar'); }
    else {
      await supabase.from('appointment_events').insert({
        appointment_id: appointmentId, event_type: `set_${newStatus}`,
        from_status: status, to_status: newStatus
      })
      toast.success('Estado actualizado')
      router.refresh()
    }
    setLoading('')
  }

  const btn = (label: string, icon: React.ReactNode, action: () => void, className: string, key: string) => (
    <button key={key} onClick={action} disabled={!!loading}
      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 ${className}`}>
      {loading === key ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : icon}
      {label}
    </button>
  )

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Acciones</h3>
      <div className="space-y-2">
        {status !== 'completed' && btn('Marcar completado', <CheckCheck size={14} />, () => updateStatus('completed'), 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', 'completed')}
        {status === 'pending_confirmation' && btn('Confirmar manualmente', <CheckCircle size={14} />, () => updateStatus('confirmed'), 'bg-blue-50 text-blue-700 hover:bg-blue-100', 'confirmed')}
        {status !== 'cancelled_by_psychologist' && status !== 'completed' && btn('Cancelar turno', <XCircle size={14} />, () => updateStatus('cancelled_by_psychologist', 'cancelled_by_psychologist'), 'bg-red-50 text-red-600 hover:bg-red-100', 'cancelled_by_psychologist')}
        <Link href={`/notes/new?appointment=${appointmentId}&patient=${patientId}`}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">
          <FileText size={14} /> Nueva nota de sesión
        </Link>
      </div>
    </div>
  )
}
