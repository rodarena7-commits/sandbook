import { useState, useRef, useEffect, useMemo, Suspense, lazy } from 'react'
import { Search, X, BookOpen, Loader2, Gift, ExternalLink, Download, BookOpenText, BookmarkPlus, BookmarkCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useFreeBooks } from '../hooks/useFreeBooks'
import { useBooks } from '../hooks/useBooks'
import { resolveArchivePdfUrl, downloadPdf } from '../utils/freeBookFile'

const PdfViewerSheet = lazy(() => import('../components/ui/PdfViewerSheet'))

const SOURCES = [
  { key: 'archive',   labelKey: 'bookfree_source_archive' },
  { key: 'gutenberg', labelKey: 'bookfree_source_gutenberg' },
  { key: 'google',    labelKey: 'bookfree_source_google' },
]

const SOURCE_BADGE = {
  archive:   { label: 'Internet Archive', className: 'bg-sky-50 text-sky-700 border-sky-100' },
  gutenberg: { label: 'Gutenberg',        className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  google:    { label: 'Google Books',     className: 'bg-amber-50 text-amber-700 border-amber-100' },
}

// Resuelve (si hace falta) la URL real del PDF de un libro antes de leerlo/descargarlo.
async function resolvePdfUrl(book) {
  if (book.pdfUrl) return book.pdfUrl
  if (book.source === 'archive' && book.hasPdf) return resolveArchivePdfUrl(book.identifier)
  return null
}

function FreeBookItem({ book, onRead, resolvingId, onDownload, downloadingId, onSave, isSaved }) {
  const badge = SOURCE_BADGE[book.source]
  const canPdf = book.source !== 'google'
  const isResolving   = resolvingId === book.id
  const isDownloading = downloadingId === book.id

  return (
    <div className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
      <button onClick={() => onRead(book)} className="flex-shrink-0">
        {book.thumbnail ? (
          <img src={book.thumbnail} alt="" className="w-14 h-20 object-cover rounded-xl shadow-sm" />
        ) : (
          <div className="w-14 h-20 bg-slate-100 rounded-xl flex items-center justify-center">
            <BookOpen size={20} className="text-slate-300" />
          </div>
        )}
      </button>

      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <button onClick={() => onRead(book)} className="text-left">
          <p className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">{book.title}</p>
          {book.authors?.length > 0 && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{book.authors.join(', ')}</p>
          )}
          {book.year && <p className="text-[10px] text-slate-300 mt-0.5">{book.year}</p>}
        </button>

        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
          {badge && (
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${badge.className}`}>
              {badge.label}
            </span>
          )}
          {book.formatLabel && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-slate-50 text-slate-600 border-slate-100">
              {book.formatLabel}
            </span>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => onSave(book)}
              className={`p-1.5 rounded-full active:scale-90 transition-all ${isSaved ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}
              title={isSaved ? 'Quitar de tu biblioteca' : 'Guardar en tu biblioteca'}
            >
              {isSaved ? <BookmarkCheck size={13} /> : <BookmarkPlus size={13} />}
            </button>
            {canPdf && (
              <button
                onClick={() => onDownload(book)}
                disabled={isDownloading}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 disabled:opacity-40"
                title="Descargar PDF"
              >
                {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              </button>
            )}
            <button
              onClick={() => onRead(book)}
              disabled={isResolving}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 text-white rounded-full text-xs font-semibold active:scale-95 transition-all disabled:opacity-60"
            >
              {isResolving
                ? <Loader2 size={12} className="animate-spin" />
                : book.source === 'google' ? <ExternalLink size={12} /> : <BookOpenText size={12} />}
              {book.source === 'google' ? 'Ver' : 'Leer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeaturedTile({ book, onRead, resolvingId, onSave, isSaved }) {
  const isResolving = resolvingId === book.id
  return (
    <div className="flex flex-col items-start text-left">
      <button onClick={() => onRead(book)} className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-sm bg-slate-100">
        {book.thumbnail ? (
          <img src={book.thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={20} className="text-slate-300" />
          </div>
        )}
        {isResolving && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 size={18} className="animate-spin text-white" />
          </div>
        )}
        <span
          role="button"
          onClick={e => { e.stopPropagation(); onSave(book) }}
          className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${isSaved ? 'bg-green-500 text-white' : 'bg-white/90 text-slate-500'}`}
        >
          {isSaved ? <BookmarkCheck size={12} /> : <BookmarkPlus size={12} />}
        </span>
      </button>
      <p className="text-[10px] font-semibold text-slate-700 mt-1 line-clamp-2 leading-tight">{book.title}</p>
    </div>
  )
}

export default function BookfreePage() {
  const { user, t } = useAuth()
  const { results, loading, error, query, setQuery, search, clear, featured, featuredLoading, loadFeatured } = useFreeBooks()
  const { books, addBook, removeBook } = useBooks(user?.uid)
  const [activeSources, setActiveSources] = useState(SOURCES.map(s => s.key))
  const [kidsOnly, setKidsOnly]         = useState(false)
  const [viewerBook, setViewerBook]     = useState(null)
  const [resolvingId, setResolvingId]   = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)
  const inputRef = useRef(null)

  const savedIds = useMemo(
    () => new Set(books.filter(b => b.freeSource).map(b => b.bookId)),
    [books]
  )

  useEffect(() => { loadFeatured(kidsOnly) }, [loadFeatured, kidsOnly])

  function handleSubmit(e) {
    e.preventDefault()
    search(query, activeSources, kidsOnly)
    inputRef.current?.blur()
  }

  function handleClear() {
    clear()
    inputRef.current?.focus()
  }

  function toggleSource(key) {
    if (kidsOnly && key === 'archive') return // Internet Archive no participa del modo Kids
    setActiveSources(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      const finalSources = next.length ? next : [key]
      if (query.trim()) search(query, finalSources, kidsOnly)
      return finalSources
    })
  }

  function toggleKids() {
    setKidsOnly(prev => {
      const next = !prev
      // Al activar Kids, Internet Archive se saca de los resultados (ver useFreeBooks).
      const sources = next ? activeSources.filter(s => s !== 'archive') : activeSources
      if (next && sources.length === 0) sources.push('gutenberg')
      setActiveSources(sources)
      if (query.trim()) search(query, sources, next)
      return next
    })
  }

  async function handleRead(book) {
    if (book.source === 'google') {
      window.open(book.readUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setResolvingId(book.id)
    const pdfUrl = await resolvePdfUrl(book)
    setResolvingId(null)
    if (pdfUrl) {
      setViewerBook({ ...book, pdfUrl })
    } else {
      window.open(book.readUrl, '_blank', 'noopener,noreferrer')
    }
  }

  async function handleSave(book) {
    if (!user?.uid) return
    if (savedIds.has(book.id)) {
      await removeBook(user.uid, book.id)
      return
    }
    await addBook(user.uid, book.id, {
      title: book.title,
      authors: book.authors || [],
      thumbnail: book.thumbnail || null,
      status: 'library',
      isFavorite: false,
      inLibrary: true,
      // Metadata para reabrir el PDF in-app desde la Biblioteca (ver LibraryPage).
      freeSource: book.source,
      freeIdentifier: book.identifier || null,
      freeReadUrl: book.readUrl || null,
      freePdfUrl: book.pdfUrl || null,
    })
  }

  async function handleDownload(book) {
    setDownloadingId(book.id)
    try {
      const pdfUrl = await resolvePdfUrl(book)
      if (!pdfUrl) {
        window.open(book.readUrl, '_blank', 'noopener,noreferrer')
        return
      }
      const filename = `${(book.title || 'libro').replace(/[^\w\s.-]/g, '').slice(0, 60)}.pdf`
      await downloadPdf(pdfUrl, filename)
    } catch (e) {
      console.error('Download error:', e)
    } finally {
      setDownloadingId(null)
    }
  }

  const showFeatured = !loading && !query.trim() && results.length === 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Gift size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">{t('bookfree_title')}</h1>
            <p className="text-[11px] text-slate-400">{t('bookfree_subtitle')}</p>
          </div>
        </div>

        {/* Source filter chips */}
        <div className="flex gap-1.5 mb-2">
          {SOURCES.map(s => {
            const disabledByKids = kidsOnly && s.key === 'archive'
            return (
              <button
                key={s.key}
                onClick={() => toggleSource(s.key)}
                disabled={disabledByKids}
                className={`flex-1 py-1.5 rounded-full text-[11px] font-semibold transition-all disabled:opacity-30 ${
                  activeSources.includes(s.key) && !disabledByKids
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {t(s.labelKey)}
              </button>
            )
          })}
        </div>

        {/* Filtro Kids */}
        <div className="flex mb-3">
          <button
            onClick={toggleKids}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
              kidsOnly
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            }`}
          >
            🧒 {t('bookfree_kids')}
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('bookfree_placeholder')}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-rose-400 transition-all"
            />
            {query && (
              <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X size={13} />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="px-4 py-2.5 bg-rose-500 text-white rounded-2xl text-xs font-semibold disabled:opacity-40 active:scale-95 transition-all shadow-sm"
          >
            {t('nav_search')}
          </button>
        </form>
      </div>

      {/* Contenido */}
      <div className="px-4 py-4 flex flex-col gap-3">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin mb-3 text-rose-400" />
            <p className="text-sm">{t('bookfree_searching')}</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-10 text-sm text-red-400 px-4">{error}</div>
        )}

        {!loading && !error && results.length === 0 && query.trim() && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold text-slate-600">{t('bookfree_no_results')}</p>
            <p className="text-sm mt-1">{t('bookfree_try_another')}</p>
          </div>
        )}

        {!loading && results.map(book => (
          <FreeBookItem
            key={book.id}
            book={book}
            onRead={handleRead}
            onDownload={handleDownload}
            resolvingId={resolvingId}
            downloadingId={downloadingId}
            onSave={handleSave}
            isSaved={savedIds.has(book.id)}
          />
        ))}

        {/* Catálogo de destacados/más descargados: se ve siempre que no hay búsqueda activa */}
        {showFeatured && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-bold text-slate-700">{t('bookfree_featured_title')}</p>
            </div>
            {featuredLoading && featured.length === 0 ? (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="animate-spin text-rose-400" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {featured.map(book => (
                  <FeaturedTile
                    key={book.id}
                    book={book}
                    onRead={handleRead}
                    resolvingId={resolvingId}
                    onSave={handleSave}
                    isSaved={savedIds.has(book.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {viewerBook && (
        <Suspense fallback={
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-white" />
          </div>
        }>
          <PdfViewerSheet
            url={viewerBook.pdfUrl}
            title={viewerBook.title}
            onClose={() => setViewerBook(null)}
          />
        </Suspense>
      )}
    </div>
  )
}
