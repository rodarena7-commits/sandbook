import { useState, useEffect } from 'react'
import {
  collection, addDoc, onSnapshot,
  query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

// Thread path: users/{ownerUid}/bookThreads/{bookId}/messages
export function useBookThread(ownerUid, bookId, enabled = false) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (!enabled || !ownerUid || !bookId) return
    setLoading(true)
    const q = query(
      collection(db, 'users', ownerUid, 'bookThreads', bookId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    )
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [ownerUid, bookId, enabled])

  async function postMessage(fromUid, fromName, fromPhoto, text) {
    if (!text.trim()) return
    await addDoc(
      collection(db, 'users', ownerUid, 'bookThreads', bookId, 'messages'),
      {
        fromUid,
        fromName:  fromName  || 'Lector',
        fromPhoto: fromPhoto || null,
        text: text.trim(),
        createdAt: serverTimestamp(),
      }
    )
  }

  return { messages, loading, postMessage }
}
