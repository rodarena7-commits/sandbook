import { useState, useCallback } from 'react'
import {
  collection, doc, getDocs, getDoc,
  updateDoc, arrayUnion, arrayRemove,
  query, where, orderBy, limit, startAt, endAt,
} from 'firebase/firestore'
import { db } from '../firebase'

export function useUsers(myUid, myProfile, setProfile) {
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [followingUsers, setFollowingUsers] = useState([])
  const [followingLoading, setFollowingLoading] = useState(false)

  const searchUsers = useCallback(async (q) => {
    const trimmed = q.trim()
    if (!trimmed) { setSearchResults([]); return }

    setSearchLoading(true)
    try {
      const q1 = query(
        collection(db, 'users'),
        orderBy('displayName'),
        startAt(trimmed),
        endAt(trimmed + ''),
        limit(20)
      )
      const snap = await getDocs(q1)
      const users = snap.docs
        .map(d => ({ uid: d.id, ...d.data() }))
        .filter(u => u.uid !== myUid)
      setSearchResults(users)
    } catch {
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [myUid])

  async function loadFollowing() {
    const uids = myProfile?.following || []
    if (uids.length === 0) { setFollowingUsers([]); return }

    setFollowingLoading(true)
    try {
      const docs = await Promise.all(uids.map(uid => getDoc(doc(db, 'users', uid))))
      const users = docs.filter(d => d.exists()).map(d => ({ uid: d.id, ...d.data() }))

      // Load current book for each user
      const withBooks = await Promise.all(users.map(async u => {
        try {
          const booksSnap = await getDocs(
            query(collection(db, 'users', u.uid, 'myBooks'), where('status', '==', 'reading'), limit(1))
          )
          const reading = booksSnap.docs[0]?.data() || null
          return { ...u, currentBook: reading }
        } catch {
          return { ...u, currentBook: null }
        }
      }))

      setFollowingUsers(withBooks)
    } catch {
      setFollowingUsers([])
    } finally {
      setFollowingLoading(false)
    }
  }

  async function canReceiveNotifications(uid) {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? snap.data().notificationsEnabled !== false : true
  }

  async function getUserBooks(uid) {
    const snap = await getDocs(collection(db, 'users', uid, 'myBooks'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''))
  }

  async function followUser(theirUid) {
    await Promise.all([
      updateDoc(doc(db, 'users', myUid), { following: arrayUnion(theirUid) }),
      updateDoc(doc(db, 'users', theirUid), { followers: arrayUnion(myUid) }),
    ])
    setProfile(p => ({ ...p, following: [...(p?.following || []), theirUid] }))
  }

  async function unfollowUser(theirUid) {
    await Promise.all([
      updateDoc(doc(db, 'users', myUid), { following: arrayRemove(theirUid) }),
      updateDoc(doc(db, 'users', theirUid), { followers: arrayRemove(myUid) }),
    ])
    setProfile(p => ({ ...p, following: (p?.following || []).filter(u => u !== theirUid) }))
    setFollowingUsers(prev => prev.filter(u => u.uid !== theirUid))
  }

  return {
    searchResults, searchLoading, searchUsers,
    followingUsers, followingLoading, loadFollowing,
    getUserBooks, followUser, unfollowUser,
  }
}
