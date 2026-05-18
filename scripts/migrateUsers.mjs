/**
 * Script de migración — ejecutar UNA VEZ desde la terminal:
 *
 *   1. Descargá la clave del servicio (Service Account) desde:
 *      Firebase Console → Configuración del proyecto → Cuentas de servicio
 *      → "Generar nueva clave privada" → guardala como scripts/serviceAccount.json
 *
 *   2. Instalá las dependencias necesarias:
 *      cd scripts && npm install firebase-admin
 *
 *   3. Ejecutá el script:
 *      node scripts/migrateUsers.mjs
 *
 * El script:
 *   - Elimina el usuario simulado (fake_user_maria_garcia_001)
 *   - Para cada usuario en Firebase Auth que NO tenga perfil
 *     en Firestore, crea uno con los datos disponibles
 */

import { readFileSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// --- Cargá firebase-admin ---
let admin
try {
  admin = require('firebase-admin')
} catch {
  console.error('❌  Instalá firebase-admin primero:\n   cd scripts && npm install firebase-admin')
  process.exit(1)
}

// --- Cargá la clave del servicio ---
let serviceAccount
try {
  serviceAccount = JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url)))
} catch {
  console.error('❌  No encontré scripts/serviceAccount.json\n   Descargala desde Firebase Console → Configuración → Cuentas de servicio')
  process.exit(1)
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

const db   = admin.firestore()
const auth = admin.auth()

const FAKE_UID = 'fake_user_maria_garcia_001'

// ── 1. Limpiar usuario simulado ────────────────────────────
async function cleanFakeUser() {
  console.log('\n🧹  Limpiando usuario simulado…')

  // Eliminar libros del usuario falso
  const booksSnap = await db.collection('users').doc(FAKE_UID).collection('myBooks').get()
  const batch1 = db.batch()
  booksSnap.docs.forEach(d => batch1.delete(d.ref))
  if (booksSnap.docs.length) await batch1.commit()

  // Eliminar otras subcollections conocidas
  for (const sub of ['favoriteAuthors', 'publicReviews', 'notifications', 'shelves']) {
    const snap = await db.collection('users').doc(FAKE_UID).collection(sub).get()
    const b = db.batch()
    snap.docs.forEach(d => b.delete(d.ref))
    if (snap.docs.length) await b.commit()
  }

  // Eliminar perfil del usuario falso
  await db.collection('users').doc(FAKE_UID).delete()
  console.log('   ✓ Perfil fake eliminado')

  // Eliminar posts del usuario falso
  const postsSnap = await db.collection('posts').where('uid', '==', FAKE_UID).get()
  const batch2 = db.batch()
  postsSnap.docs.forEach(d => batch2.delete(d.ref))
  if (postsSnap.docs.length) {
    await batch2.commit()
    console.log(`   ✓ ${postsSnap.docs.length} post(s) eliminados`)
  }

  // Quitar fake de los arrays followers/following de todos los usuarios
  const usersSnap = await db.collection('users').get()
  const batch3 = db.batch()
  let updated = 0
  usersSnap.docs.forEach(d => {
    const data = d.data()
    let changed = false
    const update = {}
    if ((data.followers || []).includes(FAKE_UID)) {
      update.followers = (data.followers || []).filter(u => u !== FAKE_UID)
      changed = true
    }
    if ((data.following || []).includes(FAKE_UID)) {
      update.following = (data.following || []).filter(u => u !== FAKE_UID)
      changed = true
    }
    if (changed) { batch3.update(d.ref, update); updated++ }
  })
  if (updated) {
    await batch3.commit()
    console.log(`   ✓ Removido de ${updated} perfil(es) de usuarios reales`)
  }

  // Eliminar conversaciones con el fake
  const convsSnap = await db.collection('conversations')
    .where('participants', 'array-contains', FAKE_UID).get()
  const batch4 = db.batch()
  convsSnap.docs.forEach(d => batch4.delete(d.ref))
  if (convsSnap.docs.length) {
    await batch4.commit()
    console.log(`   ✓ ${convsSnap.docs.length} conversación(es) eliminadas`)
  }
}

// ── 2. Crear perfiles en Firestore para usuarios de Auth ───
async function migrateAuthUsers() {
  console.log('\n👥  Migrando usuarios de Firebase Auth a Firestore…')

  let nextPageToken
  let created = 0
  let skipped = 0

  do {
    const result = await auth.listUsers(1000, nextPageToken)

    for (const user of result.users) {
      if (user.uid === FAKE_UID) continue

      const docRef = db.collection('users').doc(user.uid)
      const snap   = await docRef.get()

      if (snap.exists) {
        skipped++
        continue
      }

      await docRef.set({
        uid:         user.uid,
        displayName: user.displayName || 'Lector',
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

      created++
      console.log(`   + ${user.email || user.uid} (${user.displayName || 'sin nombre'})`)
    }

    nextPageToken = result.pageToken
  } while (nextPageToken)

  console.log(`\n   ✓ Creados: ${created}  |  Ya existían: ${skipped}`)
}

// ── Main ───────────────────────────────────────────────────
async function main() {
  console.log('🚀  Iniciando migración de Sandbook…')
  await cleanFakeUser()
  await migrateAuthUsers()
  console.log('\n✅  Listo!\n')
  process.exit(0)
}

main().catch(err => {
  console.error('\n❌  Error:', err.message)
  process.exit(1)
})
