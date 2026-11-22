import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp,
  Timestamp, updateDoc, where,
} from 'firebase/firestore'
import { db } from '../firebase'
import StatusViewer from '../components/status/StatusViewer'
import CreateStatusSheet from '../components/status/CreateStatusSheet'

// Estados de 24 h. statuses/{id} = {
//   uid, name, photo, type: 'image' | 'text', image, text, bg, createdAt, expiresAt,
//   views: { [uid]: { name, photo, at } }
// }
// expiresAt permite activar una política TTL en Firestore para borrarlos solos.

export const STATUS_HOURS = 24

const StatusContext = createContext(null)

function millis(ts) {
  return ts?.toMillis?.() || (ts?.seconds || 0) * 1000
}

export function StatusProvider({ user, profile, children }) {
  const [statuses, setStatuses] = useState([])
  const [now, setNow]           = useState(Date.now())
  const [viewer, setViewer]     = useState(null)    // { queue: [uid...], index }
  const [creating, setCreating] = useState(false)

  const myUid = user?.uid

  // Estados vigentes de todos (un solo filtro de rango: no necesita índice compuesto)
  useEffect(() => {
    if (!myUid) return
    const q = query(collection(db, 'statuses'), where('expiresAt', '>', Timestamp.now()))
    return onSnapshot(q, snap => {
      setStatuses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, err => console.error('statuses error:', err))
  }, [myUid])

  // Los que van venciendo desaparecen sin recargar
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 60 * 1000)
    return () => clearInterval(i)
  }, [])

  // Limpieza: borra mis estados vencidos
  useEffect(() => {
    if (!myUid) return
    getDocs(query(collection(db, 'statuses'), where('uid', '==', myUid)))
      .then(snap => snap.docs
        .filter(d => millis(d.data().expiresAt) < Date.now())
        .forEach(d => deleteDoc(d.ref).catch(() => {})))
      .catch(() => {})
  }, [myUid])

  const byUser = useMemo(() => {
    const map = {}
    statuses
      .filter(s => millis(s.expiresAt) > now)
      .sort((a, b) => millis(a.createdAt) - millis(b.createdAt))
      .forEach(s => { (map[s.uid] = map[s.uid] || []).push(s) })
    return map
  }, [statuses, now])

  function hasStatus(uid) {
    return !!byUser[uid]?.length
  }

  function allSeen(uid) {
    if (uid === myUid) return true
    return (byUser[uid] || []).every(s => s.views?.[myUid])
  }

  // Orden de la fila de estados: yo, después los no vistos, después los vistos
  const queue = useMemo(() => {
    const others = Object.keys(byUser).filter(u => u !== myUid)
    const lastAt = u => millis(byUser[u][byUser[u].length - 1].createdAt)
    const unseen = others.filter(u => !allSeen(u)).sort((a, b) => lastAt(b) - lastAt(a))
    const seen   = others.filter(u => allSeen(u)).sort((a, b) => lastAt(b) - lastAt(a))
    return [...(byUser[myUid] ? [myUid] : []), ...unseen, ...seen]
  }, [byUser, myUid])

  function openStatuses(uid, fromQueue = false) {
    if (!hasStatus(uid)) return
    if (fromQueue) setViewer({ queue, index: Math.max(0, queue.indexOf(uid)) })
    else setViewer({ queue: [uid], index: 0 })
  }

  async function createStatus({ type, image = null, text = '', bg = null }) {
    if (!myUid) return
    const nowMs = Date.now()
    await addDoc(collection(db, 'statuses'), {
      uid: myUid,
      name: profile?.displayName || 'Lector',
      photo: profile?.photoURL || null,
      type, image, text: text.trim(), bg,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(nowMs + STATUS_HOURS * 60 * 60 * 1000),
      views: {},
    })
  }

  async function deleteStatus(id) {
    await deleteDoc(doc(db, 'statuses', id))
  }

  function markSeen(status) {
    if (!myUid || status.uid === myUid || status.views?.[myUid]) return
    updateDoc(doc(db, 'statuses', status.id), {
      [`views.${myUid}`]: { name: profile?.displayName || 'Lector', photo: profile?.photoURL || null, at: Date.now() },
    }).catch(() => {})
  }

  const value = {
    myUid, byUser, queue, hasStatus, allSeen, openStatuses,
    openCreate: () => setCreating(true), deleteStatus,
  }

  return (
    <StatusContext.Provider value={value}>
      {children}
      {viewer && (
        <StatusViewer
          queue={viewer.queue}
          startIndex={viewer.index}
          byUser={byUser}
          myUid={myUid}
          onSeen={markSeen}
          onDelete={deleteStatus}
          onClose={() => setViewer(null)}
        />
      )}
      {creating && (
        <CreateStatusSheet onCreate={createStatus} onClose={() => setCreating(false)} />
      )}
    </StatusContext.Provider>
  )
}

const FALLBACK = {
  myUid: null, byUser: {}, queue: [], hasStatus: () => false, allSeen: () => true,
  openStatuses: () => {}, openCreate: () => {}, deleteStatus: async () => {},
}

export function useStatuses() {
  return useContext(StatusContext) || FALLBACK
}
