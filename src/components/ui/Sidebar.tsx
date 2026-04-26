'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, CalendarDays, Users, Clock, FileText,
  XCircle, BarChart2, Settings, LogOut, Brain
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

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <aside className="w-[200px] min-h-screen bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800 leading-none">PsicoApp</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Gestión clínica</div>
          </div>
        </div>
      </div>

      {/* Nav */}
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
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
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
      <div className="px-2 py-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-[13px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
