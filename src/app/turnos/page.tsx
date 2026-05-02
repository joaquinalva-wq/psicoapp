import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MapPin, Clock, CheckCircle, Search, ArrowRight } from 'lucide-react'
import EPSIBookingWidget from '@/components/portal/EPSIBookingWidget'

export const revalidate = 60

export default async function TurnosPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('psychologists')
    .select('id, full_name, profession, bio, specialties, office_address, office_city, available_days, available_from, available_to, slot_duration, brand_color, profile_photo_url, logo_url, whatsapp_number, contact_method, accepts_insurance, insurance_list, consultation_fee, license_number, slug')
    .eq('is_public', true)

  if (sp.q) {
    query = query.or(`full_name.ilike.%${sp.q}%,profession.ilike.%${sp.q}%,bio.ilike.%${sp.q}%`)
  }

  const { data: professionals } = await query.order('full_name')
  const allSpecialties = [...new Set((professionals || []).flatMap((p: any) => p.specialties || []))]
  const days: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 0: 'Dom' }

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f2', fontFamily: 'var(--font-sans)' }}>

      {/* ── Header ── */}
      <header style={{ background: '#2d5016', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 7, overflow: 'hidden', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/epsi-logo.jpg" alt="EPSI" style={{ width: '90%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white', lineHeight: 1 }}>EPSI</div>
              <div style={{ fontSize: 10, color: '#86efac' }}>Espacio Psicológico Integral</div>
            </div>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, color: '#86efac', display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={12} /> Campana, Buenos Aires
            </span>
            <Link href="/login" style={{
              fontSize: 12, fontWeight: 600, color: '#2d5016',
              background: 'white', padding: '7px 16px', borderRadius: 8,
              textDecoration: 'none',
            }}>
              Acceso profesionales
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero + buscador ── */}
      <div style={{ background: 'linear-gradient(160deg, #2d5016 0%, #3d6b1e 100%)', padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 34, fontWeight: 300, color: 'white', margin: '0 0 10px', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
            Reservá tu turno en EPSI
          </h1>
          <p style={{ fontSize: 14, color: '#bbf7d0', margin: '0 0 32px' }}>
            Encontrá al profesional ideal y elegí el horario que mejor te quede
          </p>

          <form action="/turnos" method="GET" style={{ display: 'flex', gap: 10, maxWidth: 520, margin: '0 auto 20px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                name="q"
                defaultValue={sp.q || ''}
                placeholder="Nombre, especialidad..."
                style={{
                  width: '100%', paddingLeft: 38, paddingRight: 16, paddingTop: 11, paddingBottom: 11,
                  borderRadius: 10, border: 'none', fontSize: 14,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)', outline: 'none',
                  fontFamily: 'var(--font-sans)',
                }}
              />
            </div>
            <button type="submit" style={{
              padding: '11px 22px', background: 'white', color: '#2d5016',
              border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}>
              Buscar
            </button>
          </form>

          {allSpecialties.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              <Link href="/turnos" style={{
                fontSize: 12, padding: '5px 14px', borderRadius: 99, textDecoration: 'none', fontWeight: 500,
                background: !sp.q ? 'white' : 'rgba(255,255,255,0.12)',
                color: !sp.q ? '#2d5016' : '#bbf7d0',
                border: !sp.q ? 'none' : '1px solid rgba(255,255,255,0.15)',
              }}>
                Todos
              </Link>
              {allSpecialties.slice(0, 8).map((s: string) => (
                <Link key={s} href={`/turnos?q=${encodeURIComponent(s)}`} style={{
                  fontSize: 12, padding: '5px 14px', borderRadius: 99, textDecoration: 'none', fontWeight: 500,
                  background: sp.q === s ? 'white' : 'rgba(255,255,255,0.12)',
                  color: sp.q === s ? '#2d5016' : '#bbf7d0',
                  border: sp.q === s ? 'none' : '1px solid rgba(255,255,255,0.15)',
                }}>
                  {s}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Profesionales ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        {!professionals?.length ? (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: '64px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#1e293b', marginBottom: 8 }}>Sin resultados para "{sp.q}"</p>
            <Link href="/turnos" style={{ fontSize: 13, color: '#2d5016', textDecoration: 'none', fontWeight: 500 }}>
              Ver todos los profesionales →
            </Link>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
              {professionals.length} profesional{professionals.length !== 1 ? 'es' : ''} disponible{professionals.length !== 1 ? 's' : ''}
              {sp.q && <strong style={{ color: '#64748b' }}> · "{sp.q}"</strong>}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {professionals.map((prof: any) => (
                <div key={prof.id} style={{
                  background: 'white', borderRadius: 20, border: '1px solid #e2e8f0',
                  overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.2s',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px' }}>

                    {/* Info */}
                    <div style={{ padding: '28px 28px 24px', borderRight: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                        <div style={{ flexShrink: 0 }}>
                          {prof.profile_photo_url ? (
                            <img src={prof.profile_photo_url} alt={prof.full_name}
                              style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover', border: '2px solid #f1f5f9' }} />
                          ) : (
                            <div style={{
                              width: 64, height: 64, borderRadius: 16,
                              background: prof.brand_color || '#2d5016',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 20, fontWeight: 700, color: 'white',
                            }}>
                              {prof.full_name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', margin: '0 0 4px' }}>
                            {prof.full_name}
                          </h2>
                          <p style={{ fontSize: 13, fontWeight: 500, color: prof.brand_color || '#2d5016', margin: '0 0 4px' }}>
                            {prof.profession}
                          </p>
                          {prof.license_number && (
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Mat. {prof.license_number}</p>
                          )}
                        </div>
                        {prof.consultation_fee && (
                          <div style={{ flexShrink: 0, textAlign: 'right' }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                              {prof.consultation_fee}
                            </span>
                          </div>
                        )}
                      </div>

                      {prof.bio && (
                        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 16 }}>{prof.bio}</p>
                      )}

                      {prof.specialties?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                          {prof.specialties.map((s: string) => (
                            <span key={s} style={{
                              fontSize: 11, padding: '4px 10px', borderRadius: 99, fontWeight: 500,
                              background: `${prof.brand_color || '#2d5016'}15`,
                              color: prof.brand_color || '#2d5016',
                            }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                        {prof.office_address && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <MapPin size={12} color="#94a3b8" />
                            {prof.office_address}{prof.office_city && `, ${prof.office_city}`}
                          </span>
                        )}
                        {prof.available_from && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Clock size={12} color="#94a3b8" />
                            {prof.available_from?.slice(0, 5)} - {prof.available_to?.slice(0, 5)} hs
                          </span>
                        )}
                        {prof.accepts_insurance && prof.insurance_list?.length > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <CheckCircle size={12} color="#10b981" />
                            {prof.insurance_list.slice(0, 2).join(', ')}
                            {prof.insurance_list.length > 2 && ` +${prof.insurance_list.length - 2}`}
                          </span>
                        )}
                      </div>

                      {prof.available_days?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[1, 2, 3, 4, 5, 6, 0].map(d => (
                            <span key={d} style={{
                              fontSize: 10, padding: '3px 7px', borderRadius: 5, fontWeight: 500,
                              background: prof.available_days.includes(d) ? (prof.brand_color || '#2d5016') : '#f1f5f9',
                              color: prof.available_days.includes(d) ? 'white' : '#cbd5e1',
                            }}>
                              {days[d]}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Widget reserva */}
                    <div style={{ background: '#f8faf6', padding: '28px 20px', display: 'flex', flexDirection: 'column' }}>
                      <EPSIBookingWidget prof={prof} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <footer style={{ background: '#2d5016', padding: '28px 24px', marginTop: 24 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, overflow: 'hidden', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/epsi-logo.jpg" alt="EPSI" style={{ width: '90%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
            <span style={{ fontSize: 12, color: '#bbf7d0' }}>EPSI — Espacio Psicológico Integral · Campana, Buenos Aires</span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>© 2026</span>
        </div>
      </footer>
    </div>
  )
}