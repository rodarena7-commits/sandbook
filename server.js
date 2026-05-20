import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

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
