import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'
import { Capacitor } from '@capacitor/core'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [appConfig, setAppConfig] = useState(null)

  // Initialize GoogleAuth on native platforms
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      try {
        GoogleAuth.initialize({
          clientId: '85202851148-ptag30ivne7p8sedc9ktd7fb7t7l7smf.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        })
      } catch (err) {
        console.error('Error initializing GoogleAuth:', err)
      }
    }
  }, [])

  // Real-time app config listener
  useEffect(() => {
    const unsubConfig = onSnapshot(
      doc(db, 'appConfig', 'settings'),
      (snap) => {
        if (snap.exists()) {
          setAppConfig(snap.data())
        } else {
          setAppConfig(null)
        }
      },
      (err) => console.error('Error fetching app settings:', err)
    )
    return () => unsubConfig()
  }, [])

  // Dynamically update favicon, app icons and manifest in HTML DOM
  useEffect(() => {
    if (appConfig?.logoUrl) {
      // Update link[rel="icon"]
      const icons = document.querySelectorAll("link[rel='icon']")
      icons.forEach(el => el.setAttribute('href', appConfig.logoUrl))

      // Update link[rel="apple-touch-icon"]
      const appleIcons = document.querySelectorAll("link[rel='apple-touch-icon']")
      appleIcons.forEach(el => el.setAttribute('href', appConfig.logoUrl))
    }
  }, [appConfig?.logoUrl])

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
    if (Capacitor.isNativePlatform()) {
      // Usamos GoogleAuth (SDK clásico) en lugar de One Tap para evitar el error 16
      const googleUser = await GoogleAuth.signIn()
      const idToken = googleUser?.authentication?.idToken
      if (!idToken) {
        throw new Error('No se recibió el token de Google. Intentá de nuevo.')
      }
      const credential = GoogleAuthProvider.credential(idToken)
      await signInWithCredential(auth, credential)
    } else {
      await signInWithPopup(auth, googleProvider)
    }
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
    <AuthContext.Provider value={{ user, profile, setProfile, loading, loginWithGoogle, loginAnonymously, registerWithEmail, loginWithEmail, logout, appConfig }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
