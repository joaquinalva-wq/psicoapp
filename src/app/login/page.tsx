'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Email o contraseña incorrectos')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f0f4ec' }}>
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #2d5016 0%, #3d6b1e 100%)' }}>
        <img src="/epsi-logo.png" alt="EPSI" className="w-36 h-auto mb-6"
          style={{ filter: 'brightness(0) invert(1)' }} />
        <h1 className="text-3xl text-white text-center mb-3"
          style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>
          Espacio Psicológico Integral
        </h1>
        <p className="text-green-200 text-center text-sm leading-relaxed max-w-xs">
          Sistema de gestión clínica para los profesionales de EPSI Campana
        </p>
        <div className="mt-12 space-y-3 w-full max-w-xs">
          {[
            'Gestión de turnos y pacientes',
            'Historias clínicas completas',
            'Notas de sesión con logo EPSI',
            'Portal público de reservas',
          ].map(f => (
            <div key={f} className="flex items-center gap-3 text-green-100 text-sm">
              <div className="w-5 h-5 rounded-full bg-green-400 bg-opacity-30 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px]">✓</span>
              </div>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <img src="/epsi-logo.png" alt="EPSI" className="h-16 w-auto mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Espacio Psicológico Integral</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800 mb-1">Bienvenido/a</h2>
            <p className="text-sm text-slate-400 mb-6">Ingresá con tu cuenta de EPSI</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com" required autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-50 mt-2"
                style={{ background: '#2d5016' }}>
                {loading ? 'Ingresando...' : 'Ingresar al sistema'}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                ¿Primera vez?{' '}
                <Link href="/register" className="font-medium hover:underline" style={{ color: '#2d5016' }}>
                  Crear cuenta
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            <Link href="/turnos" className="hover:underline">← Volver al portal de turnos</Link>
          </p>
        </div>
      </div>
    </div>
  )
}