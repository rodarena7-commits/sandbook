import { useState, useEffect } from 'react'

export function useMercadoLibrePrice(book) {
  const [mlPrice,   setMlPrice]   = useState(null)   // { price, url }
  const [mlLoading, setMlLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchPrice() {
      try {
        const q = book.isbn13 || book.isbn10
          || `${book.title} ${book.authors?.[0] || ''}`.trim()
        const res  = await fetch(
          `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(q)}&category=MLA1169&limit=6`
        )
        const data = await res.json()
        const items = (data.results || []).filter(i => i.price > 0)
        if (!cancelled && items.length) {
          const cheapest = items.reduce((min, i) => i.price < min.price ? i : min, items[0])
          setMlPrice({ price: cheapest.price, url: cheapest.permalink })
        }
      } catch { /* API no disponible, silencioso */ }
      if (!cancelled) setMlLoading(false)
    }
    fetchPrice()
    return () => { cancelled = true }
  }, [book.bookId])

  return { mlPrice, mlLoading }
}
