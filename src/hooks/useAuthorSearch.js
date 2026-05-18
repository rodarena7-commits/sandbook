import { useState, useCallback } from 'react'

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || ''

export function useAuthorSearch() {
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery]     = useState('')

  const search = useCallback(async (q) => {
    const trimmed = q.trim()
    if (!trimmed) { setAuthors([]); return }
    setLoading(true)
    try {
      const res  = await fetch(`https://openlibrary.org/search/authors.json?q=${encodeURIComponent(trimmed)}&limit=8`)
      const data = await res.json()

      const results = await Promise.all(
        (data.docs || []).slice(0, 6).map(async (a) => {
          const olid = a.key?.replace('/authors/', '') || ''

          // Books from Google Books (better covers)
          let books = []
          try {
            const bRes  = await fetch(`https://www.googleapis.com/books/v1/volumes?q=inauthor:${encodeURIComponent(a.name)}&maxResults=10${GOOGLE_KEY ? `&key=${GOOGLE_KEY}` : ''}`)
            const bData = await bRes.json()
            books = (bData.items || []).map(item => ({
              bookId:       item.id,
              title:        item.volumeInfo?.title || '',
              thumbnail:    item.volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
              publishedDate: item.volumeInfo?.publishedDate || '',
              pageCount:    item.volumeInfo?.pageCount || 0,
            }))
          } catch {}

          return {
            olid,
            name:       a.name,
            photoUrl:   olid ? `https://covers.openlibrary.org/a/olid/${olid}-M.jpg` : null,
            birthDate:  a.birth_date  || null,
            deathDate:  a.death_date  || null,
            workCount:  a.work_count  || 0,
            topWork:    a.top_work    || null,
            books,
          }
        })
      )
      setAuthors(results)
    } catch {
      setAuthors([])
    } finally {
      setLoading(false)
    }
  }, [])

  function clear() { setAuthors([]); setQuery('') }

  return { authors, loading, query, setQuery, search, clear }
}
