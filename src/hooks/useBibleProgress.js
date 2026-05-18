import { doc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export function isBibleBook(book) {
  const t = (book?.title || '').toLowerCase()
  return t.includes('biblia') || t.includes('bible') ||
         t.includes('santa biblia') || t.includes('sagrada escritura') ||
         t.includes('holy bible')
}

export async function initBiblePlan(uid, bookId) {
  await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), {
    biblePlan:     true,
    bibleProgress: {},
    currentVerse:  '',
    planNote:      '',
  })
}

export async function deleteBiblePlan(uid, bookId) {
  await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), {
    biblePlan:     null,
    bibleProgress: null,
    currentVerse:  '',
    planNote:      '',
  })
}

// Save completed chapters for one Bible book (bookIdx = 0–65)
export async function saveBookProgress(uid, bookId, bookIdx, completed, note) {
  await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), {
    [`bibleProgress.${bookIdx}`]: { completed, note: note ?? '' },
  })
}

export async function saveBibleMeta(uid, bookId, field, value) {
  await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), { [field]: value })
}

// Total chapters completed across the whole Bible
export function countCompleted(bibleProgress = {}) {
  return Object.values(bibleProgress).reduce((s, v) => s + (v?.completed?.length || 0), 0)
}

// Total chapters in the Bible (calculated from bibleBooks)
export const TOTAL_CHAPTERS = 1189
