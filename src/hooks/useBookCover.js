import { useState, useEffect } from 'react'
import { getGlobalCover } from './useGlobalMedia'
import { cleanThumbnail } from '../utils/cleanThumbnail'

/**
 * Devuelve la mejor portada disponible para un libro.
 * - Si ya hay una URL válida (no placeholder) → la usa directamente, sin Firestore.
 * - Si no hay imagen → busca en bookCovers/{bookId} una vez.
 */
export function useBookCover(bookId, existingSrc) {
  const clean = cleanThumbnail(existingSrc)
  const [globalSrc, setGlobalSrc] = useState(null)

  useEffect(() => {
    if (clean || !bookId) return
    let cancelled = false
    getGlobalCover(bookId).then(url => {
      if (!cancelled && url) setGlobalSrc(url)
    })
    return () => { cancelled = true }
  }, [bookId, clean])

  return clean || globalSrc || null
}
