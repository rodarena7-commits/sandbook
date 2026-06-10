import { useState, useRef } from 'react'
import { Search, X, BookOpen, Plus, Check, Loader2, Camera, Star, ThumbsUp, ThumbsDown, CalendarDays, ExternalLink, ShoppingCart } from 'lucide-react'
import { useMercadoLibrePrice } from '../hooks/useMercadoLibrePrice'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { createReadingPlan, createRelaxPlan } from '../hooks/useReadingPlan'
import { useAuth } from '../contexts/AuthContext'
import { useBooks } from '../hooks/useBooks'
import { useGoogleBooks } from '../hooks/useGoogleBooks'
import BarcodeScanner from '../components/books/BarcodeScanner'
import BookDetailSheet from '../components/books/BookDetailSheet'

const SEARCH_TYPES = [
  { key: 'title',  label: 'Título' },
  { key: 'author', label: 'Autor' },
  { key: 'isbn',   label: 'ISBN' },
]

const PLACEHOLDERS = {
  title:  'Buscá por título…',
  author: 'Nombre del autor…',
  isbn:   'Código ISBN (10 o 13 dígitos)…',
}

const STATUS_LABELS = {
  reading: 'Leyendo',
  read:    'Leído',
  pending: 'Pendiente',
  library: 'Biblioteca',
  ebook:   'Ebook',
  loaned:  'Prestado',
}

// ── IDs de afiliado ───────────────────────────────────────────────────
const AMAZON_TAG    = '7772603777-21'  // Amazon España (afiliados.amazon.es)
const ML_PARTNER_ID = ''              // MercadoLibre — pegar el número de seguimiento de la etiqueta "sandbook"

function getAmazonLink(book) {
  const q = book.isbn13 || book.isbn10 || `${book.title} ${book.authors?.[0] || ''}`.trim()
  return `https://www.amazon.es/s?k=${encodeURIComponent(q)}&i=stripbooks&tag=${AMAZON_TAG}`
}


// ── Search Result Item ─────────────────────────────────────
function SearchResultItem({ book, savedBook, uid, onView, onAddPress }) {
  const [isFav, setIsFav] = useState(savedBook?.isFavorite || false)
  const [reaction, setReaction] = useState(savedBook?.myReaction || null)
  const { mlPrice, mlLoading, mlUrl } = useMercadoLibrePrice(book)

  async function handleFav(e) {
    e.stopPropagation()
    const next = !isFav
    setIsFav(next)
    if (savedBook) {
      await setDoc(doc(db, 'users', uid, 'myBooks', book.bookId), { isFavorite: next }, { merge: true })
    } else {
      await setDoc(doc(db, 'bookReactions', book.bookId, 'votes', uid), { isFavorite: next }, { merge: true })
    }
  }

  async function handleReaction(e, type) {
    e.stopPropagation()
    const next = reaction === type ? null : type
    setReaction(next)
    if (savedBook) {
      await setDoc(doc(db, 'users', uid, 'myBooks', book.bookId), { myReaction: next }, { merge: true })
    } else {
      await setDoc(doc(db, 'bookReactions', book.bookId, 'votes', uid), { reaction: next }, { merge: true })
    }
  }

  return (
    <div className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
      <div className="flex-shrink-0 cursor-pointer" onClick={() => onView(book)}>
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
          {book.publishedDate && (
            <p className="text-[10px] text-slate-300 mt-0.5">{book.publishedDate.slice(0, 4)}</p>
          )}
          {book.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{book.description}</p>
          )}

          {/* Price + buy buttons */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
            {book.price != null && book.buyLink && (
              <a
                href={book.buyLink}
                target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-semibold border border-blue-100 active:scale-95 transition-all"
              >
                <ExternalLink size={9} />
                USD {book.price.toFixed(2)} · Google Play
              </a>
            )}
            <a
              href={getAmazonLink(book)}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-semibold border border-amber-100 active:scale-95 transition-all"
            >
              <ShoppingCart size={9} />
              Amazon
            </a>
            <a
              href={mlPrice?.url || mlUrl}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border active:scale-95 transition-all"
              style={{ background: '#e8f1ff', color: '#3483FA', borderColor: '#b8d4f5' }}
            >
              <ShoppingCart size={9} />
              {mlLoading ? '…' : mlPrice ? `$ ${mlPrice.price.toLocaleString('es-AR')}` : 'MercadoLibre'}
            </a>
          </div>
        </div>

        {/* Reactions + actions */}
        <div className="flex items-center gap-1.5 mt-2">
          {/* Star */}
          <button onClick={handleFav}
            className={`p-1.5 rounded-full transition-all ${isFav ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-400 hover:text-amber-400'}`}>
            <Star size={13} className={isFav ? 'fill-amber-400' : ''} />
          </button>
          {/* Like */}
          <button onClick={e => handleReaction(e, 'like')}
            className={`p-1.5 rounded-full transition-all ${reaction === 'like' ? 'bg-blue-100 text-blue-500' : 'bg-slate-100 text-slate-400 hover:text-blue-400'}`}>
            <ThumbsUp size={13} />
          </button>
          {/* Dislike */}
          <button onClick={e => handleReaction(e, 'dislike')}
            className={`p-1.5 rounded-full transition-all ${reaction === 'dislike' ? 'bg-red-100 text-red-400' : 'bg-slate-100 text-slate-400 hover:text-red-400'}`}>
            <ThumbsDown size={13} />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => onView(book)}
              className="px-3 py-1.5 border border-amber-400 text-amber-500 rounded-full text-xs font-semibold active:scale-95 transition-all">
              Ver
            </button>
            {savedBook ? (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                <Check size={11} /> {STATUS_LABELS[savedBook.status] || 'Guardado'}
              </span>
            ) : (
              <button onClick={() => onAddPress(book)}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-all">
                <Plus size={12} /> Agregar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function SearchPage({ onGoToPlan }) {
  const { user } = useAuth()
  const { books, addBook } = useBooks(user?.uid)
  const { results, loading, error, query, setQuery, search, clear } = useGoogleBooks()

  const [searchType, setSearchType] = useState('title')
  const [selectedBook, setSelectedBook] = useState(null)
  const [viewBook, setViewBook] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const inputRef = useRef(null)

  const savedMap = Object.fromEntries(books.map(b => [b.bookId, b]))

  function handleSubmit(e) {
    e.preventDefault()
    search(query, searchType)
    inputRef.current?.blur()
  }

  function handleClear() {
    clear()
    inputRef.current?.focus()
  }

  function handleScan(isbn) {
    setShowScanner(false)
    setQuery(isbn)
    search(isbn, 'isbn')
  }

  function handleTypeChange(type) {
    setSearchType(type)
    clear()
    inputRef.current?.focus()
  }

  async function handleAdd(book, status) {
    await addBook(user.uid, book.bookId, {
      title: book.title,
      authors: book.authors,
      thumbnail: book.thumbnail,
      description: book.description,
      pageCount: book.pageCount,
      publishedDate: book.publishedDate,
      categories: book.categories,
      status,
      isFavorite: false,
      inLibrary: true,
    })
  }

  async function handleCreatePlan(book, planData) {
    // Add to library first if not already there
    const pages = planData.pages || 0
    const days = planData.days || 0
    if (!savedMap[book.bookId]) {
      await addBook(user.uid, book.bookId, {
        title: book.title,
        authors: book.authors,
        thumbnail: book.thumbnail,
        description: book.description,
        pageCount: book.pageCount || pages,
        publishedDate: book.publishedDate,
        categories: book.categories,
        status: 'library',
        isFavorite: false,
        inLibrary: true,
      })
    }
    // Create the reading plan
    if (planData.type === 'relax') {
      await createRelaxPlan(user.uid, book.bookId, pages)
    } else {
      await createReadingPlan(user.uid, book.bookId, pages, days)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-slate-800">Buscar libros</h1>
          {onGoToPlan && (
            <button
              onClick={onGoToPlan}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-semibold active:scale-95 transition-all"
            >
              <CalendarDays size={13} className="text-amber-500" />
              Planes
            </button>
          )}
        </div>

        {/* Type selector */}
        <div className="flex gap-1.5 mb-3">
          {SEARCH_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => handleTypeChange(t.key)}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
                searchType === t.key
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {t.label}
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
              placeholder={PLACEHOLDERS[searchType]}
              inputMode={searchType === 'isbn' ? 'numeric' : 'text'}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400 transition-all"
            />
            {query ? (
              <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X size={13} />
              </button>
            ) : searchType === 'isbn' ? (
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500"
              >
                <Camera size={16} />
              </button>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="px-4 py-2.5 bg-amber-500 text-white rounded-2xl text-xs font-semibold disabled:opacity-40 active:scale-95 transition-all shadow-sm"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="px-4 py-4 flex flex-col gap-3">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin mb-3 text-amber-400" />
            <p className="text-sm">Buscando…</p>
          </div>
        )}

        {error && (
          <div className="text-center py-10 text-sm text-red-400 px-4">{error}</div>
        )}

        {!loading && results.length === 0 && !error && query.trim() && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-slate-600">Sin resultados</p>
            <p className="text-sm mt-1">Probá con otro {searchType === 'author' ? 'autor' : searchType === 'isbn' ? 'código' : 'título'}</p>
          </div>
        )}

        {!loading && results.length === 0 && !query.trim() && (
          <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
            {searchType === 'isbn' ? (
              <>
                <p className="text-5xl mb-4">📷</p>
                <p className="font-semibold text-slate-600">Buscar por ISBN</p>
                <p className="text-sm mt-1">Escribí el código o tocá la cámara para escanearlo</p>
                <button
                  onClick={() => setShowScanner(true)}
                  className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-2xl text-sm font-semibold shadow-sm active:scale-95 transition-all"
                >
                  <Camera size={16} /> Escanear código de barras
                </button>
              </>
            ) : searchType === 'author' ? (
              <>
                <p className="text-5xl mb-4">✍️</p>
                <p className="font-semibold text-slate-600">Buscar por autor</p>
                <p className="text-sm mt-1">Escribí el nombre completo o parcial del autor</p>
              </>
            ) : (
              <>
                <p className="text-5xl mb-4">📖</p>
                <p className="font-semibold text-slate-600">Buscá tu próximo libro</p>
                <p className="text-sm mt-1">Escribí el título del libro</p>
              </>
            )}
          </div>
        )}

        {!loading && results.map(book => (
          <SearchResultItem
            key={book.bookId}
            book={book}
            savedBook={savedMap[book.bookId]}
            uid={user?.uid}
            onView={setViewBook}
            onAddPress={setSelectedBook}
          />
        ))}
      </div>

      {/* Centered Add Modal */}
      {selectedBook && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedBook(null)} />
          <BookDetailSheet
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
            onAdd={handleAdd}
            onCreatePlan={(planData) => handleCreatePlan(selectedBook, planData)}
          />
        </>
      )}

      {/* View detail (with Ver button) */}
      {viewBook && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setViewBook(null)} />
          <BookDetailSheet
            book={{ ...viewBook, ...(savedMap[viewBook.bookId] || {}) }}
            onClose={() => setViewBook(null)}
            onAdd={savedMap[viewBook.bookId] ? undefined : handleAdd}
            onCreatePlan={(planData) => handleCreatePlan(viewBook, planData)}
          />
        </>
      )}

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
