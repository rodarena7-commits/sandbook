import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'

export function useBookStats(bookId) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!bookId) return
    return onSnapshot(doc(db, 'bookStats', bookId), snap => {
      const d = snap.exists() ? snap.data() : {}
      setStats({
        likes:     d.likes     || 0,
        readers:   d.readers   || 0,
        likedBy:   d.likedBy   || [],
        readingBy: d.readingBy || [],
      })
    })
  }, [bookId])

  return stats
}

export async function incrementBookStat(bookId, field, delta) {
  if (!bookId || delta === 0) return
  await setDoc(doc(db, 'bookStats', bookId), { [field]: increment(delta) }, { merge: true })
}

// Mantiene el roster global de quién likeó / quién está leyendo cada libro
// (mismo doc que los contadores, para no sumar un listener más por libro).
export async function setBookRoster(bookId, field, uid, add) {
  if (!bookId || !uid) return
  await setDoc(doc(db, 'bookStats', bookId), { [field]: add ? arrayUnion(uid) : arrayRemove(uid) }, { merge: true })
}
