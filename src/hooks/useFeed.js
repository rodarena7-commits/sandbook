import { useState, useCallback } from 'react'
import {
  collection, doc, getDoc, getDocs,
  query, orderBy, limit,
} from 'firebase/firestore'
import { db } from '../firebase'

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'ahora'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)  return `hace ${d}d`
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function buildAction(book) {
  if (book.status === 'reading') return 'está leyendo'
  if (book.status === 'read')    return book.rating > 0 ? `terminó y le dio ${book.rating}★` : 'terminó'
  if (book.status === 'pending') return 'quiere leer'
  return 'agregó a su biblioteca'
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
            action: buildAction(book),
            time: timeAgo(book.addedAt),
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
