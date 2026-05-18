/**
 * Script de migración para Sandbook — ejecutar UNA VEZ:
 *
 *   1. Descargá la clave de servicio desde:
 *      Firebase Console → Configuración del proyecto → Cuentas de servicio
 *      → "Generar nueva clave privada" → guardala como scripts/serviceAccount.json
 *
 *   2. Instalar dependencias (solo la primera vez):
 *      cd "scripts" && npm install
 *
 *   3. Ejecutar desde la raíz del proyecto:
 *      node scripts/migrateUsers.mjs
 *
 * ¿Qué hace?
 *   ✓ Elimina el usuario simulado fake_user_maria_garcia_001
 *   ✓ Solo procesa usuarios de Sandbook (los que tienen myBooks guardados)
 *   ✓ No toca usuarios de otras apps (outlet-Roma, pijamas.store, etc.)
 *   ✓ No duplica perfiles que ya existen
 *   ✓ No modifica Firebase Auth — los usuarios siguen pudiendo loguearse
 *   ✓ Sus libros y datos anteriores se cargan automáticamente (ya están en Firestore)
 */

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

let admin
try {
  admin = require('firebase-admin')
} catch {
  console.error('❌  Instalá firebase-admin primero:\n   cd scripts && npm install')
  process.exit(1)
}

const __dirname = dirname(fileURLToPath(import.meta.url))

// Buscar cualquier .json en la carpeta actual que no sea package.json
let serviceAccount
try {
  const jsonFiles = readdirSync(__dirname).filter(f =>
    f.endsWith('.json') && f !== 'package.json' && f !== 'package-lock.json'
  )
  if (!jsonFiles.length) throw new Error('no json found')
  const keyPath = join(__dirname, jsonFiles[0])
  console.log(`   Usando clave: ${jsonFiles[0]}`)
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
} catch {
  console.error('❌  No encontré el archivo de clave en la carpeta scripts/')
  console.error('   Descargalo desde Firebase Console → Configuración → Cuentas de servicio')
  console.error('   y guardalo en la carpeta scripts/')
  process.exit(1)
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

const db   = admin.firestore()
const auth = admin.auth()

const FAKE_UID = 'fake_user_maria_garcia_001'

// ── Helpers ────────────────────────────────────────────────
async function deleteCollection(colRef) {
  const snap = await colRef.limit(100).get()
  if (snap.empty) return
  const batch = db.batch()
  snap.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

// ── 1. Limpiar usuario simulado ────────────────────────────
async function cleanFakeUser() {
  console.log('\n🧹  Limpiando usuario simulado…')

  // Subcollections del perfil falso
  for (const sub of ['myBooks', 'favoriteAuthors', 'publicReviews', 'notifications', 'shelves', 'loanRequests']) {
    await deleteCollection(db.collection('users').doc(FAKE_UID).collection(sub))
  }

  // Perfil
  await db.collection('users').doc(FAKE_UID).delete().catch(() => {})
  console.log('   ✓ Perfil fake eliminado')

  // Posts
  const postsSnap = await db.collection('posts').where('uid', '==', FAKE_UID).get()
  if (!postsSnap.empty) {
    const b = db.batch()
    postsSnap.docs.forEach(d => b.delete(d.ref))
    await b.commit()
    console.log(`   ✓ ${postsSnap.docs.length} post(s) del usuario falso eliminados`)
  }

  // Quitar de arrays followers/following en todos los usuarios reales
  const usersSnap = await db.collection('users').get()
  const batch = db.batch()
  let count = 0
  usersSnap.docs.forEach(d => {
    const { followers = [], following = [] } = d.data()
    const update = {}
    if (followers.includes(FAKE_UID)) { update.followers = followers.filter(u => u !== FAKE_UID); count++ }
    if (following.includes(FAKE_UID)) { update.following = following.filter(u => u !== FAKE_UID) }
    if (Object.keys(update).length) batch.update(d.ref, update)
  })
  if (count) { await batch.commit(); console.log(`   ✓ Removido de ${count} perfil(es) reales`) }

  // Conversaciones con el fake
  const convSnap = await db.collection('conversations')
    .where('participants', 'array-contains', FAKE_UID).get()
  if (!convSnap.empty) {
    const b2 = db.batch()
    convSnap.docs.forEach(d => b2.delete(d.ref))
    await b2.commit()
    console.log(`   ✓ ${convSnap.docs.length} conversación(es) eliminadas`)
  }
}

// ── 2. Migrar usuarios reales de Sandbook ──────────────────
async function migrateSandbookUsers() {
  console.log('\n👥  Identificando usuarios de Sandbook…')

  // Obtener todos los UIDs que tienen datos en /users/{uid}/myBooks
  // (esto confirma que usaron Sandbook, no otra app del mismo proyecto)
  const usersColSnap = await db.collection('users').get()
  const uidsWithProfile = new Set(usersColSnap.docs.map(d => d.id))

  // También buscar UIDs que tienen myBooks aunque no tengan perfil
  // (usuarios del app viejo que guardaron libros pero no tienen doc en /users)
  // No podemos listar subcollections directamente, pero podemos intentar via Auth

  let nextPageToken
  let created = 0
  let skipped = 0
  let notSandbook = 0

  console.log('   Revisando usuarios de Firebase Auth…\n')

  do {
    const result = await auth.listUsers(1000, nextPageToken)

    for (const user of result.users) {
      if (user.uid === FAKE_UID) { notSandbook++; continue }

      // Chequear si tiene libros guardados en Sandbook
      const booksSnap = await db
        .collection('users').doc(user.uid)
        .collection('myBooks')
        .limit(1)
        .get()

      const hasSandbookData = !booksSnap.empty

      // También aceptar si ya tiene perfil en /users (vino por cualquier app)
      const hasProfile = uidsWithProfile.has(user.uid)

      if (!hasSandbookData && !hasProfile) {
        // Usuario de otra app (outlet-Roma, etc.) — saltear
        notSandbook++
        continue
      }

      if (hasProfile) {
        // Ya tiene perfil — actualizar campos faltantes sin pisar los existentes
        const existing = usersColSnap.docs.find(d => d.id === user.uid)?.data() || {}
        const update = {}
        if (!existing.following)           update.following           = []
        if (!existing.followers)           update.followers           = []
        if (existing.notificationsEnabled === undefined) update.notificationsEnabled = true
        if (existing.messagingPrivacy === undefined)     update.messagingPrivacy     = 'everyone'
        if (existing.showLibrary === undefined)          update.showLibrary          = true

        if (Object.keys(update).length) {
          await db.collection('users').doc(user.uid).update(update)
        }
        skipped++
        continue
      }

      // Usuario de Sandbook sin perfil — crear uno con sus datos de Auth
      await db.collection('users').doc(user.uid).set({
        uid:         user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Lector',
        email:       user.email       || null,
        photoURL:    user.photoURL    || null,
        bio:         '',
        following:   [],
        followers:   [],
        notificationsEnabled: true,
        messagingPrivacy:     'everyone',
        showLibrary:          true,
        booksRead:            0,
        createdAt:   admin.firestore.FieldValue.serverTimestamp(),
      })

      console.log(`   + ${user.email || user.uid}  (${user.displayName || 'sin nombre'}) — ${booksSnap.size > 0 ? 'con libros guardados' : 'nuevo perfil'}`)
      created++
    }

    nextPageToken = result.pageToken
  } while (nextPageToken)

  console.log(`
   ✓ Perfiles creados:     ${created}
   ✓ Ya existían / OK:     ${skipped}
   — Otras apps (salteados): ${notSandbook}
  `)
}

// ── Main ───────────────────────────────────────────────────
async function main() {
  console.log('🚀  Migración Sandbook — proyecto playmobil-2d74d\n')
  console.log('   NOTA: Firebase Auth no se modifica.')
  console.log('   Los usuarios pueden seguir logueándose normalmente.')
  console.log('   Sus libros y datos anteriores se cargan automáticamente.\n')

  await cleanFakeUser()
  await migrateSandbookUsers()

  console.log('✅  Listo!\n')
  process.exit(0)
}

main().catch(err => {
  console.error('\n❌  Error:', err.message)
  console.error(err.stack)
  process.exit(1)
})
