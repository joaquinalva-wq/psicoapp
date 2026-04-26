import { AppointmentStatus, STATUS_LABELS, STATUS_COLORS } from '@/types'

export default function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { bg, text } = STATUS_COLORS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[status].dot}`} />
      {STATUS_LABELS[status]}
    </span>
  )
}
