import { useState, useEffect } from 'react'

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
  const [mlPrice,   setMlPrice]   = useState(null)   // { price, url }
  const [mlLoading, setMlLoading] = useState(true)

  const mlUrl = buildMlSearchUrl(book)

  useEffect(() => {
    let cancelled = false
    async function fetchPrice() {
      try {
        const q   = book.isbn13 || book.isbn10 || `${book.title} ${book.authors?.[0] || ''}`.trim()
        const res  = await fetch(`/api/ml-price?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (!cancelled && data.price) {
          setMlPrice({ price: data.price, url: data.url })
        }
      } catch { /* proxy no disponible en dev local */ }
      if (!cancelled) setMlLoading(false)
    }
    fetchPrice()
    return () => { cancelled = true }
  }, [book.bookId])

  return { mlPrice, mlLoading, mlUrl }
}
