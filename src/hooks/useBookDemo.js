import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export function useBookDemo(bookId) {
  const [demoUrl, setDemoUrl]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!bookId) { setLoading(false); return }
    getDoc(doc(db, 'bookDemos', bookId)).then(snap => {
      if (snap.exists()) setDemoUrl(snap.data().demoUrl || null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [bookId])

  async function saveDemo(url) {
    const clean = url?.trim() || null
    await setDoc(doc(db, 'bookDemos', bookId), { demoUrl: clean, updatedAt: new Date().toISOString() })
    setDemoUrl(clean)
  }

  return { demoUrl, loading, saveDemo }
}
