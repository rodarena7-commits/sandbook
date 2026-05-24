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

  async function createPost(uid, profile, { text, book, authorId, authorName, authorPhotoUrl }) {
    await addDoc(collection(db, 'posts'), {
      uid,
      displayName: profile?.displayName || 'Lector',
      photoURL:    profile?.photoURL    || null,
      text: text.trim(),
      bookId:         book?.bookId          || null,
      bookTitle:      book?.title           || null,
      bookAuthors:    book?.authors         || [],
      bookThumbnail:  book?.customThumbnail || book?.thumbnail || null,
      authorId:       authorId              || null,
      authorName:     authorName            || null,
      authorPhotoUrl: authorPhotoUrl        || null,
      likedBy:   [],
      likeCount: 0,
      createdAt: serverTimestamp(),
    })
  }

  async function updatePost(postId, { text, book, authorId, authorName, authorPhotoUrl }) {
    await updateDoc(doc(db, 'posts', postId), {
      text:           text.trim(),
      bookId:         book?.bookId          || null,
      bookTitle:      book?.title           || null,
      bookAuthors:    book?.authors         || [],
      bookThumbnail:  book?.customThumbnail || book?.thumbnail || null,
      authorId:       authorId              || null,
      authorName:     authorName            || null,
      authorPhotoUrl: authorPhotoUrl        || null,
      editedAt:       serverTimestamp(),
    })
  }

  async function repostPost(uid, profile, originalPost) {
    await addDoc(collection(db, 'posts'), {
      uid,
      displayName: profile?.displayName || 'Lector',
      photoURL:    profile?.photoURL    || null,
      text:        '',
      bookId:         null,
      bookTitle:      null,
      bookAuthors:    [],
      bookThumbnail:  null,
      authorId:       null,
      authorName:     null,
      authorPhotoUrl: null,
      likedBy:   [],
      likeCount: 0,
      repostOf: {
        postId:         originalPost.id,
        uid:            originalPost.uid,
        displayName:    originalPost.displayName,
        photoURL:       originalPost.photoURL       || null,
        text:           originalPost.text,
        bookTitle:      originalPost.bookTitle      || null,
        bookAuthors:    originalPost.bookAuthors    || [],
        bookThumbnail:  originalPost.bookThumbnail  || null,
        authorName:     originalPost.authorName     || null,
        authorPhotoUrl: originalPost.authorPhotoUrl || null,
      },
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

  return { posts, loading, createPost, updatePost, repostPost, toggleLike, deletePost }
}
