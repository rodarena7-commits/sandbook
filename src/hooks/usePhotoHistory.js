import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

// Historial de fotos de perfil: users/{uid}/photoHistory/{id} = { url, replacedAt }.
// Va en una subcolección (no en el documento del usuario) porque las fotos son base64
// y el documento del usuario se lee en muchas pantallas.

const MAX_HISTORY = 30

export async function savePhotoWithHistory(uid, newUrl, previousUrl) {
  if (previousUrl && previousUrl !== newUrl) {
    await addDoc(collection(db, 'users', uid, 'photoHistory'), {
      url: previousUrl,
      replacedAt: serverTimestamp(),
    })
  }
  await updateDoc(doc(db, 'users', uid), { photoURL: newUrl })
}

export async function loadPhotoHistory(uid) {
  const snap = await getDocs(query(
    collection(db, 'users', uid, 'photoHistory'),
    orderBy('replacedAt', 'desc'),
    limit(MAX_HISTORY),
  ))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function deletePhotoFromHistory(uid, id) {
  await deleteDoc(doc(db, 'users', uid, 'photoHistory', id))
}
