import { useState, useRef } from 'react'
import { Search, X, BookOpen, Loader2, Gift, ExternalLink } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useFreeBooks } from '../hooks/useFreeBooks'

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

function FreeBookItem({ book }) {
  const badge = SOURCE_BADGE[book.source]
  return (
    <a
      href={book.readUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 active:bg-slate-50"
    >
      <div className="flex-shrink-0">
        {book.thumbnail ? (
          <img src={book.thumbnail} alt="" className="w-14 h-20 object-cover rounded-xl shadow-sm" />
        ) : (
          <div className="w-14 h-20 bg-slate-100 rounded-xl flex items-center justify-center">
            <BookOpen size={20} className="text-slate-300" />
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <div>
          <p className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">{book.title}</p>
          {book.authors?.length > 0 && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{book.authors.join(', ')}</p>
          )}
          {book.year && <p className="text-[10px] text-slate-300 mt-0.5">{book.year}</p>}
        </div>

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
          <span className="ml-auto flex items-center gap-1 text-[10px] text-rose-500 font-semibold">
            <ExternalLink size={11} />
          </span>
        </div>
      </div>
    </a>
  )
}

export default function BookfreePage() {
  const { t } = useAuth()
  const { results, loading, error, query, setQuery, search, clear } = useFreeBooks()
  const [activeSources, setActiveSources] = useState(SOURCES.map(s => s.key))
  const inputRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    search(query, activeSources)
    inputRef.current?.blur()
  }

  function handleClear() {
    clear()
    inputRef.current?.focus()
  }

  function toggleSource(key) {
    setActiveSources(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      const finalSources = next.length ? next : [key]
      if (query.trim()) search(query, finalSources)
      return finalSources
    })
  }

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
        <div className="flex gap-1.5 mb-3">
          {SOURCES.map(s => (
            <button
              key={s.key}
              onClick={() => toggleSource(s.key)}
              className={`flex-1 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                activeSources.includes(s.key)
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {t(s.labelKey)}
            </button>
          ))}
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

      {/* Results */}
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

        {!loading && results.length === 0 && !query.trim() && (
          <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
            <p className="text-5xl mb-4">🎁</p>
            <p className="font-semibold text-slate-600">{t('bookfree_empty_title')}</p>
            <p className="text-sm mt-1 px-6">{t('bookfree_empty_sub')}</p>
          </div>
        )}

        {!loading && results.map(book => (
          <FreeBookItem key={book.id} book={book} />
        ))}
      </div>
    </div>
  )
}
