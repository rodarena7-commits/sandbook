import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

export async function logReadingActivity(uid) {
  if (!uid) return
  const today = new Date().toISOString().slice(0, 10)
  const ref   = doc(db, 'users', uid)
  const snap  = await getDoc(ref)
  const data  = snap.data() || {}

  if (data.lastReadDate === today) return

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const current   = data.currentStreak || 0
  const newStreak = data.lastReadDate === yesterday ? current + 1 : 1
  const longest   = Math.max(newStreak, data.longestStreak || 0)

  await updateDoc(ref, {
    lastReadDate:   today,
    currentStreak:  newStreak,
    longestStreak:  longest,
  })
}
