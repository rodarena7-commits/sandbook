import { Plus } from 'lucide-react'
import { useStatuses } from '../../contexts/StatusContext'
import StatusRing from './StatusRing'

function Face({ photo, name }) {
  if (photo) return <img src={photo} alt="" referrerPolicy="no-referrer" className="w-14 h-14 rounded-full object-cover" />
  return (
    <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-600 text-lg">
      {(name || '?')[0].toUpperCase()}
    </div>
  )
}

// Fila de estados (arriba del Feed): "Tu estado" primero y después los de los demás.
export default function StatusBar({ myProfile }) {
  const { myUid, byUser, queue, hasStatus, openStatuses, openCreate } = useStatuses()
  const others = queue.filter(u => u !== myUid)
  const mine = hasStatus(myUid)

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-none px-4 py-3 bg-white border-b border-slate-100" data-tour="soc-status">
      <div className="flex flex-col items-center w-16 flex-shrink-0">
        <div className="relative">
          <button onClick={() => (mine ? openStatuses(myUid, true) : openCreate())} aria-label={mine ? 'Ver mi estado' : 'Agregar estado'}>
            <StatusRing uid={myUid}>
              <Face photo={myProfile?.photoURL} name={myProfile?.displayName} />
            </StatusRing>
          </button>
          <button onClick={openCreate} aria-label="Agregar estado"
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white">
            <Plus size={11} strokeWidth={3} />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-1 truncate w-full text-center">Tu estado</p>
      </div>

      {others.map(uid => {
        const last = byUser[uid][byUser[uid].length - 1]
        return (
          <button key={uid} onClick={() => openStatuses(uid, true)} className="flex flex-col items-center w-16 flex-shrink-0">
            <StatusRing uid={uid}>
              <Face photo={last.photo} name={last.name} />
            </StatusRing>
            <p className="text-[10px] text-slate-500 mt-1 truncate w-full text-center">{(last.name || 'Lector').split(' ')[0]}</p>
          </button>
        )
      })}

      {others.length === 0 && (
        <p className="self-center text-[11px] text-slate-400 pl-1">
          Compartí un estado: una foto o una frase de lo que estás leyendo. Dura 24 horas.
        </p>
      )}
    </div>
  )
}
