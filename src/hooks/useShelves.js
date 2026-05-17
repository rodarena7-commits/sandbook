import { useState, useEffect } from 'react'
import {
  collection, doc, addDoc, deleteDoc, updateDoc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export function useShelves(uid) {
  const [shelves, setShelves] = useState([])

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'shelves'), orderBy('createdAt'))
    return onSnapshot(q, snap =>
      setShelves(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [uid])

  async function createShelf(name) {
    return await addDoc(collection(db, 'users', uid, 'shelves'), {
      name: name.trim(),
      createdAt: serverTimestamp(),
    })
  }

  async function renameShelf(shelfId, name) {
    await updateDoc(doc(db, 'users', uid, 'shelves', shelfId), { name: name.trim() })
  }

  async function deleteShelf(shelfId) {
    await deleteDoc(doc(db, 'users', uid, 'shelves', shelfId))
  }

  return { shelves, createShelf, renameShelf, deleteShelf }
}
