'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Paperclip, Upload, Trash2, FileText, Download, X } from 'lucide-react'
import { formatAR } from '@/lib/dates'

interface Attachment {
  id: string
  file_name: string
  file_path: string
  file_size: number
  created_at: string
}

export default function NoteAttachments({
  noteId,
  psychologistId,
  patientId,
}: {
  noteId: string
  psychologistId: string
  patientId: string
}) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadAttachments()
  }, [noteId])

  async function loadAttachments() {
    setLoading(true)
    const { data } = await supabase
      .from('note_attachments')
      .select('id, file_name, file_path, file_size, created_at')
      .eq('note_id', noteId)
      .order('created_at', { ascending: false })
    setAttachments(data || [])
    setLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validaciones
    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede superar 10MB')
      return
    }

    setUploading(true)
    try {
      const fileName = `${noteId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

      // Upload a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('note-attachments')
        .upload(fileName, file, { contentType: 'application/pdf' })

      if (uploadError) throw uploadError

      // Guardar registro en DB
      const { error: dbError } = await supabase
        .from('note_attachments')
        .insert({
          note_id: noteId,
          psychologist_id: psychologistId,
          patient_id: patientId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: 'application/pdf',
        })

      if (dbError) {
        // Rollback storage si falla DB
        await supabase.storage.from('note-attachments').remove([fileName])
        throw dbError
      }

      toast.success(`${file.name} adjuntado`)
      await loadAttachments()
    } catch (err: any) {
      toast.error('Error al subir archivo: ' + (err.message || 'Error desconocido'))
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDownload(attachment: Attachment) {
    try {
      const { data, error } = await supabase.storage
        .from('note-attachments')
        .createSignedUrl(attachment.file_path, 60)

      if (error) throw error

      // Abrir en nueva pestaña
      window.open(data.signedUrl, '_blank')
    } catch {
      toast.error('Error al descargar archivo')
    }
  }

  async function handleDelete(attachment: Attachment) {
    if (!confirm(`¿Eliminar "${attachment.file_name}"?`)) return
    setDeletingId(attachment.id)
    try {
      // Eliminar de storage
      await supabase.storage
        .from('note-attachments')
        .remove([attachment.file_path])

      // Eliminar de DB
      const { error } = await supabase
        .from('note_attachments')
        .delete()
        .eq('id', attachment.id)

      if (error) throw error

      setAttachments(prev => prev.filter(a => a.id !== attachment.id))
      toast.success('Archivo eliminado')
    } catch {
      toast.error('Error al eliminar archivo')
    }
    setDeletingId(null)
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      marginTop: 16,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: attachments.length > 0 || loading ? '1px solid var(--border)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Paperclip size={14} style={{ color: 'var(--text-tertiary)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Archivos adjuntos
          </span>
          {attachments.length > 0 && (
            <span style={{
              fontSize: 11, padding: '2px 7px', borderRadius: 99,
              background: 'var(--epsi-green-pale)', color: 'var(--epsi-green)',
              fontWeight: 500,
            }}>
              {attachments.length}
            </span>
          )}
        </div>

        {/* Botón subir */}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-secondary"
            style={{ fontSize: 11, padding: '6px 12px' }}
          >
            {uploading ? (
              <>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  border: '2px solid var(--border)',
                  borderTopColor: 'var(--epsi-green)',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Subiendo...
              </>
            ) : (
              <>
                <Upload size={11} /> Adjuntar PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lista de archivos */}
      {loading ? (
        <div style={{ padding: '16px 20px' }}>
          {[1, 2].map(i => (
            <div key={i} style={{
              height: 14, borderRadius: 4,
              background: 'var(--surface-raised)',
              marginBottom: 8,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : attachments.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--surface-raised)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px',
          }}>
            <Paperclip size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
            Sin archivos adjuntos
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Adjuntá estudios, informes o documentos PDF
          </p>
        </div>
      ) : (
        <div>
          {attachments.map((att, i) => (
            <div
              key={att.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 20px',
                borderBottom: i < attachments.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              {/* Icono */}
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={16} style={{ color: '#dc2626' }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  margin: '0 0 2px',
                }}>
                  {att.file_name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
                  {formatSize(att.file_size)} · {formatAR(att.created_at, "d MMM yyyy · HH:mm")}
                </p>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => handleDownload(att)}
                  title="Descargar"
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-secondary)',
                    transition: 'background 0.12s',
                  }}
                >
                  <Download size={13} />
                </button>
                <button
                  onClick={() => handleDelete(att)}
                  disabled={deletingId === att.id}
                  title="Eliminar"
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#dc2626',
                    opacity: deletingId === att.id ? 0.5 : 1,
                    transition: 'background 0.12s',
                  }}
                >
                  {deletingId === att.id
                    ? <X size={13} />
                    : <Trash2 size={13} />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  )
}