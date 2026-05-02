import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MapPin, Clock, Search, CheckCircle } from 'lucide-react'
import EPSIBookingWidget from '@/components/portal/EPSIBookingWidget'

export default async function TurnosPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('psychologists')
    .select('*')
    .eq('is_public', true)

  if (sp.q) {
    query = query.or(
      `full_name.ilike.%${sp.q}%,profession.ilike.%${sp.q}%,bio.ilike.%${sp.q}%`
    )
  }

  const { data: professionals } = await query.order('full_name')
  const allSpecialties = [...new Set((professionals || []).flatMap((p: any) => p.specialties || []))]
  const days: Record<number, string> = { 1:'Lun', 2:'Mar', 3:'Mié', 4:'Jue', 5:'Vie', 6:'Sáb', 0:'Dom' }

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fa' }}>

      {/* Header */}
      <header style={{ background: '#2d5016' }} className="sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/epsi-logo.jpg" alt="EPSI" className="h-10 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }} />
            <div>
              <p className="text-white font-semibold text-sm leading-none">EPSI</p>
              <p className="text-green-200 text-xs">Espacio Psicológico Integral</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-green-200 text-xs hidden md:block">📍 Campana, Buenos Aires</span>
            <Link href="/login"
              className="text-xs bg-white text-green-800 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors">
              Acceso profesionales
            </Link>
          </div>
        </div>
      </header>

      {/* Hero + buscador */}
      <div style={{ background: 'linear-gradient(135deg, #2d5016 0%, #3d6b1e 100%)' }} className="py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl text-white mb-3"
            style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>
            Reservá tu turno en EPSI
          </h1>
          <p className="text-green-200 mb-8 text-sm">
            Encontrá al profesional ideal y elegí el horario que mejor te quede
          </p>

          <form action="/turnos" method="GET" className="flex gap-3 max-w-lg mx-auto mb-5">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input name="q" defaultValue={sp.q || ''}
                placeholder="Buscar por nombre o especialidad..."
                className="w-full pl-9 pr-4 py-3 rounded-xl border-0 text-sm outline-none bg-white shadow-lg" />
            </div>
            <button type="submit"
              className="px-6 py-3 bg-white text-green-800 rounded-xl text-sm font-semibold hover:bg-green-50 transition-colors shadow-lg">
              Buscar
            </button>
          </form>

          {allSpecialties.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              <Link href="/turnos"
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  !sp.q ? 'bg-white text-green-800 font-semibold' : 'bg-green-700 text-green-100 hover:bg-green-600'
                }`}>
                Todos
              </Link>
              {allSpecialties.slice(0, 8).map((s: string) => (
                <Link key={s} href={`/turnos?q=${encodeURIComponent(s)}`}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    sp.q === s ? 'bg-white text-green-800 font-semibold' : 'bg-green-700 text-green-100 hover:bg-green-600'
                  }`}>
                  {s}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista de profesionales */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {!professionals?.length ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <p className="text-2xl mb-3">🔍</p>
            <p className="text-slate-500 font-medium mb-2">Sin resultados para "{sp.q}"</p>
            <Link href="/turnos" className="text-sm hover:underline" style={{ color: '#2d5016' }}>
              Ver todos los profesionales →
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-6">
              {professionals.length} profesional{professionals.length !== 1 ? 'es' : ''} disponible{professionals.length !== 1 ? 's' : ''}
              {sp.q && <span className="font-medium text-slate-700"> · "{sp.q}"</span>}
            </p>

            <div className="space-y-6">
              {professionals.map((prof: any) => (
                <div key={prof.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-1 lg:grid-cols-3">

                    {/* Info del profesional */}
                    <div className="lg:col-span-2 p-6 border-b lg:border-b-0 lg:border-r border-slate-100">

                      {/* Cabecera */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0">
                          {prof.profile_photo_url
                            ? <img src={prof.profile_photo_url} alt={prof.full_name}
                                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100" />
                            : (
                              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                                style={{ background: prof.brand_color || '#2d5016' }}>
                                {prof.full_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('')}
                              </div>
                            )
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-semibold text-slate-800">{prof.full_name}</h2>
                          <p className="text-sm font-medium mt-0.5"
                            style={{ color: prof.brand_color || '#2d5016' }}>
                            {prof.profession}
                          </p>
                          {prof.license_number && (
                            <p className="text-xs text-slate-400 mt-0.5">Mat. {prof.license_number}</p>
                          )}
                        </div>
                        {prof.consultation_fee && (
                          <div className="flex-shrink-0 text-right">
                            <span className="text-sm font-semibold text-slate-700">
                              {prof.consultation_fee}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bio */}
                      {prof.bio && (
                        <p className="text-sm text-slate-500 leading-relaxed mb-4">{prof.bio}</p>
                      )}

                      {/* Especialidades */}
                      {prof.specialties?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {prof.specialties.map((s: string) => (
                            <span key={s}
                              className="text-xs px-2.5 py-1 rounded-full font-medium"
                              style={{
                                background: `${prof.brand_color || '#2d5016'}18`,
                                color: prof.brand_color || '#2d5016'
                              }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Info secundaria */}
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-3">
                        {prof.office_address && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-slate-400" />
                            {prof.office_address}{prof.office_city && `, ${prof.office_city}`}
                          </span>
                        )}
                        {prof.available_from && (
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-400" />
                            {prof.available_from?.slice(0,5)} - {prof.available_to?.slice(0,5)} hs
                          </span>
                        )}
                        {prof.accepts_insurance && prof.insurance_list?.length > 0 && (
                          <span className="flex items-center gap-1.5">
                            <CheckCircle size={12} className="text-emerald-500" />
                            {prof.insurance_list.slice(0,2).join(', ')}
                            {prof.insurance_list.length > 2 && ` +${prof.insurance_list.length - 2}`}
                          </span>
                        )}
                      </div>

                      {/* Días */}
                      {prof.available_days?.length > 0 && (
                        <div className="flex gap-1">
                          {[1,2,3,4,5,6,0].map(d => (
                            <span key={d}
                              className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                prof.available_days.includes(d)
                                  ? 'text-white'
                                  : 'bg-slate-100 text-slate-300'
                              }`}
                              style={prof.available_days.includes(d)
                                ? { background: prof.brand_color || '#2d5016' }
                                : {}}>
                              {days[d]}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Widget de reserva */}
                    <div className="p-5 bg-slate-50">
                      <EPSIBookingWidget prof={prof} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background: '#2d5016' }} className="py-8 px-6 mt-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-green-200">
          <div className="flex items-center gap-3">
            <img src="/epsi-logo.jpg" alt="EPSI" className="h-6 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }} />
            <span>EPSI — Espacio Psicológico Integral · Campana, Buenos Aires</span>
          </div>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  )
}