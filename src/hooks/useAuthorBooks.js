import { useState, useEffect } from 'react'

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || ''

export function useAuthorBooks(authorName, currentBookId) {
  const [books, setBooks]   = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authorName) return
    let cancelled = false
    setLoading(true)

    fetch(
      `https://www.googleapis.com/books/v1/volumes?q=inauthor:${encodeURIComponent(authorName)}&maxResults=20${GOOGLE_KEY ? `&key=${GOOGLE_KEY}` : ''}`
    )
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setBooks(
          (data.items || [])
            .filter(item => item.id !== currentBookId)
            .map(item => ({
              bookId:        item.id,
              title:         item.volumeInfo?.title || '',
              thumbnail:     item.volumeInfo?.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
              publishedDate: item.volumeInfo?.publishedDate || '',
              pageCount:     item.volumeInfo?.pageCount || 0,
              authors:       item.volumeInfo?.authors || [authorName],
              description:   item.volumeInfo?.description || '',
            }))
        )
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [authorName, currentBookId])

  return { books, loading }
}
