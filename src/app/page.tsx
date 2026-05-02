import Link from 'next/link'
import { Calendar, FileText, Users, Shield, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/epsi-logo.png" alt="EPSI" className="h-10 w-auto" />
            <div>
              <p className="font-semibold text-slate-800 text-sm leading-none">EPSI</p>
              <p className="text-xs text-slate-400">Espacio Psicológico Integral</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/turnos" className="text-sm text-slate-600 hover:text-slate-800 transition-colors font-medium">
              Sacar turno
            </Link>
            <Link href="/login" className="text-sm px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
              style={{ background: '#2d5016' }}>
              Acceso profesionales
            </Link>
          </div>
        </div>
      </nav>

      <section style={{ background: 'linear-gradient(135deg, #2d5016 0%, #3d6b1e 60%, #4a7a22 100%)' }} className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <img src="/epsi-logo.png" alt="EPSI" className="h-24 w-auto mx-auto mb-6" style={{ filter: 'brightness(0) invert(1)' }} />
          <h1 className="text-4xl text-white mb-4 font-light" style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>
            Espacio Psicológico Integral
          </h1>
          <p className="text-green-100 mb-3 leading-relaxed">Centro especializado en salud mental — Campana, Buenos Aires</p>
          <p className="text-green-200 text-sm mb-10">Reservá turno con nuestros profesionales de manera simple y rápida.</p>
          <Link href="/turnos"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-green-800 rounded-xl font-semibold hover:bg-green-50 transition-colors shadow-lg">
            <Calendar size={18} /> Sacar turno online
          </Link>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-light text-center text-slate-700 mb-10" style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>
            ¿Por qué elegir EPSI?
          </h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              { icon: Users, title: 'Equipo profesional', desc: 'Psicólogos especializados en diversas áreas de la salud mental.' },
              { icon: Calendar, title: 'Turnos online', desc: 'Reservá tu turno cuando quieras, desde donde estés, en segundos.' },
              { icon: Shield, title: 'Atención personalizada', desc: 'Cada profesional adapta su enfoque a las necesidades de cada paciente.' },
            ].map(f => (
              <div key={f.title} className="text-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: '#2d501620' }}>
                  <f.icon size={20} style={{ color: '#2d5016' }} />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6" style={{ background: '#f0f4ec' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl text-slate-700 mb-3" style={{ fontFamily: 'DM Serif Display, Georgia, serif' }}>¿Listo para comenzar?</h2>
          <p className="text-slate-500 mb-8 text-sm">Encontrá el profesional ideal y reservá tu turno online.</p>
          <Link href="/turnos" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity" style={{ background: '#2d5016' }}>
            Ver profesionales <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="py-10 px-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">¿Sos profesional de EPSI?</p>
            <p className="text-xs text-slate-400">Accedé a tu panel de gestión de turnos y pacientes</p>
          </div>
          <Link href="/login" className="flex items-center gap-2 px-5 py-2.5 border-2 rounded-xl text-sm font-semibold hover:bg-green-50 transition-colors" style={{ borderColor: '#2d5016', color: '#2d5016' }}>
            <FileText size={15} /> Ingresar al sistema
          </Link>
        </div>
      </section>

      <footer style={{ background: '#2d5016' }} className="py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-green-200">
          <div className="flex items-center gap-3">
            <img src="/epsi-logo.png" alt="EPSI" className="h-6 w-auto" style={{ filter: 'brightness(0) invert(1)' }} />
            <span>EPSI — Espacio Psicológico Integral · Campana, Buenos Aires</span>
          </div>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  )
}