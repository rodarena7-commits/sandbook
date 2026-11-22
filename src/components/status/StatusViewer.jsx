import { useEffect, useRef, useState } from 'react'
import { X, Eye, Trash2, ChevronDown } from 'lucide-react'

const DURATION_MS = 6000

function timeAgo(ts) {
  const ms = ts?.toMillis?.() || (ts?.seconds || 0) * 1000
  if (!ms) return 'ahora'
  const m = Math.floor((Date.now() - ms) / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m} min`
  return `hace ${Math.floor(m / 60)} h`
}

function Avatar({ photo, name }) {
  if (photo) return <img src={photo} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover border border-white/30" />
  return (
    <div className="w-9 h-9 rounded-full bg-amber-500/30 flex items-center justify-center text-white font-bold text-sm">
      {(name || '?')[0].toUpperCase()}
    </div>
  )
}

// Reproduce los estados de un usuario y, si se abrió desde la fila de estados, sigue con el próximo.
export default function StatusViewer({ queue, startIndex = 0, byUser, myUid, onSeen, onDelete, onClose }) {
  const [userIdx, setUserIdx] = useState(startIndex)
  const [itemIdx, setItemIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [showViews, setShowViews] = useState(false)
  const elapsedRef = useRef(0)
  const pressRef = useRef(null)

  const uid = queue[userIdx]
  const items = byUser[uid] || []
  const item = items[itemIdx]
  const mine = uid === myUid
  const views = Object.values(item?.views || {}).sort((a, b) => (b.at || 0) - (a.at || 0))

  // Si el estado se borró o venció mientras se miraba
  useEffect(() => {
    if (!item) {
      if (items.length && itemIdx >= items.length) setItemIdx(items.length - 1)
      else if (!items.length) next()
    }
  }, [item, items.length])

  useEffect(() => { if (item) onSeen(item) }, [item?.id])

  function next() {
    elapsedRef.current = 0
    setProgress(0)
    if (itemIdx < items.length - 1) setItemIdx(i => i + 1)
    else if (userIdx < queue.length - 1) { setUserIdx(u => u + 1); setItemIdx(0) }
    else onClose()
  }

  function prev() {
    elapsedRef.current = 0
    setProgress(0)
    if (itemIdx > 0) setItemIdx(i => i - 1)
    else if (userIdx > 0) {
      const prevUid = queue[userIdx - 1]
      setUserIdx(u => u - 1)
      setItemIdx(Math.max(0, (byUser[prevUid]?.length || 1) - 1))
    }
  }

  // Avance automático (pausado mientras se aprieta o se mira la lista de vistas)
  useEffect(() => {
    if (!item || paused || showViews) return
    let last = performance.now()
    let raf
    const tick = t => {
      elapsedRef.current += t - last
      last = t
      const p = Math.min(1, elapsedRef.current / DURATION_MS)
      setProgress(p)
      if (p >= 1) next()
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [item?.id, paused, showViews])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Toque corto: izquierda/derecha navega. Mantener apretado: pausa.
  function onPointerDown() {
    pressRef.current = Date.now()
    setPaused(true)
  }
  function onPointerUp(e) {
    const short = pressRef.current && Date.now() - pressRef.current < 250
    setPaused(false)
    pressRef.current = null
    if (!short) return
    const x = e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0
    if (x < window.innerWidth / 3) prev()
    else next()
  }

  async function handleDelete() {
    if (!item || !window.confirm('¿Borrar este estado?')) return
    setPaused(true)
    await onDelete(item.id)
    setPaused(false)
  }

  if (!item) return null

  return (
    <div className="fixed inset-0 z-[320] bg-black flex flex-col select-none" data-no-track>
      {/* Barras de progreso */}
      <div className="flex gap-1 px-3 pt-10">
        {items.map((s, i) => (
          <div key={s.id} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white"
              style={{ width: `${i < itemIdx ? 100 : i === itemIdx ? progress * 100 : 0}%` }} />
          </div>
        ))}
      </div>

      {/* Encabezado */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2 relative z-10">
        <Avatar photo={item.photo} name={item.name} />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{mine ? 'Tu estado' : item.name}</p>
          <p className="text-white/60 text-[11px]">{timeAgo(item.createdAt)}</p>
        </div>
        {mine && (
          <button onClick={handleDelete} aria-label="Borrar estado"
            className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center">
            <Trash2 size={16} />
          </button>
        )}
        <button onClick={onClose} aria-label="Cerrar"
          className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center">
          <X size={18} />
        </button>
      </div>

      {/* Contenido */}
      <div
        className="flex-1 relative flex items-center justify-center min-h-0"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setPaused(false)}
        style={item.type === 'text' ? { background: item.bg || '#f59e0b' } : undefined}
      >
        {item.type === 'image' ? (
          <>
            <img src={item.image} alt="" className="max-w-full max-h-full object-contain pointer-events-none" draggable={false} />
            {item.text && (
              <p className="absolute bottom-6 left-4 right-4 text-center text-white text-base font-medium bg-black/45 rounded-2xl px-4 py-2.5 whitespace-pre-wrap break-words">
                {item.text}
              </p>
            )}
          </>
        ) : (
          <p className="px-8 text-center text-white text-2xl font-bold leading-snug whitespace-pre-wrap break-words">
            {item.text}
          </p>
        )}
      </div>

      {/* Vistas (sólo el dueño) */}
      {mine && (
        <button onClick={() => setShowViews(true)}
          className="flex items-center justify-center gap-1.5 text-white/80 text-sm py-4">
          <Eye size={16} /> {views.length} {views.length === 1 ? 'vista' : 'vistas'}
        </button>
      )}

      {showViews && (
        <div className="absolute inset-0 z-20 flex items-end bg-black/50" onClick={() => setShowViews(false)}>
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl p-5 pb-8 max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-slate-800 flex items-center gap-2"><Eye size={16} className="text-amber-500" /> Lo vieron</p>
              <button onClick={() => setShowViews(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                <ChevronDown size={16} />
              </button>
            </div>
            <div className="overflow-y-auto flex flex-col gap-2">
              {views.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Todavía nadie lo vio.</p>}
              {views.map((v, i) => (
                <div key={i} className="flex items-center gap-3">
                  {v.photo
                    ? <img src={v.photo} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover" />
                    : <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-600 text-sm">{(v.name || '?')[0].toUpperCase()}</div>}
                  <p className="flex-1 text-sm text-slate-700 truncate">{v.name || 'Lector'}</p>
                  <p className="text-[11px] text-slate-400">{timeAgo({ seconds: (v.at || 0) / 1000 })}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
