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

      const books = (data.items || []).map(item => {
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
      })

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
