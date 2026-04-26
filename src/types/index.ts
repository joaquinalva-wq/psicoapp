export type AppointmentStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'pending_reconfirmation'
  | 'reconfirmed'
  | 'cancelled_by_patient'
  | 'cancelled_by_psychologist'
  | 'completed'

export type AppointmentModality = 'presencial' | 'virtual'

export interface Psychologist {
  id: string
  user_id: string
  full_name: string
  license_number: string | null
  email: string
  phone: string | null
  address: string | null
  logo_url: string | null
  brand_color: string
  default_duration: number
  reminder_hours: number
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  psychologist_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  admin_notes: string | null
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  psychologist_id: string
  patient_id: string
  scheduled_at: string
  duration_minutes: number
  modality: AppointmentModality
  status: AppointmentStatus
  internal_notes: string | null
  confirmation_token: string
  reminder_sent_at: string | null
  cancelled_reason: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  patient?: Patient
}

export interface AppointmentEvent {
  id: string
  appointment_id: string
  event_type: string
  from_status: AppointmentStatus | null
  to_status: AppointmentStatus | null
  notes: string | null
  created_at: string
}

export interface SessionNote {
  id: string
  psychologist_id: string
  patient_id: string
  appointment_id: string | null
  consultation_reason: string | null
  development: string | null
  interventions: string | null
  observations: string | null
  next_steps: string | null
  session_date: string
  created_at: string
  updated_at: string
  patient?: Patient
  appointment?: Appointment
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending_confirmation: 'Pendiente',
  confirmed: 'Confirmado',
  pending_reconfirmation: 'Sin reconfirmar',
  reconfirmed: 'Reconfirmado',
  cancelled_by_patient: 'Cancelado',
  cancelled_by_psychologist: 'Cancelado',
  completed: 'Completado',
}

export const STATUS_COLORS: Record<AppointmentStatus, { bg: string; text: string; dot: string }> = {
  pending_confirmation: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  confirmed:            { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending_reconfirmation: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
  reconfirmed:          { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  cancelled_by_patient: { bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-400' },
  cancelled_by_psychologist: { bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-400' },
  completed:            { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
}

export const CALENDAR_EVENT_COLORS: Record<AppointmentStatus, string> = {
  pending_confirmation: '#94a3b8',
  confirmed: '#10b981',
  pending_reconfirmation: '#f59e0b',
  reconfirmed: '#3b82f6',
  cancelled_by_patient: '#ef4444',
  cancelled_by_psychologist: '#ef4444',
  completed: '#8b5cf6',
}
