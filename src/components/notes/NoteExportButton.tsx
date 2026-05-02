'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Download } from 'lucide-react'
import { fullDateAR, formatAR } from '@/lib/dates'

export default function NoteExportButton({ note, psych }: { note: any; psych: any }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const margin = 20
      const pageW = 210
      const contentW = pageW - margin * 2
      let y = margin

      // Header verde EPSI
      doc.setFillColor(45, 80, 22)
      doc.rect(0, 0, pageW, 34, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(psych?.full_name || '', margin, 13)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      if (psych?.profession) doc.text(psych.profession, margin, 20)
      if (psych?.license_number) doc.text(`Matrícula: ${psych.license_number}`, margin, 27)
      doc.setFontSize(8)
      doc.text('EPSI — Espacio Psicológico Integral · Campana, Buenos Aires', pageW - margin, 27, { align: 'right' })
      doc.setTextColor(0, 0, 0)
      y = 46

      // Info sesión — fondo verde pálido
      doc.setFillColor(240, 244, 236)
      doc.rect(margin, y - 6, contentW, 22, 'F')
      doc.setDrawColor(45, 80, 22)
      doc.setLineWidth(0.5)
      doc.line(margin, y - 6, margin, y + 16)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Fecha:', margin + 5, y + 2)
      doc.setFont('helvetica', 'normal')
      doc.text(
        fullDateAR(note.session_date + 'T12:00:00'),
        margin + 24, y + 2
      )
      doc.setFont('helvetica', 'bold')
      doc.text('Paciente:', margin + 5, y + 10)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `${note.patient?.first_name} ${note.patient?.last_name}`,
        margin + 28, y + 10
      )
      y += 28

      // Secciones
      const sections = [
        { title: 'Motivo de consulta',       content: note.consultation_reason },
        { title: 'Desarrollo de sesión',     content: note.development },
        { title: 'Intervenciones realizadas', content: note.interventions },
        { title: 'Observaciones clínicas',   content: note.observations },
        { title: 'Próximos pasos',           content: note.next_steps },
      ].filter(s => s.content)

      for (const section of sections) {
        if (y > 250) { doc.addPage(); y = margin }
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(45, 80, 22)
        doc.text(section.title, margin, y)
        y += 4
        doc.setDrawColor(45, 80, 22)
        doc.setLineWidth(0.3)
        doc.line(margin, y, margin + contentW, y)
        y += 5
        doc.setTextColor(30, 41, 59)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const lines = doc.splitTextToSize(section.content!, contentW)
        if (y + lines.length * 5 > 270) { doc.addPage(); y = margin }
        doc.text(lines, margin, y)
        y += lines.length * 5 + 10
      }

      // Footer en cada página
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFillColor(45, 80, 22)
        doc.rect(0, 284, pageW, 14, 'F')
        doc.setFontSize(8)
        doc.setTextColor(255, 255, 255)
        doc.text(
          `EPSI · ${psych?.full_name || ''} · Página ${i}/${pageCount}`,
          margin, 292
        )
        doc.text(
          formatAR(note.created_at, "d MMM yyyy"),
          pageW - margin, 292, { align: 'right' }
        )
      }

      doc.save(`nota-${note.session_date}-${note.patient?.last_name || 'paciente'}.pdf`)
      toast.success('PDF descargado')
    } catch (e) {
      toast.error('Error al generar PDF')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="btn-secondary"
      style={{ fontSize: 12, padding: '7px 14px' }}
    >
      <Download size={12} />
      {loading ? 'Generando...' : 'Exportar PDF'}
    </button>
  )
}