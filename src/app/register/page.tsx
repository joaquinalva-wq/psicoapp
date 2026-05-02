'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success('¡Cuenta creada! Iniciando sesión...')
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (!loginError) { router.push('/dashboard'); router.refresh() }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#f0f4ec' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/epsi-logo.jpg" alt="EPSI" className="h-16 w-auto mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Espacio Psicológico Integral</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Crear cuenta</h2>
          <p className="text-sm text-slate-400 mb-6">Registrate como profesional de EPSI</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre completo *</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Dra. Laura Martínez" required autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Contraseña *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-50 mt-2"
              style={{ background: '#2d5016' }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              ¿Ya tenés cuenta?{' '}
              <Link href="/login" className="font-medium hover:underline" style={{ color: '#2d5016' }}>
                Ingresá
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          <Link href="/turnos" className="hover:underline">← Volver al portal de turnos</Link>
        </p>
      </div>
    </div>
  )
}