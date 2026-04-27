import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search, MapPin, Clock, ArrowLeft, Brain } from 'lucide-react'

export default async function BuscarPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; city?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('psychologists')
    .select('id, slug, full_name, profession, bio, specialties, office_name, office_city, office_address, available_from, available_to, available_days, consultation_fee, profile_photo_url, brand_color')
    .eq('is_public', true)

  if (sp.q) {
    query = query.or(`full_name.ilike.%${sp.q}%,profession.ilike.%${sp.q}%,bio.ilike.%${sp.q}%,office_city.ilike.%${sp.q}%`)
  }
  if (sp.city) {
    query = query.ilike('office_city', `%${sp.city}%`)
  }

  const { data: professionals } = await query.order('full_name').limit(50)

  const days: Record<number, string> = { 1:'Lun', 2:'Mar', 3:'Mié', 4:'Jue', 5:'Vie', 6:'Sáb', 0:'Dom' }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={18} className="text-slate-500" />
            </Link>
            <form action="/buscar" method="GET" className="flex-1 flex gap-3">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="q" defaultValue={sp.q || ''}
                  placeholder="Profesión, especialidad, nombre o ciudad..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-400 bg-white" />
              </div>
              <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Buscar
              </button>
            </form>
            <Link href="/login" className="text-sm text-blue-600 hover:underline whitespace-nowrap">Soy profesional</Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <p className="text-sm text-slate-500">
            {professionals?.length === 0 ? 'Sin resultados' : `${professionals?.length} profesional${professionals?.length !== 1 ? 'es' : ''} encontrado${professionals?.length !== 1 ? 's' : ''}`}
            {sp.q && <span className="font-medium text-slate-700"> para "{sp.q}"</span>}
          </p>
        </div>

        {professionals?.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <Search size={32} className="text-slate-200 mx-auto mb-4" />
            <h3 className="text-base font-medium text-slate-700 mb-2">Sin resultados</h3>
            <p className="text-sm text-slate-400 mb-5">Intentá con otra búsqueda</p>
            <Link href="/buscar" className="text-sm text-blue-600 hover:underline">Ver todos los profesionales →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {professionals?.map((p: any) => (
              <Link key={p.id} href={`/p/${p.slug}`}
                className="flex bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all group">
                <div className="w-1.5 flex-shrink-0" style={{ background: p.brand_color || '#2563eb' }} />
                <div className="flex-shrink-0 flex items-center justify-center w-20 bg-slate-50 border-r border-slate-100">
                  {p.profile_photo_url
                    ? <img src={p.profile_photo_url} alt={p.full_name} className="w-14 h-14 rounded-full object-cover" />
                    : (
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold text-white"
                        style={{ background: p.brand_color || '#2563eb' }}>
                        {p.full_name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                      </div>
                    )}
                </div>
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{p.full_name}</h3>
                      <p className="text-sm text-blue-600 font-medium mt-0.5">{p.profession}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      {p.consultation_fee && <p className="text-sm font-semibold text-slate-700">{p.consultation_fee}</p>}
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium mt-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        Acepta turnos
                      </span>
                    </div>
                  </div>
                  {p.bio && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{p.bio}</p>}
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    {p.office_city && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={12} className="text-slate-400" /> {p.office_city}
                      </span>
                    )}
                    {p.available_from && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={12} className="text-slate-400" />
                        {p.available_from?.slice(0,5)} - {p.available_to?.slice(0,5)} hs
                      </span>
                    )}
                  </div>
                  {p.available_days?.length > 0 && (
                    <div className="flex gap-1 mt-3">
                      {[1,2,3,4,5,6,0].map(d => (
                        <span key={d} className={`text-[10px] px-2 py-0.5 rounded font-medium ${p.available_days.includes(d) ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-300'}`}>
                          {days[d]}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.specialties?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.specialties.slice(0,4).map((s: string) => (
                        <span key={s} className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">{s}</span>
                      ))}
                      {p.specialties.length > 4 && <span className="text-[11px] text-slate-400">+{p.specialties.length - 4} más</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center pr-5">
                  <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700 whitespace-nowrap">Ver perfil →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}