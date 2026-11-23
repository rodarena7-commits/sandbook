import { useState, useCallback } from 'react'
import { track } from '../utils/analytics'

const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || ''
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes'
const OL_FIELDS = 'key,title,author_name,cover_i,first_publish_year,number_of_pages_median,subject,isbn'

// Google Books a veces responde 503 "Service temporarily unavailable" (backendFailed) de forma
// intermitente, un 200 vacío, o directamente no responde. Por eso se consulta a Open Library en
// paralelo y, si Google no sirve, se usa esa respuesta sin esperar reintentos.
const GOOGLE_TIMEOUT_MS = 4000

// Devuelve el JSON de Google Books o null si falló / no respondió a tiempo
async function fetchGoogleBooks(url) {
  try {
    // AbortSignal.timeout no existe en WebViews viejos: ahí va sin límite de tiempo
    const res = await fetch(url, AbortSignal.timeout ? { signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS) } : {})
    return res.ok ? await res.json() : null
  } catch {
    return null
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

// Busca en Google Books y, si está caído o no devuelve nada, en Open Library.
// Devuelve la lista (puede ser vacía) o lanza Error('unavailable') si fallan los dos.
export async function searchBooks(q, type = 'title') {
  const prefix = type === 'author' ? 'inauthor:' : type === 'isbn' ? 'isbn:' : 'intitle:'
  const url = `${BASE_URL}?q=${encodeURIComponent(prefix + q)}&maxResults=20${API_KEY ? `&key=${API_KEY}` : ''}`

  const olPromise = searchOpenLibrary(q, type)
  const data = await fetchGoogleBooks(url)
  const googleBooks = data ? (data.items || []).map(mapGoogleBook) : []
  if (googleBooks.length) return googleBooks

  // Google no sirvió: Open Library ya viene en camino
  const olBooks = await olPromise
  if (olBooks?.length) return olBooks

  // Open Library tampoco trajo nada: un último intento con Google
  const retry = await fetchGoogleBooks(url)
  const retryBooks = retry ? (retry.items || []).map(mapGoogleBook) : []
  if (retryBooks.length || retry || data || olBooks) return retryBooks
  throw new Error('unavailable')
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
      setResults(await searchBooks(trimmed, type))
    } catch {
      setError('search_unavailable')   // clave de traducción
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
