import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

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
