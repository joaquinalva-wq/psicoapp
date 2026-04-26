'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Brain } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    if (error) { toast.error(error.message); setLoading(false) }
    else {
      toast.success('Cuenta creada. ¡Ya podés iniciar sesión!')
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain size={24} className="text-white" />
          </div>
          <h1 className="text-3xl text-slate-800">PsicoApp</h1>
          <p className="text-slate-400 text-sm mt-1">Creá tu cuenta profesional</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Nombre completo</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Dra. Laura Martínez" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 8 caracteres" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
          <p className="text-center text-sm text-slate-500 pt-1">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Ingresá</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
