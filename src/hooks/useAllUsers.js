import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, limit } from 'firebase/firestore'
import { db } from '../firebase'

const ONLINE_THRESHOLD_MS = 3 * 60 * 1000 // 3 minutos

function isUserOnline(userData) {
  if (userData.isOnline === false) return false
  if (!userData.lastSeen) return false
  const ms = userData.lastSeen?.toMillis
    ? userData.lastSeen.toMillis()
    : (userData.lastSeen?.seconds || 0) * 1000
  return Date.now() - ms < ONLINE_THRESHOLD_MS
}

export function useAllUsers(myUid) {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!myUid) return
    const q = query(collection(db, 'users'), limit(200))
    const unsub = onSnapshot(q, snap => {
      setUsers(
        snap.docs
          .map(d => ({ uid: d.id, ...d.data(), online: isUserOnline(d.data()) }))
          .filter(u => u.uid !== myUid)
      )
      setLoading(false)
    })
    return unsub
  }, [myUid])

  return { users, loading }
}
