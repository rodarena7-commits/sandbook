import { useState } from 'react'
import { BookOpen, Camera } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { saveGlobalCover, getGlobalCover } from '../../hooks/useGlobalMedia'
import ImagePickerSheet from '../ui/ImagePickerSheet'

/**
 * Muestra la portada de un libro con botón de upload al hacer hover.
 * Guarda la imagen en bookCovers/{bookId} (global, visible para todos).
 * Si el libro está en la propia biblioteca, también actualiza myBooks.
 *
 * Props:
 *   bookId        — ID del libro (para bookCovers)
 *   src           — URL actual de la portada (puede ser null/undefined)
 *   title         — título del libro (para alt)
 *   className     — clases extra para la imagen/placeholder
 *   isOwnBook     — true si el libro está en la propia biblioteca del viewer
 *   ownerUid      — UID del dueño del libro (para actualizar myBooks si isOwnBook)
 *   onUpdated     — callback(url) al guardar nueva portada
 */
export default function BookCoverUpload({
  bookId, src, title = '', className = '',
  isOwnBook = false, ownerUid = null, onUpdated,
}) {
  const { user } = useAuth()
  // Si isOwnBook pero no se pasó ownerUid, usar el uid del viewer
  const effectiveOwnerUid = ownerUid || (isOwnBook ? user?.uid : null)
  const [localSrc, setLocalSrc]     = useState(null)
  const [imgError, setImgError]     = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const cleanSrc = src && !src.includes('placeholder') ? src : null
  const displaySrc = localSrc || cleanSrc

  async function handleSave(url) {
    setLocalSrc(url)
    setImgError(false)
    // Save globally
    await saveGlobalCover(bookId, url, user.uid)
    // If viewing own book, also update myBooks doc
    if (isOwnBook && effectiveOwnerUid && bookId) {
      await updateDoc(doc(db, 'users', effectiveOwnerUid, 'myBooks', bookId), {
        customThumbnail: url,
      })
    }
    onUpdated?.(url)
  }

  return (
    <>
      <div className="relative group w-full h-full">
        {displaySrc && !imgError ? (
          <img
            src={displaySrc}
            alt={title}
            className={`w-full h-full object-cover ${className}`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`w-full h-full bg-slate-100 flex items-center justify-center ${className}`}>
            <BookOpen size={20} className="text-slate-300" />
          </div>
        )}

        {/* Upload button overlay — visible on hover */}
        {user && (
          <button
            onClick={e => { e.stopPropagation(); setShowPicker(true) }}
            className="absolute inset-0 flex items-end justify-end p-1 bg-black/0 group-hover:bg-black/20 transition-all rounded-[inherit]"
          >
            <span className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all">
              <Camera size={11} className="text-white" />
            </span>
          </button>
        )}
      </div>

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
