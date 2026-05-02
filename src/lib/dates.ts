import { toZonedTime, format as formatTZ } from 'date-fns-tz'
import { format, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'

export const TZ = 'America/Argentina/Buenos_Aires'

/**
 * Convierte un string UTC de Supabase a fecha en zona horaria Argentina
 */
export function toAR(date: string | Date): Date {
  return toZonedTime(new Date(date), TZ)
}

/**
 * Formatea una fecha de Supabase directo en zona Argentina
 */
export function formatAR(date: string | Date, fmt: string): string {
  return formatTZ(toZonedTime(new Date(date), TZ), fmt, { locale: es, timeZone: TZ })
}

/**
 * Formatea hora HH:mm en Argentina
 */
export function timeAR(date: string | Date): string {
  return formatAR(date, 'HH:mm')
}

/**
 * Label relativo: hoy / mañana / lun / mar...
 */
export function relativeDayAR(date: string | Date): string {
  const d = toAR(date)
  if (isToday(d)) return 'hoy'
  if (isTomorrow(d)) return 'mañana'
  return format(d, 'EEE', { locale: es })
}

/**
 * Fecha completa en español: "lunes 5 de mayo de 2026"
 */
export function fullDateAR(date: string | Date): string {
  return formatAR(date, "EEEE d 'de' MMMM 'de' yyyy")
}

/**
 * Fecha corta: "5 May"
 */
export function shortDateAR(date: string | Date): string {
  return formatAR(date, "d MMM")
}