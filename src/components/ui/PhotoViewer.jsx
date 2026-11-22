import { useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Loader2, Trash2 } from 'lucide-react'
import { loadPhotoHistory, deletePhotoFromHistory } from '../../hooks/usePhotoHistory'

function dateLabel(ts) {
  const ms = ts?.toMillis?.() || (ts?.seconds || 0) * 1000
  if (!ms) return ''
  return new Date(ms).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Foto de perfil en pantalla completa, con las anteriores (flechas o deslizando).
// canDelete: el dueño del perfil puede borrar fotos viejas de su historial.
export default function PhotoViewer({ uid, currentUrl, name, canDelete = false, onClose }) {
  const [history, setHistory] = useState(null)
  const [index, setIndex]     = useState(0)
  const touchX = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadPhotoHistory(uid)
      .then(list => { if (!cancelled) setHistory(list) })
      .catch(() => { if (!cancelled) setHistory([]) })
    return () => { cancelled = true }
  }, [uid])

  const photos = [
    ...(currentUrl ? [{ id: 'current', url: currentUrl, current: true }] : []),
    ...(history || []).filter(h => h.url && h.url !== currentUrl),
  ]
  const photo = photos[Math.min(index, photos.length - 1)]

  function go(delta) {
    setIndex(i => Math.max(0, Math.min(photos.length - 1, i + delta)))
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photos.length])

  async function handleDelete() {
    if (!photo || photo.current) return
    if (!window.confirm('¿Borrar esta foto de tu historial?')) return
    await deletePhotoFromHistory(uid, photo.id)
    setHistory(h => h.filter(x => x.id !== photo.id))
    setIndex(i => Math.max(0, i - 1))
  }

  return (
    <div
      className="fixed inset-0 z-[300] bg-black flex flex-col"
      onTouchStart={e => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
    >
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 text-white flex-shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{name || 'Foto de perfil'}</p>
          <p className="text-[11px] text-white/60">
            {photo?.current ? 'Foto actual' : photo ? `Usada hasta el ${dateLabel(photo.replacedAt)}` : ''}
            {photos.length > 1 && ` · ${index + 1} de ${photos.length}`}
          </p>
        </div>
        {canDelete && photo && !photo.current && (
          <button onClick={handleDelete} aria-label="Borrar foto"
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <Trash2 size={16} />
          </button>
        )}
        <button onClick={onClose} aria-label="Cerrar"
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center px-2 min-h-0">
        {photo ? (
          <img src={photo.url} alt="" referrerPolicy="no-referrer"
            className="max-w-full max-h-full object-contain select-none" draggable={false} />
        ) : (
          <p className="text-white/50 text-sm">Sin foto de perfil</p>
        )}

        {index > 0 && (
          <button onClick={() => go(-1)} aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center">
            <ChevronLeft size={22} />
          </button>
        )}
        {index < photos.length - 1 && (
          <button onClick={() => go(1)} aria-label="Foto siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center">
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Miniaturas */}
      <div className="flex-shrink-0 pb-8 pt-3 px-4">
        {history === null ? (
          <div className="flex justify-center"><Loader2 size={18} className="animate-spin text-white/50" /></div>
        ) : photos.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto scrollbar-none justify-center">
            {photos.map((p, i) => (
              <button key={p.id} onClick={() => setIndex(i)}
                className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 transition-all ${i === index ? 'border-amber-400' : 'border-transparent opacity-60'}`}>
                <img src={p.url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-white/40 text-center">No hay fotos anteriores guardadas</p>
        )}
      </div>
    </div>
  )
}
