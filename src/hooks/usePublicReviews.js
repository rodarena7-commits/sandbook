import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'

export function usePublicReviews(uid) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(db, 'users', uid, 'publicReviews'),
      orderBy('updatedAt', 'desc'),
      limit(30)
    )
    return onSnapshot(q, snap => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.rating > 0 || r.comment))
      setLoading(false)
    }, () => setLoading(false))
  }, [uid])

  return { reviews, loading }
}
