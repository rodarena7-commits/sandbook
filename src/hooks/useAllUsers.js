import { useState, useEffect } from 'react'
import { collection, getDocs, query, limit } from 'firebase/firestore'
import { db } from '../firebase'

export function useAllUsers(myUid) {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!myUid) return
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, 'users'), limit(100)))
        setUsers(
          snap.docs
            .map(d => ({ uid: d.id, ...d.data() }))
            .filter(u => u.uid !== myUid)
        )
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [myUid])

  return { users, loading }
}
