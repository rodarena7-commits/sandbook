import { useState, useEffect } from 'react'
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export function useFavoriteAuthors(uid) {
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'favoriteAuthors'), orderBy('addedAt', 'desc'))
    return onSnapshot(q, snap => {
      setAuthors(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
  }, [uid])

  async function addFavoriteAuthor(author) {
    const id = author.olid || author.name.replace(/\s+/g, '_').toLowerCase()
    await setDoc(doc(db, 'users', uid, 'favoriteAuthors', id), {
      olid:      author.olid     || null,
      name:      author.name,
      photoUrl:  author.photoUrl || null,
      topWork:   author.topWork  || null,
      workCount: author.workCount|| 0,
      addedAt:   serverTimestamp(),
    })
  }

  async function removeFavoriteAuthor(id) {
    await deleteDoc(doc(db, 'users', uid, 'favoriteAuthors', id))
  }

  function isFavorite(olid, name) {
    return authors.some(a => (olid && a.olid === olid) || a.name === name)
  }

  return { authors, loading, addFavoriteAuthor, removeFavoriteAuthor, isFavorite }
}
