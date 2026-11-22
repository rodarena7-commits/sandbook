import { useStatuses } from '../../contexts/StatusContext'

// Dibuja el círculo de "tiene estado" alrededor de una foto de perfil.
// De color si hay estados sin ver; gris si ya se vieron todos (o si son los míos).
export default function StatusRing({ uid, children, className = '' }) {
  const { hasStatus, allSeen } = useStatuses()
  if (!uid || !hasStatus(uid)) return children
  const seen = allSeen(uid)
  return (
    <span
      className={`inline-flex rounded-full p-[2.5px] flex-shrink-0 ${className}`}
      style={{ background: seen ? '#cbd5e1' : 'conic-gradient(from 180deg, #f59e0b, #ef4444, #ec4899, #8b5cf6, #f59e0b)' }}
    >
      <span className="inline-flex rounded-full bg-white p-[2px]">{children}</span>
    </span>
  )
}
