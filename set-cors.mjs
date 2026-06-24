// Ejecutar: node set-cors.mjs
// Requiere: service-key.json en esta misma carpeta
// Instalar dependencia: npm install @google-cloud/storage --save-dev

import { Storage } from '@google-cloud/storage'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const keyPath = join(__dirname, 'service-key.json')

let storage
try {
  const key = JSON.parse(readFileSync(keyPath, 'utf8'))
  storage = new Storage({ credentials: key, projectId: 'playmobil-2d74d' })
} catch {
  console.error('❌ No se encontró service-key.json. Descargalo desde Firebase Console > Configuración > Cuentas de servicio')
  process.exit(1)
}

const CORS = [
  {
    origin: [
      'https://sandbook-5qfn.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    method: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
    maxAgeSeconds: 3600,
    responseHeader: [
      'Content-Type',
      'Authorization',
      'Content-Length',
      'User-Agent',
      'x-goog-resumable',
    ],
  },
]

try {
  await storage.bucket('playmobil-2d74d.firebasestorage.app').setCorsConfiguration(CORS)
  console.log('✅ CORS configurado correctamente en Firebase Storage')
  console.log('   Los uploads desde sandbook-5qfn.onrender.com ya deberían funcionar.')
} catch (e) {
  console.error('❌ Error:', e.message)
}
