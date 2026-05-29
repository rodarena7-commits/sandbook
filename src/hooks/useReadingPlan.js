import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { db } from '../firebase'
import { logReadingActivity } from './useStreak'

export function calculatePlan(totalPages, totalDays) {
  const daily = Math.ceil(totalPages / totalDays)
  return Array.from({ length: Number(totalDays) }, (_, i) => {
    const start = i * daily + 1
    const end   = Math.min((i + 1) * daily, Number(totalPages))
    return { day: i + 1, start, end, pages: end - start + 1 }
  })
}

export async function createReadingPlan(uid, bookId, totalPages, totalDays) {
  const startDate = new Date().toISOString().slice(0, 10)
  await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), {
    readingPlan: {
      totalPages: Number(totalPages),
      totalDays:  Number(totalDays),
      dailyPages: Math.ceil(totalPages / totalDays),
      startDate,
      createdAt: new Date().toISOString(),
    },
    planDays:    {},
    currentPage: 0,
    planNote:    '',
  })
}

export async function updatePlanDay(uid, bookId, day, data) {
  await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), {
    [`planDays.${day}`]: data,
  })
  if (data?.checked) logReadingActivity(uid)
}

export async function savePlanMeta(uid, bookId, field, value) {
  await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), { [field]: value })
}

export async function deleteReadingPlan(uid, bookId) {
  await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), {
    readingPlan: null,
    planDays:    null,
    currentPage: 0,
    planNote:    '',
  })
}

// ── Relax Plan ─────────────────────────────────────────────

export async function createRelaxPlan(uid, bookId, totalPages) {
  await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), {
    relaxPlan: {
      totalPages: Number(totalPages) || 0,
      createdAt: new Date().toISOString(),
    },
    currentPage:  0,
    dailyHistory: {},
    relaxNotes:   {},
    relaxNote:    '',
  })
}

export async function updateRelaxPage(uid, bookId, newPage) {
  const today = new Date().toISOString().slice(0, 10)
  await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), {
    currentPage: Number(newPage),
    [`dailyHistory.${today}.endPage`]: Number(newPage),
  })
  logReadingActivity(uid)
}

export async function addRelaxNote(uid, bookId, id, page, text) {
  await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), {
    [`relaxNotes.${id}`]: { page: Number(page) || 0, text, createdAt: new Date().toISOString() },
  })
}

export async function deleteRelaxNote(uid, bookId, noteId) {
  await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), {
    [`relaxNotes.${noteId}`]: deleteField(),
  })
}

export async function deleteRelaxPlan(uid, bookId) {
  await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), {
    relaxPlan:    deleteField(),
    dailyHistory: deleteField(),
    relaxNotes:   deleteField(),
    relaxNote:    '',
    currentPage:  0,
  })
}
