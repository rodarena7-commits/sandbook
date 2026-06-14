import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

// ── Dynamic manifest.json ─────────────────────────────────────────────
app.get('/manifest.json', async (req, res) => {
  try {
    const firestoreRes = await fetch(
      'https://firestore.googleapis.com/v1/projects/playmobil-2d74d/databases/(default)/documents/appConfig/settings'
    )
    const docData = await firestoreRes.json()
    const customLogo = docData?.fields?.logoUrl?.stringValue

    const manifest = {
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
          src: customLogo ? "/api/app-logo.png" : "/logosandbook.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: customLogo ? "/api/app-logo.png" : "/logosandbook.png",
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
      ],
      prefer_related_applications: false,
      related_applications: []
    }
    res.setHeader('Content-Type', 'application/json')
    res.json(manifest)
  } catch (e) {
    console.error('Error serving manifest.json:', e.message)
    res.sendFile(join(__dirname, 'dist', 'manifest.json'))
  }
})

// ── Dynamic App Logo Endpoint ──────────────────────────────────────────
app.get('/api/app-logo.png', async (req, res) => {
  try {
    const firestoreRes = await fetch(
      'https://firestore.googleapis.com/v1/projects/playmobil-2d74d/databases/(default)/documents/appConfig/settings'
    )
    const docData = await firestoreRes.json()
    const customLogo = docData?.fields?.logoUrl?.stringValue

    if (customLogo) {
      if (customLogo.startsWith('data:image/')) {
        const matches = customLogo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
        if (matches && matches.length === 3) {
          const type = matches[1]
          const buffer = Buffer.from(matches[2], 'base64')
          res.setHeader('Content-Type', type)
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
          return res.send(buffer)
        }
      }
      if (customLogo.startsWith('http')) {
        const logoRes = await fetch(customLogo)
        const contentType = logoRes.headers.get('content-type') || 'image/png'
        const buffer = Buffer.from(await logoRes.arrayBuffer())
        res.setHeader('Content-Type', contentType)
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        return res.send(buffer)
      }
    }
  } catch (e) {
    console.error('Error serving app-logo.png:', e.message)
  }
  res.sendFile(join(__dirname, 'dist', 'logosandbook.png'))
})

// Sirve el build de React (dist/)
app.use(express.static(join(__dirname, 'dist')))

// ── Token de MercadoLibre (cacheado en memoria, dura 6 hs) ────────────
let mlToken    = null
let mlTokenExp = 0

async function getMlToken() {
  if (mlToken && Date.now() < mlTokenExp) return mlToken
  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     process.env.ML_CLIENT_ID,
      client_secret: process.env.ML_CLIENT_SECRET,
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`ML token error: ${JSON.stringify(data)}`)
  mlToken    = data.access_token
  mlTokenExp = Date.now() + (data.expires_in - 300) * 1000  // 5 min de margen
  return mlToken
}

// ── Endpoint proxy: GET /api/ml-price?q=TITULO ────────────────────────
app.get('/api/ml-price', async (req, res) => {
  const q = req.query.q?.trim()
  if (!q) return res.status(400).json({ error: 'q requerido' })

  try {
    const token = await getMlToken()
    const searchRes = await fetch(
      `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(q)}&category=MLA1169&limit=6`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await searchRes.json()
    const items = (data.results || []).filter(i => i.price > 0)

    if (!items.length) return res.json({ price: null, url: null })

    const cheapest = items.reduce((min, i) => i.price < min.price ? i : min, items[0])
    res.json({ price: cheapest.price, url: cheapest.permalink })
  } catch (e) {
    console.error('ML price error:', e.message)
    res.status(502).json({ error: 'No se pudo obtener precio de ML' })
  }
})

// SPA fallback — todas las rutas sirven el index.html de React
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Sandbook server corriendo en puerto ${PORT}`))
