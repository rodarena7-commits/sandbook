import { useState, useEffect } from 'react'
import {
  collection, doc, setDoc, onSnapshot,
  serverTimestamp, query, orderBy, limit,
} from 'firebase/firestore'
import { db } from '../firebase'

export function useBookReviews(bookId, bookMeta) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookId) return
    const q = query(
      collection(db, 'bookReviews', bookId, 'reviews'),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    return onSnapshot(q, snap => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
  }, [bookId])

  async function submitReview(uid, displayName, photoURL, rating, comment) {
    if (!comment.trim() && !rating) return

    // Write to global book reviews (for community opinions section)
    await setDoc(doc(db, 'bookReviews', bookId, 'reviews', uid), {
      uid, displayName, photoURL: photoURL || null,
      rating: rating || 0,
      comment: comment.trim(),
      createdAt: serverTimestamp(),
    })

    // Write to user's public profile reviews (always visible to others)
    await setDoc(doc(db, 'users', uid, 'publicReviews', bookId), {
      bookId,
      bookTitle:     bookMeta?.title         || '',
      bookAuthors:   bookMeta?.authors       || [],
      bookThumbnail: bookMeta?.customThumbnail || bookMeta?.thumbnail || null,
      rating:  rating || 0,
      comment: comment.trim(),
      updatedAt: serverTimestamp(),
    })
  }

  const withRating = reviews.filter(r => r.rating > 0)
  const avgRating  = withRating.length
    ? withRating.reduce((s, r) => s + r.rating, 0) / withRating.length
    : 0

  return { reviews, loading, submitReview, avgRating }
}
