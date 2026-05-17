import { useState, useEffect } from 'react'
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, updateDoc, increment,
  arrayUnion, arrayRemove,
  query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export function usePosts() {
  const [posts, setPosts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(60))
    return onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
  }, [])

  async function createPost(uid, profile, { text, book }) {
    await addDoc(collection(db, 'posts'), {
      uid,
      displayName: profile?.displayName || 'Lector',
      photoURL:    profile?.photoURL    || null,
      text: text.trim(),
      bookId:        book?.bookId        || null,
      bookTitle:     book?.title         || null,
      bookAuthors:   book?.authors       || [],
      bookThumbnail: book?.customThumbnail || book?.thumbnail || null,
      likedBy:   [],
      likeCount: 0,
      createdAt: serverTimestamp(),
    })
  }

  async function toggleLike(postId, uid, liked) {
    const ref = doc(db, 'posts', postId)
    await updateDoc(ref, {
      likedBy:   liked ? arrayRemove(uid) : arrayUnion(uid),
      likeCount: increment(liked ? -1 : 1),
    })
  }

  async function deletePost(postId) {
    await deleteDoc(doc(db, 'posts', postId))
  }

  return { posts, loading, createPost, toggleLike, deletePost }
}
