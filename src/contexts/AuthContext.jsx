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
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [appConfig, setAppConfig] = useState(null)

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

      // Update manifest dynamically
      const manifestEl = document.querySelector("link[rel='manifest']")
      if (manifestEl) {
        const dynamicManifest = {
          name: "Sandbook",
          short_name: "Sandbook",
          description: "Tu compañero de lectura perfecto. Organiza libros, crea planes y conecta con lectores.",
          start_url: "/",
          display: "standalone",
          orientation: "portrait",
          background_color: "#ffffff",
          theme_color: "#4f46e5",
          categories: ["books", "education", "social", "productivity"],
          lang: "es",
          dir: "ltr",
          icons: [
            {
              src: appConfig.logoUrl,
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: appConfig.logoUrl,
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ],
          shortcuts: [
            {
              name: "Añadir libro",
              short_name: "Añadir",
              description: "Escanea o busca un nuevo libro",
              url: "/?source=pwa&action=add",
              icons: [{ src: "/papel.png", sizes: "192x192" }]
            },
            {
              name: "Mi biblioteca",
              short_name: "Biblioteca",
              description: "Ver todos mis libros",
              url: "/?source=pwa&action=library",
              icons: [{ src: "/madera.png", sizes: "192x192" }]
            },
            {
              name: "Plan de lectura",
              short_name: "Plan",
              description: "Crear un nuevo plan de lectura",
              url: "/?source=pwa&action=plan",
              icons: [{ src: "/vidrio.png", sizes: "192x192" }]
            }
          ]
        }
        const stringManifest = JSON.stringify(dynamicManifest)
        const blob = new Blob([stringManifest], { type: 'application/json' })
        const manifestURL = URL.createObjectURL(blob)
        manifestEl.setAttribute('href', manifestURL)
      }
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
    <AuthContext.Provider value={{ user, profile, setProfile, loading, loginWithGoogle, loginAnonymously, registerWithEmail, loginWithEmail, logout, appConfig }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
