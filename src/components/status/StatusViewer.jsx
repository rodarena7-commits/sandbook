import { useEffect, useRef, useState } from 'react'
import { X, Eye, Trash2, ChevronDown, Loader2, Volume2, VolumeX } from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import { base64ChunksToBlob } from '../../utils/videoCompress'
import { useAuth } from '../../contexts/AuthContext'

// URLs de videos ya armados, para no volver a descargarlos al ir y venir
const videoCache = new Map()

async function loadVideoUrl(status) {
  if (videoCache.has(status.id)) return videoCache.get(status.id)
  const snap = await getDocs(collection(db, 'statuses', status.id, 'chunks'))
  const parts = snap.docs
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map(d => d.data().data)
  if (!parts.length || parts.length < (status.video?.chunks || 0)) throw new Error('incompleto')
  const url = URL.createObjectURL(base64ChunksToBlob(parts, status.video?.mime))
  videoCache.set(status.id, url)
  return url
}

const DURATION_MS = 6000

import { timeAgo as timeAgoText } from '../../utils/timeAgo'

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
  const { t, language } = useAuth()
  const [userIdx, setUserIdx] = useState(startIndex)
  const [itemIdx, setItemIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [showViews, setShowViews] = useState(false)
  const elapsedRef = useRef(0)
  const pressRef = useRef(null)
  const videoRef = useRef(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [videoError, setVideoError] = useState(false)
  const [muted, setMuted] = useState(false)

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

  const isVideo = item?.type === 'video'

  // Videos: se descargan los pedazos y se arman; el avance lo marca el propio video
  useEffect(() => {
    setVideoUrl(null)
    setVideoError(false)
    if (!isVideo) return
    let cancelled = false
    loadVideoUrl(item)
      .then(url => { if (!cancelled) setVideoUrl(url) })
      .catch(() => { if (!cancelled) setVideoError(true) })
    return () => { cancelled = true }
  }, [item?.id])

  useEffect(() => {
    const v = videoRef.current
    if (!v || !videoUrl) return
    if (paused || showViews) { v.pause(); return }
    v.play().catch(() => {
      // Sin interacción previa algunos navegadores sólo dejan reproducir sin sonido
      v.muted = true
      setMuted(true)
      v.play().catch(() => {})
    })
  }, [videoUrl, paused, showViews])

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

  // Avance automático (pausado mientras se aprieta o se mira la lista de vistas).
  // Los videos avanzan con su propia reproducción (onTimeUpdate / onEnded).
  useEffect(() => {
    if (!item || paused || showViews || (isVideo && !videoError)) return
    let last = performance.now()
    let raf
    const tick = now => {
      elapsedRef.current += now - last
      last = now
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
    if (!item || !window.confirm(t('st_delete_q'))) return
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
          <p className="text-white text-sm font-semibold truncate">{mine ? t('st_yours') : item.name}</p>
          <p className="text-white/60 text-[11px]">{timeAgoText(item.createdAt, t, language) || t('common_now')}</p>
        </div>
        {mine && (
          <button onClick={handleDelete} aria-label={t('st_delete')}
            className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center">
            <Trash2 size={16} />
          </button>
        )}
        <button onClick={onClose} aria-label={t('common_close')}
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
        {isVideo ? (
          <>
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                playsInline
                muted={muted}
                poster={item.video?.poster}
                className="max-w-full max-h-full pointer-events-none"
                onTimeUpdate={e => {
                  const v = e.currentTarget
                  // Los .webm grabados no informan su duración: se usa la guardada al publicar
                  const total = isFinite(v.duration) && v.duration > 0 ? v.duration : item.video?.duration
                  if (total) setProgress(Math.min(1, v.currentTime / total))
                }}
                onEnded={next}
              />
            ) : videoError ? (
              <p className="text-white/70 text-sm">{t('st_video_error')}</p>
            ) : (
              <div className="flex flex-col items-center gap-3">
                {item.video?.poster && <img src={item.video.poster} alt="" className="max-w-[70%] max-h-[50vh] object-contain opacity-60 rounded-xl" />}
                <Loader2 size={26} className="animate-spin text-white" />
              </div>
            )}
            {videoUrl && (
              <button
                onPointerDown={e => e.stopPropagation()}
                onPointerUp={e => e.stopPropagation()}
                onClick={() => { const m = !muted; setMuted(m); if (videoRef.current) videoRef.current.muted = m }}
                aria-label={muted ? t('st_sound_on') : t('st_mute')}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center">
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}
            {item.text && (
              <p className="absolute bottom-6 left-4 right-4 text-center text-white text-base font-medium bg-black/45 rounded-2xl px-4 py-2.5 whitespace-pre-wrap break-words">
                {item.text}
              </p>
            )}
          </>
        ) : item.type === 'image' ? (
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
          <Eye size={16} /> {t(views.length === 1 ? 'st_view_one' : 'st_view_many', { n: views.length })}
        </button>
      )}

      {showViews && (
        <div className="absolute inset-0 z-20 flex items-end bg-black/50" onClick={() => setShowViews(false)}>
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl p-5 pb-8 max-h-[60vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-slate-800 flex items-center gap-2"><Eye size={16} className="text-amber-500" /> {t('st_seen_by')}</p>
              <button onClick={() => setShowViews(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                <ChevronDown size={16} />
              </button>
            </div>
            <div className="overflow-y-auto flex flex-col gap-2">
              {views.length === 0 && <p className="text-sm text-slate-400 text-center py-6">{t('st_nobody_seen')}</p>}
              {views.map((v, i) => (
                <div key={i} className="flex items-center gap-3">
                  {v.photo
                    ? <img src={v.photo} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover" />
                    : <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-600 text-sm">{(v.name || '?')[0].toUpperCase()}</div>}
                  <p className="flex-1 text-sm text-slate-700 truncate">{v.name || t('soc_reader_default')}</p>
                  <p className="text-[11px] text-slate-400">{timeAgoText({ seconds: (v.at || 0) / 1000 }, t, language)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
