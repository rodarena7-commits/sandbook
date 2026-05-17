import { useState, useRef } from 'react'
import { X, Upload, Link, Loader2, Image } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../../firebase'

export default function ImagePickerSheet({ title, storagePath, onSave, onClose }) {
  const [mode, setMode] = useState(null)          // 'upload' | 'url'
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('Solo imágenes'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  async function handleSave() {
    setError(null)
    setUploading(true)
    try {
      let finalUrl = ''
      if (mode === 'upload' && file) {
        const storageRef = ref(storage, storagePath)
        await uploadBytes(storageRef, file)
        finalUrl = await getDownloadURL(storageRef)
      } else if (mode === 'url') {
        if (!url.trim()) return
        finalUrl = url.trim()
      }
      await onSave(finalUrl)
      onClose()
    } catch {
      setError('No se pudo guardar la imagen')
    } finally {
      setUploading(false)
    }
  }

  const canSave = (mode === 'upload' && file) || (mode === 'url' && url.trim())

  return (
    <div className="fixed inset-0 z-[70] flex items-end">
      <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl p-5 pb-10">
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
                <button onClick={() => { setFile(null); setPreview(null) }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-amber-400 hover:text-amber-400 transition-all">
                <Image size={28} />
                <span className="text-xs">Tocá para elegir imagen</span>
              </button>
            )}
            <div className="flex gap-2">
              <button onClick={() => setMode(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-medium">Volver</button>
              <button onClick={handleSave} disabled={!canSave || uploading}
                className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
                {uploading ? <><Loader2 size={14} className="animate-spin" /> Subiendo…</> : 'Guardar'}
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
