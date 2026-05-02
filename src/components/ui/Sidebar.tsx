'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, CalendarDays, Users, Clock, FileText,
  XCircle, BarChart2, Settings, LogOut, ExternalLink
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
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>

      {/* ── Logo EPSI ── */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
          marginBottom: 14,
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            overflow: 'hidden',
            flexShrink: 0,
            border: '1px solid var(--border)',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              src="/epsi-logo.jpg"
              alt="EPSI"
              style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>
              EPSI
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Esp. Psicológico Integral
            </div>
          </div>
        </Link>

        {/* Profesional */}
        {psych && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--surface-raised)',
            borderRadius: 10,
            padding: '8px 10px',
          }}>
            {psych.logo_url ? (
              <img src={psych.logo_url} alt=""
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: brandColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0,
              }}>
                {psych.full_name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {psych.full_name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {psych.profession || 'Profesional'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Navegación ── */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '0 10px', marginBottom: 4,
            }}>
              {group.section}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link key={href} href={href} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '8px 10px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    color: active ? 'white' : 'var(--text-secondary)',
                    background: active ? brandColor : 'transparent',
                    textDecoration: 'none',
                    transition: 'background 0.12s, color 0.12s',
                  }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'
                        ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent'
                        ;(e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
                      }
                    }}
                  >
                    <Icon size={14} style={{ flexShrink: 0 }} />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: '10px 8px 14px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        <Link href="/turnos" target="_blank" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 500,
          color: 'white',
          background: brandColor,
          textDecoration: 'none',
          transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.88'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
        >
          <ExternalLink size={13} style={{ flexShrink: 0 }} />
          Ver portal EPSI
        </Link>
        <button onClick={handleLogout} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderRadius: 8,
          fontSize: 13,
          color: 'var(--text-tertiary)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          transition: 'background 0.12s, color 0.12s',
          textAlign: 'left',
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'
          }}
        >
          <LogOut size={14} style={{ flexShrink: 0 }} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}