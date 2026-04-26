import { Resend } from 'resend'
import type { Appointment, Patient, Psychologist } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

function fmtDate(d: string) {
  return format(new Date(d), "EEEE d 'de' MMMM 'a las' HH:mm 'hs'", { locale: es })
}
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

function emailBase(brand: string, profName: string, body: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:24px;color:#1e293b}
.wrap{max-width:520px;margin:0 auto}
.card{background:white;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0}
.hdr{background:${brand};padding:28px 32px}
.hdr-name{color:white;font-size:18px;font-weight:600;margin:0}
.hdr-sub{color:rgba(255,255,255,.75);font-size:13px;margin:4px 0 0}
.body{padding:28px 32px}
.apt{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0}
.apt p{margin:5px 0;font-size:14px;color:#475569}
.apt strong{color:#1e293b}
.btn{display:block;text-align:center;padding:13px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;margin-bottom:10px}
.btn-ok{background:#10b981;color:white}
.btn-cancel{background:white;color:#64748b;border:1px solid #e2e8f0}
.foot{padding:16px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center}
</style></head><body><div class="wrap"><div class="card">
<div class="hdr"><p class="hdr-name">${profName}</p><p class="hdr-sub">Psicología</p></div>
<div class="body">${body}</div>
<div class="foot">Enviado por ${profName} · PsicoApp</div>
</div></div></body></html>`
}

export async function sendConfirmationEmail(apt: Appointment, patient: Patient, psych: Psychologist) {
  const confirmUrl = `${APP_URL}/confirm/${apt.confirmation_token}?action=confirm`
  const cancelUrl  = `${APP_URL}/confirm/${apt.confirmation_token}?action=cancel`
  const dateStr = cap(fmtDate(apt.scheduled_at))

  const body = `
<p style="font-size:16px;color:#475569">Hola <strong style="color:#1e293b">${patient.first_name}</strong>, tenés un turno agendado:</p>
<div class="apt">
  <p>📅 <strong>${dateStr}</strong></p>
  <p>⏱ <strong>${apt.duration_minutes} minutos</strong></p>
  <p>📍 <strong>${apt.modality === 'presencial' ? 'Presencial' : 'Virtual'}</strong></p>
</div>
<a href="${confirmUrl}" class="btn btn-ok">✓ Confirmar turno</a>
<a href="${cancelUrl}" class="btn btn-cancel">✕ No puedo asistir</a>
<p style="font-size:13px;color:#94a3b8;margin-top:16px">Si tenés dudas, contactá directamente al profesional.</p>`

  return resend.emails.send({
    from: FROM_EMAIL,
    to: patient.email,
    subject: `Turno con ${psych.full_name} — ${dateStr}`,
    html: emailBase(psych.brand_color || '#2563eb', psych.full_name, body),
  })
}

export async function sendReminderEmail(apt: Appointment, patient: Patient, psych: Psychologist) {
  const reconfirmUrl = `${APP_URL}/confirm/${apt.confirmation_token}?action=reconfirm`
  const cancelUrl    = `${APP_URL}/confirm/${apt.confirmation_token}?action=cancel`
  const dateStr = cap(fmtDate(apt.scheduled_at))

  const body = `
<div style="display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;margin-bottom:16px">⏰ Recordatorio — mañana</div>
<p style="font-size:16px;color:#475569">Hola <strong style="color:#1e293b">${patient.first_name}</strong>, te recordamos tu turno de mañana:</p>
<div class="apt">
  <p>📅 <strong>${dateStr}</strong></p>
  <p>⏱ <strong>${apt.duration_minutes} minutos</strong></p>
  <p>📍 <strong>${apt.modality === 'presencial' ? 'Presencial' : 'Virtual'}</strong></p>
</div>
<a href="${reconfirmUrl}" class="btn btn-ok">✓ Confirmo asistencia</a>
<a href="${cancelUrl}" class="btn btn-cancel">✕ Necesito cancelar</a>`

  return resend.emails.send({
    from: FROM_EMAIL,
    to: patient.email,
    subject: `Recordatorio: Turno mañana con ${psych.full_name}`,
    html: emailBase(psych.brand_color || '#2563eb', psych.full_name, body),
  })
}
