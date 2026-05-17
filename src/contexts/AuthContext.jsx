import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  signOut
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider, facebookProvider } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Cargar o crear perfil en Firestore
        const ref = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setProfile(snap.data())
        } else {
          // Primer login: crear perfil
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
            createdAt: serverTimestamp(),
          }
          await setDoc(ref, newProfile)
          setProfile(newProfile)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  async function loginWithFacebook() {
    await signInWithPopup(auth, facebookProvider)
  }

  async function loginAnonymously() {
    await signInAnonymously(auth)
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading, loginWithGoogle, loginWithFacebook, loginAnonymously, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
