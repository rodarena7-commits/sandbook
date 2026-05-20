import { useState, useCallback } from 'react'

const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || ''
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes'

export function useGoogleBooks() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')

  const search = useCallback(async (q, type = 'title') => {
    const trimmed = q.trim()
    if (!trimmed) { setResults([]); return }

    setLoading(true)
    setError(null)

    try {
      const prefix = type === 'author' ? 'inauthor:' : type === 'isbn' ? 'isbn:' : 'intitle:'
      const url = `${BASE_URL}?q=${encodeURIComponent(prefix + trimmed)}&maxResults=20${API_KEY ? `&key=${API_KEY}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Error al buscar')

      const mapGoogleBook = item => {
        const info = item.volumeInfo || {}
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
        }
      }

      let books = (data.items || []).map(mapGoogleBook)

      // Fallback a Open Library si Google Books no encuentra nada por ISBN
      if (books.length === 0 && type === 'isbn') {
        try {
          const olRes = await fetch(
            `https://openlibrary.org/search.json?isbn=${encodeURIComponent(trimmed)}&fields=key,title,author_name,cover_i,first_publish_year,number_of_pages_median,subject`
          )
          const olData = await olRes.json()
          books = (olData.docs || []).map(doc => ({
            bookId: `ol_${doc.key?.replace('/works/', '') || Date.now()}`,
            title: doc.title || 'Sin título',
            authors: doc.author_name || [],
            description: '',
            thumbnail: doc.cover_i
              ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
              : null,
            pageCount: doc.number_of_pages_median || 0,
            publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : '',
            categories: doc.subject?.slice(0, 3) || [],
            language: '',
          }))
        } catch { /* Open Library no disponible, ignorar */ }
      }

      setResults(books)
    } catch (e) {
      setError(e.message || 'No se pudieron cargar los resultados')
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
