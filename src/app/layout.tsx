import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'PsicoApp — Gestión de consulta',
  description: 'Sistema de gestión de turnos y notas clínicas para psicólogos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Serif+Display&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#f8fafc', borderRadius: '8px', fontSize: '13px' },
            success: { iconTheme: { primary: '#10b981', secondary: '#f8fafc' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
          }}
        />
      </body>
    </html>
  )
}
