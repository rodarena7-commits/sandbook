import { useState, useEffect } from 'react'
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, getDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

// ── Listados ───────────────────────────────────────────────

export function useMarketplace() {
  const [listings, setListings] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'marketplace'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setListings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
  }, [])

  return { listings, loading }
}

export async function createListing(uid, profile, data) {
  return await addDoc(collection(db, 'marketplace'), {
    uid,
    displayName: profile?.displayName || 'Lector',
    photoURL:    profile?.photoURL    || null,
    bookTitle:   data.bookTitle,
    bookAuthor:  data.bookAuthor  || '',
    bookImage:   data.bookImage   || null,
    description: data.description || '',
    price:       Number(data.price),
    currency:    data.currency    || 'ARS',
    status:      'active',
    createdAt:   serverTimestamp(),
  })
}

export async function deleteListing(listingId) {
  await deleteDoc(doc(db, 'marketplace', listingId))
}

export async function markAsSold(listingId) {
  await updateDoc(doc(db, 'marketplace', listingId), { status: 'sold' })
}

// ── Comentarios ────────────────────────────────────────────

export function useListingComments(listingId) {
  const [comments, setComments] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!listingId) return
    const q = query(
      collection(db, 'marketplace', listingId, 'comments'),
      orderBy('createdAt', 'asc'),
    )
    return onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
  }, [listingId])

  return { comments, loading }
}

export async function addComment(listingId, uid, profile, text) {
  await addDoc(collection(db, 'marketplace', listingId, 'comments'), {
    uid,
    displayName: profile?.displayName || 'Lector',
    photoURL:    profile?.photoURL    || null,
    text:        text.trim(),
    createdAt:   serverTimestamp(),
  })
}

export async function deleteComment(listingId, commentId) {
  await deleteDoc(doc(db, 'marketplace', listingId, 'comments', commentId))
}
