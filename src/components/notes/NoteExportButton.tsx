'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Download } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function NoteExportButton({ note, psych }: { note: any; psych: any }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const margin = 20; const pageW = 210; const contentW = pageW - margin * 2
    let y = margin

    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, pageW, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text(psych?.full_name || '', margin, 13)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    if (psych?.license_number) doc.text(`Matrícula: ${psych.license_number}`, margin, 21)
    doc.setTextColor(0, 0, 0)
    y = 42

    doc.setFillColor(248, 250, 252)
    doc.rect(margin, y - 6, contentW, 18, 'F')
    doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.text('Fecha:', margin + 3, y + 2)
    doc.setFont('helvetica', 'normal')
    doc.text(format(new Date(note.session_date + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es }), margin + 22, y + 2)
    doc.setFont('helvetica', 'bold'); doc.text('Paciente:', margin + 3, y + 9)
    doc.setFont('helvetica', 'normal')
    doc.text(`${note.patient?.first_name} ${note.patient?.last_name}`, margin + 26, y + 9)
    y += 22

    const sections = [
      { title: 'Motivo de consulta', content: note.consultation_reason },
      { title: 'Desarrollo de sesión', content: note.development },
      { title: 'Intervenciones realizadas', content: note.interventions },
      { title: 'Observaciones clínicas', content: note.observations },
      { title: 'Próximos pasos', content: note.next_steps },
    ].filter(s => s.content)

    for (const section of sections) {
      if (y > 250) { doc.addPage(); y = margin }
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(37, 99, 235)
      doc.text(section.title, margin, y); y += 5
      doc.setDrawColor(37, 99, 235); doc.setLineWidth(0.3)
      doc.line(margin, y, margin + contentW, y); y += 5
      doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
      const lines = doc.splitTextToSize(section.content!, contentW)
      if (y + lines.length * 5 > 270) { doc.addPage(); y = margin }
      doc.text(lines, margin, y); y += lines.length * 5 + 8
    }

    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150)
      doc.text(`PsicoApp · ${psych?.full_name || ''} · Página ${i}/${pageCount}`, margin, 290)
    }

    doc.save(`nota-${note.session_date}-${note.patient?.last_name || 'paciente'}.pdf`)
    toast.success('PDF descargado')
    setLoading(false)
  }

  return (
    <button onClick={handleExport} disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
      <Download size={12} /> {loading ? 'Generando...' : 'Exportar PDF'}
    </button>
  )
}
