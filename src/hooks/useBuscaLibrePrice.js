import { useState, useEffect } from 'react'

const API_BASE = 'https://sandbook-api.onrender.com'

function buildBuscaLibreSearchUrl(book) {
  const q = book.isbn13 || book.isbn10 || `${book.title} ${book.authors?.[0] || ''}`.trim()
  return `https://www.buscalibre.com.ar/libros/search?q=${encodeURIComponent(q)}`
}

export function useBuscaLibrePrice(book) {
  const [blPrice,   setBlPrice]   = useState(null)
  const [blLoading, setBlLoading] = useState(true)

  const blUrl = buildBuscaLibreSearchUrl(book)

  useEffect(() => {
    let cancelled = false
    async function fetchPrice() {
      try {
        const q = book.isbn13 || book.isbn10 || `${book.title} ${book.authors?.[0] || ''}`.trim()
        const res  = await fetch(`${API_BASE}/buscalibre-price?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (!cancelled && data.price) {
          setBlPrice({ price: data.price, url: data.url })
        }
      } catch { /* Fail silently */ }
      if (!cancelled) setBlLoading(false)
    }
    fetchPrice()
    return () => { cancelled = true }
  }, [book.bookId])

  return { blPrice, blLoading, blUrl }
}
