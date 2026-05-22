import { useState, useEffect, useCallback } from 'react'
import { doc, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'

// bookLikes/{bookId}_{ownerUid} → { likedBy: [uid, ...] }
export function useBookLikes(bookId, ownerUid, myUid) {
  const [count, setCount]   = useState(0)
  const [liked, setLiked]   = useState(false)
  const [loading, setLoading] = useState(false)

  const docId = bookId && ownerUid ? `${bookId}_${ownerUid}` : null

  useEffect(() => {
    if (!docId) return
    const ref = doc(db, 'bookLikes', docId)
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const likedBy = snap.data().likedBy || []
        setCount(likedBy.length)
        setLiked(myUid ? likedBy.includes(myUid) : false)
      } else {
        setCount(0)
        setLiked(false)
      }
    })
    return unsub
  }, [docId, myUid])

  const toggle = useCallback(async () => {
    if (!myUid || !docId) return
    setLoading(true)
    try {
      const ref = doc(db, 'bookLikes', docId)
      if (liked) {
        await updateDoc(ref, { likedBy: arrayRemove(myUid) })
      } else {
        await setDoc(ref, { likedBy: arrayUnion(myUid) }, { merge: true })
      }
    } finally {
      setLoading(false)
    }
  }, [docId, myUid, liked])

  return { count, liked, loading, toggle }
}
