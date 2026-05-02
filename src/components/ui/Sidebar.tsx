'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, CalendarDays, Users, Clock, FileText,
  XCircle, BarChart2, Settings, LogOut
} from 'lucide-react'

const NAV = [
  { section: 'Principal', items: [
    { href: '/dashboard',    label: 'Inicio',          icon: LayoutDashboard },
    { href: '/calendar',     label: 'Calendario',      icon: CalendarDays },
    { href: '/appointments', label: 'Turnos',          icon: Clock },
    { href: '/patients',     label: 'Pacientes',       icon: Users },
  ]},
  { section: 'Clínico', items: [
    { href: '/notes',        label: 'Notas de sesión', icon: FileText },
    { href: '/cancelled',    label: 'Cancelados',      icon: XCircle },
    { href: '/statistics',   label: 'Estadísticas',    icon: BarChart2 },
  ]},
  { section: 'Sistema', items: [
    { href: '/settings',     label: 'Configuración',   icon: Settings },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [psych, setPsych] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('psychologists')
        .select('full_name, profession, logo_url, brand_color')
        .eq('user_id', user.id)
        .single()
      setPsych(data)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const brandColor = psych?.brand_color || '#2d5016'

  return (
    <aside className="w-[210px] min-h-screen bg-white border-r border-slate-200 flex flex-col flex-shrink-0">

      {/* Header EPSI */}
      <div className="px-4 py-4 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2.5 mb-3">
          <img src="/epsi-logo.png" alt="EPSI" className="h-8 w-auto" />
          <div>
            <div className="text-xs font-bold text-slate-800 leading-none">EPSI</div>
            <div className="text-[10px] text-slate-400">Esp. Psicológico Integral</div>
          </div>
        </Link>

        {/* Profesional logueado */}
        {psych && (
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
            {psych.logo_url
              ? <img src={psych.logo_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
              : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: brandColor }}>
                  {psych.full_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('')}
                </div>
              )
            }
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-700 truncate">{psych.full_name}</p>
              <p className="text-[10px] text-slate-400 truncate">{psych.profession || 'Profesional'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
        {NAV.map(group => (
          <div key={group.section}>
            <p className="px-3 mb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link key={href} href={href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                      active ? 'font-medium text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                    style={active ? { background: brandColor } : {}}
                  >
                    <Icon size={14} className="flex-shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-slate-100 space-y-1">
        <Link href="/turnos" target="_blank"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: brandColor }}>
          🌐 Ver portal EPSI
        </Link>
        <button onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-[13px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors">
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}