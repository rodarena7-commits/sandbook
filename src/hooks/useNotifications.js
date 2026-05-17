import { useState, useEffect } from 'react'
import { collection, doc, onSnapshot, updateDoc, writeBatch, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'

export function useNotifications(uid) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    const q = query(
      collection(db, 'users', uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(30)
    )
    return onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
  }, [uid])

  const unreadCount = notifications.filter(n => !n.read).length

  async function markRead(notifId) {
    await updateDoc(doc(db, 'users', uid, 'notifications', notifId), { read: true })
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.read)
    if (!unread.length) return
    const batch = writeBatch(db)
    unread.forEach(n => batch.update(doc(db, 'users', uid, 'notifications', n.id), { read: true }))
    await batch.commit()
  }

  return { notifications, loading, unreadCount, markRead, markAllRead }
}
