import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore'
import { db } from '../firebase'

export function useBookStats(bookId) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!bookId) return
    return onSnapshot(doc(db, 'bookStats', bookId), snap => {
      setStats(snap.exists() ? snap.data() : { likes: 0, readers: 0 })
    })
  }, [bookId])

  return stats
}

export async function incrementBookStat(bookId, field, delta) {
  if (!bookId || delta === 0) return
  await setDoc(doc(db, 'bookStats', bookId), { [field]: increment(delta) }, { merge: true })
}
