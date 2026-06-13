import express from 'express'

const app = express()

// Permite llamadas desde el Static Site de Render y localhost
app.use((req, res, next) => {
  const allowed = [
    'https://sandbook-5qfn.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
  ]
  const origin = req.headers.origin
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// ── Token de MercadoLibre (cacheado 6 hs) ────────────────────────────
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
  mlTokenExp = Date.now() + (data.expires_in - 300) * 1000
  return mlToken
}

// ── GET /ml-price?q=TITULO ───────────────────────────────────────────
app.get('/ml-price', async (req, res) => {
  const q = req.query.q?.trim()
  if (!q) return res.status(400).json({ error: 'q requerido' })
  try {
    const token = await getMlToken()
    // La búsqueda de ML es pública — no necesita auth.
    // El servidor actúa como proxy para evitar el bloqueo CORS del browser.
    const r = await fetch(
      `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(q)}&limit=10`
    )
    const data  = await r.json()
    const items = (data.results || []).filter(i => i.price > 0)
    if (!items.length) return res.json({ price: null, url: null })
    const cheapest = items.reduce((min, i) => i.price < min.price ? i : min, items[0])
    res.json({ price: cheapest.price, url: cheapest.permalink })
  } catch (e) {
    console.error('ML error:', e.message)
    res.status(502).json({ error: 'Error ML' })
  }
})

// ── GET /api/app-logo.png ───────────────────────────────────────────
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
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Cache-Control', 'public, max-age=3600')
          return res.send(buffer)
        }
      }
      if (customLogo.startsWith('http')) {
        const logoRes = await fetch(customLogo)
        const contentType = logoRes.headers.get('content-type') || 'image/png'
        const buffer = Buffer.from(await logoRes.arrayBuffer())
        res.setHeader('Content-Type', contentType)
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Cache-Control', 'public, max-age=3600')
        return res.send(buffer)
      }
    }
  } catch (e) {
    console.error('Error serving app-logo.png:', e.message)
  }
  res.redirect('https://sandbook-5qfn.onrender.com/logosandbook.png')
})

app.get('/health', (_req, res) => res.json({ ok: true }))


const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Sandbook API corriendo en :${PORT}`))
