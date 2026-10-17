import { useState, useCallback } from 'react'
import { track } from '../utils/analytics'

const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || ''
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes'
const OL_FIELDS = 'key,title,author_name,cover_i,first_publish_year,number_of_pages_median,subject,isbn'

// Google Books a veces responde 503 "Service temporarily unavailable" (backendFailed) de forma
// intermitente, o un 200 vacío. Reintentamos una vez y después pasamos a Open Library.
const RETRY_DELAYS_MS = [400]
const GOOGLE_TIMEOUT_MS = 5000

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchGoogleBooks(url) {
  for (let attempt = 0; ; attempt++) {
    try {
      // AbortSignal.timeout no existe en WebViews viejos: ahí va sin límite de tiempo
      const res = await fetch(url, AbortSignal.timeout ? { signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS) } : {})
      if (res.ok) return await res.json()
      const retryable = res.status >= 500 || res.status === 429
      if (!retryable || attempt >= RETRY_DELAYS_MS.length) return null
    } catch {
      if (attempt >= RETRY_DELAYS_MS.length) return null
    }
    await sleep(RETRY_DELAYS_MS[attempt])
  }
}

function mapGoogleBook(item) {
  const info = item.volumeInfo || {}
  const sale = item.saleInfo || {}
  const isbn13 = info.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier || null
  const isbn10 = info.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier || null
  return {
    bookId: item.id,
    title: info.title || 'Sin título',
    authors: info.authors || [],
    description: info.description || '',
    thumbnail: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
    pageCount: info.pageCount || 0,
    publishedDate: info.publishedDate || '',
    categories: info.categories || [],
    language: info.language || '',
    isbn13,
    isbn10,
    price:    sale.retailPrice?.amount    ?? sale.listPrice?.amount    ?? null,
    currency: sale.retailPrice?.currencyCode ?? sale.listPrice?.currencyCode ?? 'USD',
    buyLink:  sale.buyLink || null,
  }
}

function mapOpenLibraryBook(doc) {
  const isbns = doc.isbn || []
  return {
    bookId: `ol_${doc.key?.replace('/works/', '') || Date.now()}`,
    title: doc.title || 'Sin título',
    authors: doc.author_name || [],
    description: '',
    thumbnail: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    pageCount: doc.number_of_pages_median || 0,
    publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : '',
    categories: doc.subject?.slice(0, 3) || [],
    language: '',
    isbn13: isbns.find(i => i.length === 13) || null,
    isbn10: isbns.find(i => i.length === 10) || null,
  }
}

// Devuelve los libros o null si Open Library tampoco respondió
async function searchOpenLibrary(q, type) {
  const param = type === 'author' ? 'author' : type === 'isbn' ? 'isbn' : 'title'
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?${param}=${encodeURIComponent(q)}&limit=20&fields=${OL_FIELDS}`
    )
    if (!res.ok) return null
    const data = await res.json()
    return (data.docs || []).map(mapOpenLibraryBook)
  } catch {
    return null
  }
}

export function useGoogleBooks() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')

  const search = useCallback(async (q, type = 'title') => {
    const trimmed = q.trim()
    if (!trimmed) { setResults([]); return }
    track('search', { source: 'libros', query: trimmed, searchType: type })

    setLoading(true)
    setError(null)

    try {
      const prefix = type === 'author' ? 'inauthor:' : type === 'isbn' ? 'isbn:' : 'intitle:'
      const url = `${BASE_URL}?q=${encodeURIComponent(prefix + trimmed)}&maxResults=20${API_KEY ? `&key=${API_KEY}` : ''}`
      const data = await fetchGoogleBooks(url)

      let books = data ? (data.items || []).map(mapGoogleBook) : []

      // Open Library cubre cuando Google está caído o no devuelve nada
      if (books.length === 0) {
        const olBooks = await searchOpenLibrary(trimmed, type)
        if (olBooks) books = olBooks
        else if (!data) throw new Error('unavailable')
      }

      setResults(books)
    } catch {
      setError('La búsqueda no está disponible en este momento. Probá de nuevo en unos minutos.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function clear() {
    setResults([])
    setQuery('')
    setError(null)
  }

  return { results, loading, error, query, setQuery, search, clear }
}
