import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let heartbeat = null
    let currentUid = null

    async function setOnline(uid, online) {
      try {
        await updateDoc(doc(db, 'users', uid), {
          isOnline: online,
          lastSeen: serverTimestamp(),
        })
      } catch {}
    }

    function startHeartbeat(uid) {
      heartbeat = setInterval(() => setOnline(uid, true), 2 * 60 * 1000)
    }

    const handleUnload = () => {
      if (currentUid) setOnline(currentUid, false)
    }
    const handleVisibility = () => {
      if (!currentUid) return
      if (document.hidden) setOnline(currentUid, false)
      else setOnline(currentUid, true)
    }
    window.addEventListener('beforeunload', handleUnload)
    document.addEventListener('visibilitychange', handleVisibility)

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (heartbeat) { clearInterval(heartbeat); heartbeat = null }

      if (firebaseUser) {
        currentUid = firebaseUser.uid
        setUser(firebaseUser)
        const ref = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setProfile(snap.data())
          setOnline(firebaseUser.uid, true)
        } else {
          const newProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Lector',
            photoURL: firebaseUser.photoURL || null,
            email: firebaseUser.email || null,
            bio: '',
            booksRead: 0,
            totalPages: 0,
            followers: [],
            following: [],
            isOnline: true,
            lastSeen: serverTimestamp(),
            createdAt: serverTimestamp(),
          }
          await setDoc(ref, newProfile)
          setProfile(newProfile)
        }
        startHeartbeat(firebaseUser.uid)
      } else {
        if (currentUid) setOnline(currentUid, false)
        currentUid = null
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      unsub()
      if (heartbeat) clearInterval(heartbeat)
      window.removeEventListener('beforeunload', handleUnload)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  async function loginAnonymously() {
    await signInAnonymously(auth)
  }

  async function registerWithEmail(name, email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    // Forzar que onAuthStateChanged recrea el perfil con el displayName correcto
    const ref = doc(db, 'users', cred.user.uid)
    const newProfile = {
      uid:         cred.user.uid,
      displayName: name,
      photoURL:    null,
      email,
      bio:         '',
      booksRead:   0,
      totalPages:  0,
      followers:   [],
      following:   [],
      createdAt:   serverTimestamp(),
    }
    await setDoc(ref, newProfile)
    setProfile(newProfile)
  }

  async function loginWithEmail(email, password) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { isOnline: false, lastSeen: serverTimestamp() })
      } catch {}
    }
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading, loginWithGoogle, loginAnonymously, registerWithEmail, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
