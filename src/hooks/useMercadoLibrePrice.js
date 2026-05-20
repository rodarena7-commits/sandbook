import { useState, useEffect } from 'react'

// URL del servicio API separado en Render.
// Reemplazar con el URL real una vez creado el Web Service en Render.
const ML_API_BASE = 'https://sandbook-api.onrender.com'

function buildMlSearchUrl(book) {
  const q = (book.isbn13 || book.isbn10 || `${book.title} ${book.authors?.[0] || ''}`.trim())
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  return `https://listado.mercadolibre.com.ar/${q}`
}

export function useMercadoLibrePrice(book) {
  const [mlPrice,   setMlPrice]   = useState(null)
  const [mlLoading, setMlLoading] = useState(true)

  const mlUrl = buildMlSearchUrl(book)

  useEffect(() => {
    // No buscar precio si el API base no está configurado
    if (ML_API_BASE.includes('TU-SERVICIO')) { setMlLoading(false); return }

    let cancelled = false
    async function fetchPrice() {
      try {
        const q   = book.isbn13 || book.isbn10 || `${book.title} ${book.authors?.[0] || ''}`.trim()
        const res  = await fetch(`${ML_API_BASE}/ml-price?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (!cancelled && data.price) {
          setMlPrice({ price: data.price, url: data.url })
        }
      } catch { /* API no disponible */ }
      if (!cancelled) setMlLoading(false)
    }
    fetchPrice()
    return () => { cancelled = true }
  }, [book.bookId])

  return { mlPrice, mlLoading, mlUrl }
}
