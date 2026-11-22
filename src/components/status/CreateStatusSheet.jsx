import { useEffect, useRef, useState } from 'react'
import { X, Image as ImageIcon, Type, Loader2, Send, Video } from 'lucide-react'
import { compressToBase64 } from '../ui/ImagePickerSheet'
import { compressVideo, canRecordVideo, MAX_VIDEO_SECONDS } from '../../utils/videoCompress'

const BACKGROUNDS = ['#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#ec4899', '#0f172a']
const MAX_TEXT = 300

export default function CreateStatusSheet({ onCreate, onClose }) {
  const [mode, setMode]       = useState(null)   // 'image' | 'text' | 'video'
  const [image, setImage]     = useState(null)
  const [text, setText]       = useState('')
  const [bg, setBg]           = useState(BACKGROUNDS[0])
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl]   = useState(null)
  const [progress, setProgress]   = useState(null)   // texto de avance al publicar un video
  const fileRef  = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl) }, [videoUrl])

  function handleVideoFile(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('video/')) { setError('Elegí un video.'); return }
    setError('')
    setVideoFile(f)
    setVideoUrl(URL.createObjectURL(f))
    setMode('video')
  }

  async function handleFile(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('Elegí una imagen.'); return }
    setError('')
    // 1080 px / 72 %: buena calidad en pantalla completa y bien por debajo del límite de Firestore
    const data = await compressToBase64(f, 1080, 0.72)
    if (!data) { setError('No se pudo leer la imagen.'); return }
    setImage(data)
    setMode('image')
  }

  async function publish() {
    if (saving) return
    if (mode === 'image' && !image) return
    if (mode === 'text' && !text.trim()) return
    if (mode === 'video' && !videoFile) return
    setSaving(true)
    setError('')
    try {
      if (mode === 'video') {
        videoRef.current?.pause()
        setProgress('Preparando video… 0%')
        const video = await compressVideo(videoFile, p => setProgress(`Preparando video… ${Math.round(p * 100)}%`))
        setProgress('Subiendo…')
        await onCreate({ type: 'video', text, video })
      } else {
        await onCreate(mode === 'image' ? { type: 'image', image, text } : { type: 'text', text, bg })
      }
      onClose()
    } catch (e) {
      console.error('create status error:', e)
      setError(e?.message && mode === 'video' ? e.message : 'No se pudo publicar el estado. Probá de nuevo.')
    } finally {
      setSaving(false)
      setProgress(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[310] bg-black flex flex-col" data-no-track>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input id="status-video-input" type="file" accept="video/*" className="hidden" onChange={handleVideoFile} />

      <div className="flex items-center gap-3 px-4 pt-12 pb-3 text-white">
        <button onClick={onClose} aria-label="Cerrar" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <X size={18} />
        </button>
        <p className="flex-1 font-semibold">Nuevo estado</p>
        <p className="text-[11px] text-white/50">Se ve durante 24 h</p>
      </div>

      {!mode && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <button onClick={() => fileRef.current?.click()}
            className="w-full max-w-xs py-5 rounded-3xl bg-white/10 text-white flex items-center justify-center gap-3 text-base font-semibold active:scale-95 transition-all">
            <ImageIcon size={22} /> Foto
          </button>
          {canRecordVideo() && (
            <label htmlFor="status-video-input"
              className="w-full max-w-xs py-5 rounded-3xl bg-white/10 text-white flex items-center justify-center gap-3 text-base font-semibold active:scale-95 transition-all cursor-pointer">
              <Video size={22} /> Video <span className="text-xs font-normal text-white/50">(hasta {MAX_VIDEO_SECONDS} s)</span>
            </label>
          )}
          <button onClick={() => setMode('text')}
            className="w-full max-w-xs py-5 rounded-3xl bg-amber-500 text-white flex items-center justify-center gap-3 text-base font-semibold active:scale-95 transition-all">
            <Type size={22} /> Texto
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}

      {mode === 'image' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex items-center justify-center min-h-0 px-2">
            <img src={image} alt="" className="max-w-full max-h-full object-contain" />
          </div>
          <div className="flex gap-2 px-4 pt-3 pb-8">
            <input
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_TEXT))}
              placeholder="Agregá un texto (opcional)"
              className="flex-1 px-4 py-3 rounded-full bg-white/10 text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button onClick={publish} disabled={saving} aria-label="Publicar estado"
              className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 active:scale-90 transition-all">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          {error && <p className="text-sm text-red-400 text-center pb-4">{error}</p>}
        </div>
      )}

      {mode === 'video' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex items-center justify-center min-h-0 px-2">
            <video ref={videoRef} src={videoUrl} controls playsInline className="max-w-full max-h-full" />
          </div>
          <p className="text-[11px] text-white/50 text-center px-6 pt-2">
            Se publica hasta {MAX_VIDEO_SECONDS} segundos, en calidad reducida para que cargue rápido.
          </p>
          <div className="flex gap-2 px-4 pt-3 pb-8">
            <input
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_TEXT))}
              placeholder="Agregá un texto (opcional)"
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-full bg-white/10 text-white placeholder-white/40 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button onClick={publish} disabled={saving} aria-label="Publicar estado"
              className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 active:scale-90 transition-all">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          {progress && <p className="text-sm text-amber-300 text-center pb-4">{progress}</p>}
          {error && <p className="text-sm text-red-400 text-center pb-4">{error}</p>}
        </div>
      )}

      {mode === 'text' && (
        <div className="flex-1 flex flex-col min-h-0" style={{ background: bg }}>
          <div className="flex-1 flex items-center justify-center px-6">
            <textarea
              autoFocus
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_TEXT))}
              placeholder="Escribí tu estado…"
              rows={5}
              className="w-full bg-transparent text-white text-2xl font-bold text-center placeholder-white/60 outline-none resize-none leading-snug"
            />
          </div>
          <div className="flex items-center gap-2 px-4 pt-3 pb-8">
            <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-none">
              {BACKGROUNDS.map(c => (
                <button key={c} onClick={() => setBg(c)} aria-label="Color de fondo"
                  className={`w-8 h-8 rounded-full flex-shrink-0 border-2 ${bg === c ? 'border-white scale-110' : 'border-white/40'} transition-all`}
                  style={{ background: c }} />
              ))}
            </div>
            <button onClick={publish} disabled={saving || !text.trim()} aria-label="Publicar estado"
              className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center flex-shrink-0 disabled:opacity-50 active:scale-90 transition-all">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          {error && <p className="text-sm text-white text-center pb-4">{error}</p>}
        </div>
      )}
    </div>
  )
}
