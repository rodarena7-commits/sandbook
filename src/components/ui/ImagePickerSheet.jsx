import { useState, useRef } from 'react'
import { X, Upload, Link, Loader2, Image } from 'lucide-react'

// Comprime y devuelve base64 para guardar directo en Firestore (sin Firebase Storage).
// max 800px, JPEG 75% → ~80-180KB como base64 → bien bajo el límite de 1MB de Firestore.
function compressToBase64(file, maxPx = 800, quality = 0.75) {
  return new Promise(resolve => {
    const img = new window.Image()
    const blobUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(blobUrl)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width  * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(null) }
    img.src = blobUrl
  })
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// storagePath se mantiene como prop para compatibilidad pero ya no se usa.
export default function ImagePickerSheet({ title, storagePath: _storagePath, onSave, onClose }) {
  const [mode,         setMode]         = useState(null)   // 'upload' | 'url'
  const [url,          setUrl]          = useState('')
  const [preview,      setPreview]      = useState(null)
  const [file,         setFile]         = useState(null)
  const [fileSize,     setFileSize]     = useState(null)
  const [uploading,    setUploading]    = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [error,        setError]        = useState(null)
  const fileRef = useRef(null)

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('Solo imágenes'); return }
    setFile(f)
    setFileSize(f.size)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  async function handleSave() {
    setError(null)
    setUploading(true)
    try {
      let finalUrl = ''
      if (mode === 'upload' && file) {
        setUploadStatus('Comprimiendo imagen…')
        const base64 = await compressToBase64(file)
        if (!base64) throw new Error('No se pudo procesar la imagen')
        setUploadStatus('Guardando…')
        finalUrl = base64
      } else if (mode === 'url') {
        if (!url.trim()) return
        finalUrl = url.trim()
      }
      await onSave(finalUrl)
      onClose()
    } catch (e) {
      console.error('ImagePickerSheet error:', e)
      setError(`No se pudo guardar la imagen (${e?.message ?? 'error desconocido'})`)
    } finally {
      setUploading(false)
      setUploadStatus('')
    }
  }

  const canSave = (mode === 'upload' && file) || (mode === 'url' && url.trim())

  return (
    <div className="fixed inset-0 z-[70] flex items-end">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-t-3xl shadow-2xl p-5 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <X size={16} />
          </button>
        </div>

        {/* Mode selector */}
        {!mode && (
          <div className="flex flex-col gap-3">
            <button onClick={() => { setMode('upload'); setTimeout(() => fileRef.current?.click(), 100) }}
              className="flex items-center gap-3 px-4 py-4 bg-amber-50 rounded-2xl text-left border border-amber-100 active:bg-amber-100">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Upload size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Subir imagen</p>
                <p className="text-xs text-slate-400">Desde tu galería o cámara</p>
              </div>
            </button>
            <button onClick={() => setMode('url')}
              className="flex items-center gap-3 px-4 py-4 bg-slate-50 rounded-2xl text-left border border-slate-100 active:bg-slate-100">
              <div className="w-10 h-10 bg-slate-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Link size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">URL de imagen</p>
                <p className="text-xs text-slate-400">Pegá un enlace de imagen</p>
              </div>
            </button>
          </div>
        )}

        {/* Upload mode */}
        {mode === 'upload' && (
          <div className="flex flex-col gap-4">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="" className="w-full h-48 object-cover rounded-2xl" />
                <button onClick={() => { setFile(null); setPreview(null); setFileSize(null) }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white">
                  <X size={14} />
                </button>
                {fileSize && (
                  <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {formatSize(fileSize)} → se comprimirá automáticamente
                  </span>
                )}
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-amber-400 hover:text-amber-400 transition-all">
                <Image size={28} />
                <span className="text-xs">Tocá para elegir imagen</span>
              </button>
            )}
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setMode(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-medium">Volver</button>
              <button onClick={handleSave} disabled={!canSave || uploading}
                className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
                {uploading
                  ? <><Loader2 size={14} className="animate-spin" /> {uploadStatus || 'Procesando…'}</>
                  : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* URL mode */}
        {mode === 'url' && (
          <div className="flex flex-col gap-4">
            <input value={url} onChange={e => { setUrl(e.target.value); setError(null) }}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="w-full px-4 py-3 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400" />
            {url.trim() && (
              <img src={url} alt="" className="w-full h-40 object-cover rounded-2xl"
                onError={() => setError('URL no válida o sin acceso')} />
            )}
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setMode(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-medium">Volver</button>
              <button onClick={handleSave} disabled={!canSave || uploading}
                className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
                {uploading ? <><Loader2 size={14} className="animate-spin" /> Guardando…</> : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {error && !mode && <p className="text-xs text-red-400 text-center mt-3">{error}</p>}
      </div>
    </div>
  )
}
