import {
  arrayUnion, collection, doc, getDoc, getDocs, increment, limit, query,
  serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { getConvId } from '../hooks/useConversations'

export const ADMIN_EMAIL = 'rodrigo.n.arena@hotmail.com'

// {nombre} se reemplaza por el nombre del usuario nuevo
export const DEFAULT_WELCOME_TEXT =
`¡Hola {nombre}! Soy Rodrigo, creador y CEO de Sandbook 📚

Te doy la bienvenida y gracias por sumarte a esta comunidad de lectores. Cualquier duda o sugerencia, escribime por acá.

Si alguna vez la app no te funciona bien, podés usar Sandbook desde el navegador:
https://sandbook-5qfn.onrender.com/

¡Felices lecturas!`

const WELCOME_MSG_ID = 'auto_welcome'

// Config en appConfig/settings.autoWelcome = { enabled, text, follow, fromUid }.
// Si todavía no se configuró desde el panel Admin, está activada con el texto por defecto
// y sale de la cuenta del administrador.
async function resolveConfig() {
  const snap = await getDoc(doc(db, 'appConfig', 'settings'))
  const cfg = snap.exists() ? snap.data().autoWelcome || {} : {}
  if (cfg.enabled === false) return null

  let fromUid = cfg.fromUid
  if (!fromUid) {
    const q = query(collection(db, 'users'), where('email', '==', ADMIN_EMAIL), limit(1))
    fromUid = (await getDocs(q)).docs[0]?.id
  }
  if (!fromUid) return null
  return { fromUid, text: cfg.text || DEFAULT_WELCOME_TEXT, follow: cfg.follow !== false }
}

// Se llama una sola vez, cuando se crea el perfil de un usuario nuevo (no invitados).
// Manda el mensaje de bienvenida desde la cuenta del administrador y hace que la siga.
export async function sendAutoWelcome(newUid, newName, newPhoto) {
  try {
    const cfg = await resolveConfig()
    if (!cfg || cfg.fromUid === newUid) return

    const fromSnap = await getDoc(doc(db, 'users', cfg.fromUid))
    if (!fromSnap.exists()) return
    const from = fromSnap.data()

    const convId = getConvId(cfg.fromUid, newUid)
    const msgRef = doc(db, 'conversations', convId, 'messages', WELCOME_MSG_ID)
    if (!(await getDoc(msgRef)).exists()) {
      const firstName = (newName || '').trim().split(/\s+/)[0] || 'lector'
      const text = cfg.text.replace(/\{nombre\}/g, firstName)
      await setDoc(msgRef, { fromUid: cfg.fromUid, text, createdAt: serverTimestamp(), autoWelcome: true })
      await setDoc(doc(db, 'conversations', convId), {
        participants: [cfg.fromUid, newUid],
        names:  { [cfg.fromUid]: from.displayName || 'Sandbook', [newUid]: newName || 'Lector' },
        photos: { [cfg.fromUid]: from.photoURL || null, [newUid]: newPhoto || null },
        lastMessage: text.slice(0, 60),
        lastAt: serverTimestamp(),
        unread: { [newUid]: increment(1) },
      }, { merge: true })
    }

    if (cfg.follow) {
      await Promise.all([
        updateDoc(doc(db, 'users', cfg.fromUid), { following: arrayUnion(newUid) }),
        updateDoc(doc(db, 'users', newUid), { followers: arrayUnion(cfg.fromUid) }),
      ])
    }
  } catch (e) {
    console.warn('auto welcome error:', e)
  }
}
