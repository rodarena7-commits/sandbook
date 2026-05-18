import { useState } from 'react'
import { BookOpen, Camera } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { saveGlobalCover } from '../../hooks/useGlobalMedia'
import { useBookCover } from '../../hooks/useBookCover'
import ImagePickerSheet from '../ui/ImagePickerSheet'

/**
 * Muestra la portada de un libro.
 * - Si YA tiene imagen: muestra la imagen sola, sin botón de upload.
 * - Si NO tiene imagen: muestra placeholder + ícono de cámara para subir.
 * Al subir se guarda en bookCovers/{bookId} globalmente.
 */
export default function BookCoverUpload({
  bookId, src, title = '', className = '',
  isOwnBook = false, onUpdated,
}) {
  const { user } = useAuth()
  const [localSrc, setLocalSrc]     = useState(null)
  const [imgError, setImgError]     = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  // Carga portada global (bookCovers/{bookId}) si no hay imagen local/propia
  const resolvedSrc = useBookCover(bookId, localSrc || src)
  const displaySrc  = resolvedSrc
  const hasImage    = !!(displaySrc && !imgError)

  async function handleSave(url) {
    setLocalSrc(url)
    setImgError(false)
    await saveGlobalCover(bookId, url, user.uid)
    if (isOwnBook && user?.uid && bookId) {
      await updateDoc(doc(db, 'users', user.uid, 'myBooks', bookId), {
        customThumbnail: url,
      })
    }
    onUpdated?.(url)
  }

  return (
    <>
      {hasImage ? (
        /* Tiene imagen — solo la muestra, sin upload */
        <img
          src={displaySrc}
          alt={title}
          className={`w-full h-full object-cover ${className}`}
          onError={() => setImgError(true)}
        />
      ) : (
        /* Sin imagen — placeholder + botón de cámara */
        <div className={`relative w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-1.5 ${className}`}>
          <BookOpen size={20} className="text-slate-300" />
          {user && (
            <button
              onClick={e => { e.stopPropagation(); setShowPicker(true) }}
              className="flex items-center gap-1 px-2 py-1 bg-amber-500 rounded-full text-white text-[9px] font-semibold shadow-sm active:scale-95 transition-all"
            >
              <Camera size={9} /> Foto
            </button>
          )}
        </div>
      )}

      {showPicker && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[75]" onClick={() => setShowPicker(false)} />
          <div className="fixed inset-0 z-[76] flex items-end">
            <ImagePickerSheet
              title="Portada del libro"
              storagePath={`bookCovers/${bookId}`}
              onSave={handleSave}
              onClose={() => setShowPicker(false)}
            />
          </div>
        </>
      )}
    </>
  )
}
