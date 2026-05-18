import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

// ── Book Covers ────────────────────────────────────────────
export async function getGlobalCover(bookId) {
  if (!bookId) return null
  try {
    const snap = await getDoc(doc(db, 'bookCovers', bookId))
    return snap.exists() ? snap.data().url : null
  } catch { return null }
}

export async function saveGlobalCover(bookId, url, uid) {
  await setDoc(doc(db, 'bookCovers', bookId), {
    url,
    uploadedBy: uid,
    updatedAt:  new Date().toISOString(),
  })
}

// ── Author Photos ──────────────────────────────────────────
function authorKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 80)
}

export async function getGlobalAuthorPhoto(authorName) {
  if (!authorName) return null
  try {
    const snap = await getDoc(doc(db, 'authorPhotos', authorKey(authorName)))
    return snap.exists() ? snap.data().url : null
  } catch { return null }
}

export async function saveGlobalAuthorPhoto(authorName, url, uid) {
  await setDoc(doc(db, 'authorPhotos', authorKey(authorName)), {
    url,
    name:       authorName,
    uploadedBy: uid,
    updatedAt:  new Date().toISOString(),
  })
}

// ── Generic upload to Storage + return URL ─────────────────
export async function uploadToStorage(path, file) {
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return await getDownloadURL(storageRef)
}
