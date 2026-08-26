import { useState, useCallback } from 'react'

// Bookfree: busca y sugiere libros gratis y de dominio público en tres
// catálogos legales (Internet Archive, Project Gutenberg y Google Books
// "free-ebooks"). Nunca se agregan fuentes que puedan devolver contenido
// pirata.

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || ''

function mapArchiveDoc(d) {
  const formats = Array.isArray(d.format) ? d.format : (d.format ? [d.format] : [])
  const hasPdf = formats.some(f => /pdf/i.test(f))
  return {
    id: `ia_${d.identifier}`,
    source: 'archive',
    identifier: d.identifier,
    title: d.title || 'Sin título',
    authors: Array.isArray(d.creator) ? d.creator : (d.creator ? [d.creator] : []),
    year: d.year ? String(d.year) : '',
    thumbnail: `https://archive.org/services/img/${d.identifier}`,
    readUrl: `https://archive.org/details/${d.identifier}`,
    // Internet Archive no da el nombre exacto del archivo PDF en la búsqueda:
    // se resuelve al vuelo (resolveArchivePdfUrl) recién cuando el usuario
    // toca "Leer" o "Descargar".
    pdfUrl: null,
    hasPdf,
    formatLabel: hasPdf ? 'PDF' : null,
  }
}

function mapGutenbergBook(b) {
  const formats = b.formats || {}
  const pdfUrl  = formats['application/pdf'] || null
  const epubUrl = formats['application/epub+zip'] || null
  const htmlUrl = formats['text/html'] || formats['text/html; charset=utf-8'] || null
  const cover   = Object.entries(formats).find(([k]) => k.startsWith('image/'))?.[1] || null
  return {
    id: `gb_${b.id}`,
    source: 'gutenberg',
    identifier: String(b.id),
    title: b.title || 'Sin título',
    authors: (b.authors || []).map(a => a.name),
    year: '',
    thumbnail: cover,
    readUrl: pdfUrl || htmlUrl || `https://www.gutenberg.org/ebooks/${b.id}`,
    pdfUrl,
    hasPdf: !!pdfUrl,
    formatLabel: pdfUrl ? 'PDF' : (epubUrl ? 'EPUB' : 'HTML'),
  }
}

function mapGoogleFreeItem(item) {
  const info   = item.volumeInfo || {}
  const access = item.accessInfo || {}
  const pdfAvailable = !!access.pdf?.isAvailable
  return {
    id: `gg_${item.id}`,
    source: 'google',
    identifier: item.id,
    title: info.title || 'Sin título',
    authors: info.authors || [],
    year: info.publishedDate?.slice(0, 4) || '',
    thumbnail: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
    readUrl: access.webReaderLink || info.previewLink || info.infoLink,
    // Google Books no permite descargar el PDF real sin autorización OAuth
    // del usuario: sólo se ofrece "Ver" (lector propio de Google), nunca descarga.
    pdfUrl: null,
    hasPdf: false,
    formatLabel: pdfAvailable ? 'Vista con PDF' : 'Vista previa',
  }
}

async function searchArchive(q, { kidsOnly } = {}) {
  // Internet Archive queda afuera del modo "Kids": incluso filtrando por
  // subject:(Juvenile Fiction) devuelve contenido no apto (terror, romance
  // adulto mal catalogado) — no es confiable para una etiqueta de seguridad
  // infantil, así que directamente no se consulta.
  if (kidsOnly) return []
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
  return docs.filter(d => d.identifier).map(mapArchiveDoc)
}

async function searchGutenberg(q, { kidsOnly } = {}) {
  const url =
    `https://gutendex.com/books/?search=${encodeURIComponent(q)}` +
    (kidsOnly ? '&topic=children' : '')
  const res = await fetch(url)
  if (!res.ok) throw new Error('gutenberg')
  const data = await res.json()
  return (data?.results || []).slice(0, 15).map(mapGutenbergBook)
}

async function searchGoogleFree(q, { kidsOnly } = {}) {
  const query = kidsOnly ? `${q} subject:Juvenile` : q
  const url =
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}` +
    `&filter=free-ebooks&maxResults=15${GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('google')
  const data = await res.json()
  return (data?.items || []).map(mapGoogleFreeItem)
}

const SEARCHERS = {
  archive:   searchArchive,
  gutenberg: searchGutenberg,
  google:    searchGoogleFree,
}

// ── Destacados / más descargados (para no dejar la pantalla en blanco) ────
async function loadFeaturedBooks(kidsOnly) {
  const gutUrl1 = 'https://gutendex.com/books/' + (kidsOnly ? '?topic=children' : '')
  const gutUrl2 = 'https://gutendex.com/books/' + (kidsOnly ? '?topic=children&page=2' : '?page=2')

  const [gutPage1, gutPage2, iaRes] = await Promise.allSettled([
    fetch(gutUrl1).then(r => r.json()),
    fetch(gutUrl2).then(r => r.json()),
    // Internet Archive no participa del modo Kids: ver nota de seguridad en searchArchive.
    kidsOnly ? Promise.resolve(null) : fetch(
      // collection:(internetarchivebooks) + creator:* restringe a los escaneos
      // catalogados de bibliotecas/universidades, evitando tanto subidas sueltas
      // sin catalogar como resultados irrelevantes del texto completo.
      'https://archive.org/advancedsearch.php?q=mediatype:(texts)+AND+collection:(internetarchivebooks)+AND+creator:*' +
      '&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=format' +
      '&sort[]=downloads+desc&rows=30&page=1&output=json'
    ).then(r => r.json()),
  ])

  const gutItems = [
    ...(gutPage1.status === 'fulfilled' ? gutPage1.value?.results || [] : []),
    ...(gutPage2.status === 'fulfilled' ? gutPage2.value?.results || [] : []),
  ].map(mapGutenbergBook)

  const iaItems = iaRes.status === 'fulfilled' && iaRes.value
    ? (iaRes.value?.response?.docs || [])
        .filter(d => d.identifier && d.title && d.title.length > 3)
        .map(mapArchiveDoc)
    : []

  // Intercala las dos fuentes para que el catálogo no sea todo de una sola
  const merged = []
  const max = Math.max(gutItems.length, iaItems.length)
  for (let i = 0; i < max; i++) {
    if (gutItems[i]) merged.push(gutItems[i])
    if (iaItems[i]) merged.push(iaItems[i])
  }
  return merged
}

export function useFreeBooks() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [query, setQuery]     = useState('')

  const [featured, setFeatured]               = useState([])
  const [featuredLoading, setFeaturedLoading] = useState(false)
  const [featuredLoadedFor, setFeaturedLoadedFor] = useState(null) // null | false | true (valor de kidsOnly ya cargado)

  const search = useCallback(async (q, sources = Object.keys(SEARCHERS), kidsOnly = false) => {
    const trimmed = q.trim()
    if (!trimmed) { setResults([]); return }

    setLoading(true)
    setError(null)
    try {
      const settled = await Promise.allSettled(
        sources.map(s => SEARCHERS[s]?.(trimmed, { kidsOnly }) ?? Promise.resolve([]))
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

  const loadFeatured = useCallback(async (kidsOnly = false) => {
    if (featuredLoadedFor === kidsOnly || featuredLoading) return
    setFeaturedLoading(true)
    try {
      const items = await loadFeaturedBooks(kidsOnly)
      setFeatured(items)
    } catch { /* si falla, simplemente no se muestra el catálogo */ }
    setFeaturedLoadedFor(kidsOnly)
    setFeaturedLoading(false)
  }, [featuredLoadedFor, featuredLoading])

  function clear() {
    setResults([])
    setQuery('')
    setError(null)
  }

  return {
    results, loading, error, query, setQuery, search, clear,
    featured, featuredLoading, loadFeatured,
  }
}
