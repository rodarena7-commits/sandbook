import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useBookPosts(bookId) {
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookId) { setPosts([]); setLoading(false); return }
    const q = query(collection(db, 'posts'), where('bookId', '==', bookId))
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setPosts(list.slice(0, 15))
      setLoading(false)
    }, () => setLoading(false))
  }, [bookId])

  return { posts, loading }
}
