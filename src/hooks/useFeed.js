import { useState, useCallback } from 'react'
import {
  collection, doc, getDoc, getDocs,
  query, orderBy, limit,
} from 'firebase/firestore'
import { db } from '../firebase'

// Texto de la acción en el idioma de quien lee (t de useAuth)
export function feedAction(book, t) {
  if (book.status === 'reading') return t('feed_reading')
  if (book.status === 'read')    return book.rating > 0 ? t('feed_finished_rated', { n: book.rating }) : t('feed_finished')
  if (book.status === 'pending') return t('feed_wants')
  return t('feed_added')
}

export function useFeed(myUid, followingUids = []) {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded]   = useState(false)

  const load = useCallback(async () => {
    if (!followingUids.length) { setItems([]); setLoaded(true); return }
    setLoading(true)

    try {
      const all = []

      await Promise.all(followingUids.map(async uid => {
        const [profileSnap, booksSnap] = await Promise.all([
          getDoc(doc(db, 'users', uid)),
          getDocs(query(
            collection(db, 'users', uid, 'myBooks'),
            orderBy('addedAt', 'desc'),
            limit(5)
          )),
        ])

        if (!profileSnap.exists()) return
        const profile = { uid, ...profileSnap.data() }

        booksSnap.docs.forEach(d => {
          const book = { id: d.id, ...d.data() }
          all.push({
            key: `${uid}-${book.id}`,
            user: profile,
            book,
            addedAt: book.addedAt || '',
          })
        })
      }))

      all.sort((a, b) => b.addedAt.localeCompare(a.addedAt))
      setItems(all)
    } catch (e) {
      setItems([])
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }, [followingUids.join(',')])

  return { items, loading, loaded, load }
}
