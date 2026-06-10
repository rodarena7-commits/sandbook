import { useState, useEffect, useRef } from 'react'
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { incrementBookStat } from './useBookStats'
import { logReadingActivity } from './useStreak'

export function useBooks(uid) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const booksRef = useRef([])

  useEffect(() => {
    if (!uid) { setBooks([]); setLoading(false); return }

    const unsub = onSnapshot(
      collection(db, 'users', uid, 'myBooks'),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''))
        booksRef.current = list
        setBooks(list)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [uid])

  async function addBook(uid, bookId, data) {
    await setDoc(doc(db, 'users', uid, 'myBooks', bookId), {
      bookId,
      ...data,
      addedAt: new Date().toISOString(),
      checkpoints: [],
      rating: 0,
      review: '',
      myReaction: null,
      shelfId: null,
    })
    if (data.status === 'read') await incrementBookStat(bookId, 'readers', 1)
  }

  async function updateStatus(uid, bookId, newStatus) {
    const old = booksRef.current.find(b => b.bookId === bookId)
    await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), { status: newStatus })
    if (old?.status !== newStatus) {
      if (newStatus === 'read') { await incrementBookStat(bookId, 'readers', 1); logReadingActivity(uid) }
      if (old?.status === 'read') await incrementBookStat(bookId, 'readers', -1)
    }
  }

  async function toggleFavorite(uid, bookId, current) {
    await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), { isFavorite: !current })
  }

  async function saveReview(uid, bookId, rating, review) {
    await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), { rating, review })
  }

  async function removeBook(uid, bookId) {
    const old = booksRef.current.find(b => b.bookId === bookId)
    await deleteDoc(doc(db, 'users', uid, 'myBooks', bookId))
    if (old?.status === 'read') await incrementBookStat(bookId, 'readers', -1)
    if (old?.myReaction === 'like') await incrementBookStat(bookId, 'likes', -1)
  }

  async function updateReaction(uid, bookId, newReaction) {
    const old = booksRef.current.find(b => b.bookId === bookId)
    const prev = old?.myReaction || null
    await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), { myReaction: newReaction })
    if (prev === newReaction) return
    if (newReaction === 'like') await incrementBookStat(bookId, 'likes', 1)
    if (prev === 'like')       await incrementBookStat(bookId, 'likes', -1)
  }

  async function assignShelf(uid, bookId, shelfId) {
    await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), { shelfId: shelfId || null })
  }

  async function savePrivateNotes(uid, bookId, notes) {
    await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), { privateNotes: notes })
  }

  async function setCoReader(uid, bookId, coReader) {
    const book = booksRef.current.find(b => b.bookId === bookId)
    const existing = book?.coReaders || []
    if (existing.some(r => r.uid === coReader.uid)) return
    await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), {
      coReaders: [...existing, { uid: coReader.uid, displayName: coReader.displayName || '', photoURL: coReader.photoURL || null }],
    })
  }

  async function removeCoReader(uid, bookId, coReaderUid) {
    const book = booksRef.current.find(b => b.bookId === bookId)
    const updated = (book?.coReaders || []).filter(r => r.uid !== coReaderUid)
    await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), { coReaders: updated })
  }

  async function updateLoanedTo(uid, bookId, name) {
    await updateDoc(doc(db, 'users', uid, 'myBooks', bookId), { loanedTo: name || '' })
  }

  return { books, loading, addBook, updateStatus, toggleFavorite, saveReview, removeBook, updateReaction, assignShelf, savePrivateNotes, setCoReader, removeCoReader, updateLoanedTo }
}
