import { useState, useCallback } from 'react'

// Bookfree: busca libros gratis y de dominio público en tres catálogos legales
// (Internet Archive, Project Gutenberg y Google Books "free-ebooks"). Nunca
// se agregan fuentes que puedan devolver contenido pirata.

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || ''

async function searchArchive(q) {
  // Restringido a título/autor (no texto completo) para evitar resultados
  // irrelevantes o inapropiados que aparecen al buscar en todo el OCR.
  const query = `(title:(${q}) OR creator:(${q})) AND mediatype:(texts)`
  const url =
    `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}` +
    `&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=year&fl[]=format` +
    `&sort[]=downloads+desc&rows=15&page=1&output=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error('archive')
  const data = await res.json()
  const docs = data?.response?.docs || []
  return docs
    .filter(d => d.identifier)
    .map(d => {
      const formats = Array.isArray(d.format) ? d.format : (d.format ? [d.format] : [])
      const hasPdf = formats.some(f => /pdf/i.test(f))
      return {
        id: `ia_${d.identifier}`,
        source: 'archive',
        title: d.title || 'Sin título',
        authors: Array.isArray(d.creator) ? d.creator : (d.creator ? [d.creator] : []),
        year: d.year ? String(d.year) : '',
        thumbnail: `https://archive.org/services/img/${d.identifier}`,
        readUrl: `https://archive.org/details/${d.identifier}`,
        formatLabel: hasPdf ? 'PDF' : null,
      }
    })
}

async function searchGutenberg(q) {
  const url = `https://gutendex.com/books/?search=${encodeURIComponent(q)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('gutenberg')
  const data = await res.json()
  const results = data?.results || []
  return results.slice(0, 15).map(b => {
    const formats = b.formats || {}
    const pdfUrl  = formats['application/pdf'] || null
    const epubUrl = formats['application/epub+zip'] || null
    const htmlUrl = formats['text/html'] || formats['text/html; charset=utf-8'] || null
    const cover   = Object.entries(formats).find(([k]) => k.startsWith('image/'))?.[1] || null
    return {
      id: `gb_${b.id}`,
      source: 'gutenberg',
      title: b.title || 'Sin título',
      authors: (b.authors || []).map(a => a.name),
      year: '',
      thumbnail: cover,
      readUrl: pdfUrl || htmlUrl || `https://www.gutenberg.org/ebooks/${b.id}`,
      formatLabel: pdfUrl ? 'PDF' : (epubUrl ? 'EPUB' : 'HTML'),
    }
  })
}

async function searchGoogleFree(q) {
  const url =
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}` +
    `&filter=free-ebooks&maxResults=15${GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('google')
  const data = await res.json()
  const items = data?.items || []
  return items.map(item => {
    const info   = item.volumeInfo  || {}
    const access = item.accessInfo  || {}
    const pdfAvailable = !!access.pdf?.isAvailable
    return {
      id: `gg_${item.id}`,
      source: 'google',
      title: info.title || 'Sin título',
      authors: info.authors || [],
      year: info.publishedDate?.slice(0, 4) || '',
      thumbnail: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
      readUrl: access.webReaderLink || info.previewLink || info.infoLink,
      formatLabel: pdfAvailable ? 'PDF' : 'Vista previa',
    }
  })
}

const SEARCHERS = {
  archive:   searchArchive,
  gutenberg: searchGutenberg,
  google:    searchGoogleFree,
}

export function useFreeBooks() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [query, setQuery]     = useState('')

  const search = useCallback(async (q, sources = Object.keys(SEARCHERS)) => {
    const trimmed = q.trim()
    if (!trimmed) { setResults([]); return }

    setLoading(true)
    setError(null)
    try {
      const settled = await Promise.allSettled(
        sources.map(s => SEARCHERS[s]?.(trimmed) ?? Promise.resolve([]))
      )
      const merged = settled.flatMap(r => r.status === 'fulfilled' ? r.value : [])
      setResults(merged)
      if (merged.length === 0 && settled.every(r => r.status === 'rejected')) {
        setError('No se pudieron cargar los resultados')
      }
    } catch {
      setError('No se pudieron cargar los resultados')
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
