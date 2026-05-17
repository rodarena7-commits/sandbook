import { useState, useEffect } from 'react'
import {
  collection, doc, getDoc, setDoc, addDoc, updateDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, increment,
} from 'firebase/firestore'
import { db } from '../firebase'

export function getConvId(uid1, uid2) {
  return [uid1, uid2].sort().join('_')
}

export function useConversations(uid) {
  const [convs, setConvs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid),
      orderBy('lastAt', 'desc')
    )
    return onSnapshot(q, snap => {
      setConvs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
  }, [uid])

  const totalUnread = convs.reduce((s, c) => s + (c.unread?.[uid] || 0), 0)

  async function canMessage(fromUid, toUid, fromProfile) {
    const snap = await getDoc(doc(db, 'users', toUid))
    if (!snap.exists()) return false
    const target = snap.data()
    const privacy = target.messagingPrivacy || 'everyone'
    if (privacy === 'nobody') return false
    if (privacy === 'everyone') return true
    if (privacy === 'followers') return (target.followers || []).includes(fromUid)
    if (privacy === 'following') return (fromProfile?.following || []).includes(toUid)
    return true
  }

  async function sendMessage(fromUid, fromProfile, toUid, toProfile, text) {
    const convId = getConvId(fromUid, toUid)
    const convRef = doc(db, 'conversations', convId)

    const msg = {
      fromUid,
      text: text.trim(),
      createdAt: serverTimestamp(),
    }
    await addDoc(collection(db, 'conversations', convId, 'messages'), msg)

    await setDoc(convRef, {
      participants: [fromUid, toUid],
      names: {
        [fromUid]: fromProfile?.displayName || 'Lector',
        [toUid]:   toProfile?.displayName   || 'Lector',
      },
      photos: {
        [fromUid]: fromProfile?.photoURL || null,
        [toUid]:   toProfile?.photoURL   || null,
      },
      lastMessage: text.trim().slice(0, 60),
      lastAt: serverTimestamp(),
      unread: { [toUid]: increment(1) },
    }, { merge: true })
  }

  async function markRead(convId, uid) {
    await updateDoc(doc(db, 'conversations', convId), {
      [`unread.${uid}`]: 0,
    })
  }

  return { convs, loading, totalUnread, canMessage, sendMessage, markRead }
}
