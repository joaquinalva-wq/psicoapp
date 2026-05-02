import Link from 'next/link'
import { Calendar, Shield, Users, ArrowRight, MapPin, Phone, Clock } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: '#f8f9fa', fontFamily: 'var(--font-sans)' }}>

      {/* ── Nav ── */}
      <nav style={{
        background: 'white',
        borderBottom: '1px solid #e8ede4',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', border: '1px solid #e8ede4', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/epsi-logo.jpg" alt="EPSI" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', lineHeight: 1 }}>EPSI</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Espacio Psicológico Integral</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/turnos" style={{ fontSize: 13, fontWeight: 500, color: '#2d5016', textDecoration: 'none' }}>
              Sacar turno
            </Link>
            <Link href="/login" style={{
              fontSize: 13, fontWeight: 500, color: 'white',
              background: '#2d5016', padding: '8px 18px', borderRadius: 8,
              textDecoration: 'none', transition: 'opacity 0.15s',
            }}>
              Acceso profesionales
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ background: 'linear-gradient(135deg, #2d5016 0%, #3d6b1e 60%, #4a7a22 100%)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 99, padding: '6px 14px', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#86efac' }} />
            <span style={{ fontSize: 12, color: '#bbf7d0', fontWeight: 500 }}>Turnos disponibles online</span>
          </div>

          <div style={{ width: 72, height: 72, borderRadius: 16, overflow: 'hidden', margin: '0 auto 24px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <img src="/epsi-logo.jpg" alt="EPSI" style={{ width: '90%', height: '90%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
          </div>

          <h1 style={{ fontSize: 42, fontWeight: 300, color: 'white', margin: '0 0 16px', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
            Espacio Psicológico Integral
          </h1>
          <p style={{ fontSize: 16, color: '#bbf7d0', margin: '0 0 8px', lineHeight: 1.6 }}>
            Centro especializado en salud mental · Campana, Buenos Aires
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 40px' }}>
            Reservá turno con nuestros profesionales de manera simple y rápida.
          </p>
          <Link href="/turnos" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'white', color: '#2d5016',
            padding: '14px 32px', borderRadius: 12,
            fontSize: 15, fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            transition: 'transform 0.15s',
          }}>
            <Calendar size={18} /> Reservar turno online
          </Link>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section style={{ background: 'white', borderBottom: '1px solid #e8ede4' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center' }}>
          {[
            { value: '100%', label: 'Atención personalizada' },
            { value: 'Online', label: 'Reserva de turnos' },
            { value: 'Campana', label: 'Buenos Aires' },
          ].map(s => (
            <div key={s.label} style={{ padding: '24px 16px', borderRight: '1px solid #e8ede4' }}>
              <div style={{ fontSize: 22, fontWeight: 300, color: '#2d5016', fontFamily: 'var(--font-display)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Por qué EPSI ── */}
      <section style={{ padding: '72px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 30, fontWeight: 300, color: '#1e293b', fontFamily: 'var(--font-display)', margin: '0 0 12px' }}>
              ¿Por qué elegir EPSI?
            </h2>
            <p style={{ fontSize: 14, color: '#64748b' }}>Un equipo comprometido con tu bienestar</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { icon: Users, title: 'Equipo profesional', desc: 'Psicólogos especializados en diversas áreas de la salud mental, con formación continua y compromiso ético.' },
              { icon: Calendar, title: 'Turnos online 24/7', desc: 'Reservá tu turno cuando quieras, desde donde estés. Sin llamadas, sin esperas, en segundos.' },
              { icon: Shield, title: 'Atención personalizada', desc: 'Cada profesional adapta su enfoque a las necesidades únicas de cada paciente, en un espacio seguro.' },
            ].map(f => (
              <div key={f.title} style={{
                padding: 28,
                borderRadius: 16,
                border: '1px solid #e8ede4',
                background: 'white',
                transition: 'box-shadow 0.2s',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0f4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <f.icon size={20} color="#2d5016" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '72px 24px', background: '#f0f4ec' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 30, fontWeight: 300, color: '#1e293b', fontFamily: 'var(--font-display)', margin: '0 0 12px' }}>
            ¿Listo para comenzar?
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 32px' }}>
            Encontrá el profesional ideal y reservá tu turno online en segundos.
          </p>
          <Link href="/turnos" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#2d5016', color: 'white',
            padding: '14px 32px', borderRadius: 12,
            fontSize: 14, fontWeight: 600,
            textDecoration: 'none',
          }}>
            Ver profesionales <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Acceso profesionales ── */}
      <section style={{ padding: '40px 24px', background: 'white', borderTop: '1px solid #e8ede4' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', margin: '0 0 4px' }}>
              ¿Sos profesional de EPSI?
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
              Accedé a tu panel de gestión de turnos, pacientes y notas clínicas
            </p>
          </div>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            border: '2px solid #2d5016', color: '#2d5016',
            padding: '10px 22px', borderRadius: 10,
            fontSize: 13, fontWeight: 600,
            textDecoration: 'none', whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}>
            Ingresar al sistema <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#2d5016', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/epsi-logo.jpg" alt="EPSI" style={{ width: '90%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
            <span style={{ fontSize: 12, color: '#bbf7d0' }}>EPSI — Espacio Psicológico Integral</span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { icon: MapPin, text: 'Campana, Buenos Aires' },
              { icon: Clock, text: 'Lun–Vie 8–20 hs' },
            ].map(i => (
              <div key={i.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                <i.icon size={12} />
                {i.text}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>© 2026</span>
        </div>
      </footer>
    </div>
  )
}