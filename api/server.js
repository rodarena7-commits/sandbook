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
    const r = await fetch(
      `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(q)}&category=MLA1169&limit=6`,
      { headers: { Authorization: `Bearer ${token}` } }
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

app.get('/health', (_req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Sandbook API corriendo en :${PORT}`))
