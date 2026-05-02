import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'EPSI — Sistema de Gestión Clínica',
  description: 'Espacio Psicológico Integral · Campana, Buenos Aires · Sistema de gestión de turnos, pacientes y notas clínicas',
  icons: { icon: '/epsi-logo.jpg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '10px',
              fontSize: '13px',
              padding: '10px 14px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            },
            success: { iconTheme: { primary: '#4ade80', secondary: '#1e293b' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#1e293b' } },
          }}
        />
      </body>
    </html>
  )
}