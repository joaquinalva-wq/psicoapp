import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Clock, Phone, Globe, ArrowLeft, Brain, CheckCircle } from 'lucide-react'
import BookingSection from '@/components/portal/BookingSection'

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: prof } = await supabase
    .from('psychologists')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (!prof) notFound()

  const days: Record<number, string> = { 1:'Lunes', 2:'Martes', 3:'Miércoles', 4:'Jueves', 5:'Viernes', 6:'Sábado', 0:'Domingo' }
  const activeDays = (prof.available_days || [1,2,3,4,5]).map((d: number) => days[d]).join(', ')

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center gap-4">
          <Link href="/buscar" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={16} className="text-slate-500" />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Brain size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">PsicoApp</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6 items-start">

          <div className="col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="h-24" style={{ background: `linear-gradient(135deg, ${prof.brand_color || '#2563eb'}22, ${prof.brand_color || '#2563eb'}55)` }} />
              <div className="px-6 pb-6">
                <div className="flex items-end gap-4 -mt-10 mb-4">
                  {prof.profile_photo_url
                    ? <img src={prof.profile_photo_url} alt={prof.full_name} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md" />
                    : (
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white border-4 border-white shadow-md"
                        style={{ background: prof.brand_color || '#2563eb' }}>
                        {prof.full_name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                      </div>
                    )}
                  <div className="mb-1">
                    <h1 className="text-2xl text-slate-800" style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>
                      {prof.full_name}
                    </h1>
                    <p className="text-blue-600 font-medium text-sm mt-0.5">{prof.profession}</p>
                    {prof.license_number && <p className="text-xs text-slate-400 mt-0.5">Matrícula {prof.license_number}</p>}
                  </div>
                </div>
                {prof.bio && <p className="text-sm text-slate-600 leading-relaxed">{prof.bio}</p>}
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
                  {prof.office_city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-400" />
                      {prof.office_city}{prof.office_province && `, ${prof.office_province}`}
                    </span>
                  )}
                  {prof.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={14} className="text-slate-400" /> {prof.phone}
                    </span>
                  )}
                  {prof.social_web && (
                    <a href={prof.social_web} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:underline">
                      <Globe size={14} /> Sitio web
                    </a>
                  )}
                </div>
              </div>
            </div>

            {prof.specialties?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Especialidades</h2>
                <div className="flex flex-wrap gap-2">
                  {prof.specialties.map((s: string) => (
                    <span key={s} className="text-sm bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Información</h2>
              <div className="space-y-3">
                {prof.office_name && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">🏥</div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Centro / Consultorio</p>
                      <p className="text-sm text-slate-700">{prof.office_name}</p>
                    </div>
                  </div>
                )}
                {prof.office_address && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin size={14} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Dirección</p>
                      <p className="text-sm text-slate-700">{prof.office_address}</p>
                      {prof.office_city && <p className="text-xs text-slate-400">{prof.office_city}{prof.office_province && `, ${prof.office_province}`}</p>}
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Horario de atención</p>
                    <p className="text-sm text-slate-700">{activeDays}</p>
                    <p className="text-xs text-slate-400">{prof.available_from?.slice(0,5)} - {prof.available_to?.slice(0,5)} hs</p>
                  </div>
                </div>
                {prof.consultation_fee && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">💰</div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Honorarios</p>
                      <p className="text-sm text-slate-700">{prof.consultation_fee}</p>
                    </div>
                  </div>
                )}
                {prof.accepts_insurance && prof.insurance_list?.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={14} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Obras sociales</p>
                      <p className="text-sm text-slate-700">{prof.insurance_list.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="sticky top-20">
            <BookingSection prof={prof} />
          </div>
        </div>
      </div>
    </div>
  )
}