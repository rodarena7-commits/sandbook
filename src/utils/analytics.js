import { collection, doc, writeBatch, updateDoc, increment, serverTimestamp, Timestamp } from 'firebase/firestore'
import { Capacitor } from '@capacitor/core'
import { db } from '../firebase'

// Registro de actividad para el panel de administración.
// Cada evento va a activity/{id}: { uid, name, type, ...detalle, screen, platform, ts, expireAt }.
// No se registra el contenido de los mensajes privados.
// expireAt permite activar una política TTL en Firestore para borrar eventos viejos solos.

const FLUSH_MS        = 8000
const FLUSH_MAX       = 15
const RETENTION_DAYS  = 90
const NEW_SESSION_MS  = 30 * 60 * 1000   // volver después de 30 min en segundo plano cuenta como otra entrada

const platform = Capacitor.isNativePlatform() ? 'android' : 'web'

let uid = null
let name = null
let screen = null
let queue = []
let timer = null
let sessionUid = null
let hiddenAt = null
let installed = false

function flush() {
  clearTimeout(timer)
  timer = null
  if (!queue.length) return
  const events = queue
  queue = []
  const batch = writeBatch(db)
  events.forEach(e => batch.set(doc(collection(db, 'activity')), e))
  batch.commit().catch(err => console.warn('analytics flush error:', err))
}

function schedule() {
  if (queue.length >= FLUSH_MAX) flush()
  else if (!timer) timer = setTimeout(flush, FLUSH_MS)
}

export function track(type, detail = {}) {
  if (!uid) return
  const now = Date.now()
  const event = {
    uid, name, type, ...detail,
    screen: detail.screen ?? screen,
    platform,
    ts: Timestamp.fromMillis(now),
    expireAt: Timestamp.fromMillis(now + RETENTION_DAYS * 24 * 60 * 60 * 1000),
  }
  // Búsquedas mientras se escribe: nos quedamos sólo con la última de la ráfaga
  const last = queue[queue.length - 1]
  if (type === 'search' && last?.type === 'search' && last.source === event.source &&
      now - last.ts.toMillis() < 3000) {
    queue[queue.length - 1] = event
  } else {
    queue.push(event)
  }
  schedule()
}

export function trackScreen(name) {
  if (!name || name === screen) return
  screen = name
  track('screen', { screen: name })
}

function startSession() {
  if (!uid) return
  track('session')
  flush()   // la entrada se guarda enseguida: si la app se cierra rápido no se pierde
  updateDoc(doc(db, 'users', uid), {
    sessionCount: increment(1),
    lastSessionAt: serverTimestamp(),
  }).catch(() => {})
}

// Texto visible del botón tocado, acotado
function labelOf(el) {
  const raw = el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || ''
  return raw.replace(/\s+/g, ' ').trim().slice(0, 50)
}

function onClick(e) {
  const el = e.target?.closest?.('button, a, [role="button"]')
  if (!el || el.closest('[data-no-track]')) return
  const label = labelOf(el)
  if (label) track('tap', { label })
}

function onVisibility() {
  if (document.hidden) {
    hiddenAt = Date.now()
    flush()
  } else if (hiddenAt && Date.now() - hiddenAt > NEW_SESSION_MS) {
    hiddenAt = null
    startSession()
  }
}

function install() {
  if (installed) return
  installed = true
  document.addEventListener('click', onClick, true)
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', flush)
}

// Llamar al iniciar/cerrar sesión. Cuenta una "entrada" por cada vez que se abre la app.
export function setAnalyticsUser(user, displayName) {
  if (!user) {
    flush()
    uid = null
    name = null
    sessionUid = null
    return
  }
  install()
  uid = user.uid
  name = displayName || user.displayName || 'Lector'
  if (sessionUid !== uid) {
    sessionUid = uid
    startSession()
  }
}
