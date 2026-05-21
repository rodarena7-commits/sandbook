import { useState, useEffect, useRef } from 'react'
import { X, Search, Check, Loader2, ChevronRight, User, BookOpen } from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { useFavoriteAuthors } from '../../hooks/useFavoriteAuthors'
import { useGoogleBooks } from '../../hooks/useGoogleBooks'
import { getGlobalAuthorPhoto } from '../../hooks/useGlobalMedia'

const SEEN_KEY = 'sandbook_onboarding_v1'

// ── Tarjeta de autor con foto + biografía expandible ──────
function AuthorResult({ author, onAdd }) {
  const olid     = author.key?.replace('/authors/', '')
  const coverUrl = olid ? `https://covers.openlibrary.org/a/olid/${olid}-M.jpg` : null

  const [photo,      setPhoto]      = useState(null)
  const [bio,        setBio]        = useState(null)
  const [bioLoading, setBioLoading] = useState(false)
  const [expanded,   setExpanded]   = useState(false)
  const [added,      setAdded]      = useState(false)

  useEffect(() => {
    // foto global guardada por cualquier usuario (prioridad)
    getGlobalAuthorPhoto(author.name).then(url => { if (url) setPhoto(url) })
    // foto de OpenLibrary como fallback
    if (coverUrl) {
      const img = new Image()
      img.onload  = () => setPhoto(prev => prev || coverUrl)
      img.onerror = () => {}
      img.src = coverUrl
    }
  }, [author.name, coverUrl])

  async function fetchBio() {
    if (!olid || bio !== null) return
    setBioLoading(true)
    try {
      const res  = await fetch(`https://openlibrary.org/authors/${olid}.json`)
      const data = await res.json()
      const raw  = typeof data.bio === 'string' ? data.bio
                 : typeof data.bio?.value === 'string' ? data.bio.value : ''
      setBio(raw.replace(/\n+/g, ' ').slice(0, 350) || '')
    } catch { setBio('') }
    setBioLoading(false)
  }

  function toggleExpand() {
    if (!expanded) fetchBio()
    setExpanded(v => !v)
  }

  async function handleAdd() {
    await onAdd({
      name:      author.name,
      olid:      olid || null,
      photoUrl:  photo || null,
      topWork:   author.top_work   || null,
      workCount: author.work_count || 0,
    })
    setAdded(true)
  }

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${expanded ? 'border-rose-200' : 'border-slate-100'}`}>
      <button className="w-full flex items-center gap-3 p-3 text-left" onClick={toggleExpand}>
        {photo ? (
          <img src={photo} alt={author.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-amber-100 shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <User size={18} className="text-slate-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">{author.name}</p>
          {author.top_work  && <p className="text-xs text-slate-400 italic truncate">"{author.top_work}"</p>}
          {author.work_count > 0 && <p className="text-[10px] text-slate-400">{author.work_count} obras</p>}
        </div>
        {added && <Check size={14} className="text-green-500 shrink-0" />}
      </button>

      {expanded && (
        <div className="bg-rose-50 px-3 pb-3">
          {bioLoading ? (
            <div className="flex justify-center py-3">
              <Loader2 size={14} className="animate-spin text-slate-300" />
            </div>
          ) : bio ? (
            <p className="text-xs text-slate-600 leading-relaxed mb-3">{bio}</p>
          ) : null}
          {!added ? (
            <button onClick={handleAdd}
              className="w-full py-2 bg-rose-500 text-white rounded-xl text-xs font-semibold active:scale-95 transition-all">
              Agregar a favoritos
            </button>
          ) : (
            <p className="text-center text-xs text-green-600 font-semibold py-1">¡Guardado en tu perfil! ✨</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tarjeta de libro igual que SearchPage ─────────────────
function BookResult({ book, onAdd, added }) {
  return (
    <div className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
      <div className="flex-shrink-0">
        {book.thumbnail ? (
          <img src={book.thumbnail} alt="" className="w-12 h-[68px] object-cover rounded-xl shadow-sm" />
        ) : (
          <div className="w-12 h-[68px] bg-slate-100 rounded-xl flex items-center justify-center">
            <BookOpen size={16} className="text-slate-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
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
        </div>
        <div className="flex justify-end mt-2">
          {added ? (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
              <Check size={11} /> En tu biblioteca
            </span>
          ) : (
            <button onClick={() => onAdd(book)}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-all">
              + Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────
export default function OnboardingFlow() {
  const { user }             = useAuth()
  const { addFavoriteAuthor } = useFavoriteAuthors(user?.uid)
  const { results: bookResults, loading: bookLoading, search: searchBooks } = useGoogleBooks()

  // Inicializa síncronamente desde localStorage para evitar parpadeo
  const [visible,       setVisible]       = useState(() => !localStorage.getItem(SEEN_KEY))
  const [step,          setStep]          = useState(0)   // 0=autor 1=libro
  const [authorQ,       setAuthorQ]       = useState('')
  const [authorResults, setAuthorResults] = useState([])
  const [authorLoading, setAuthorLoading] = useState(false)
  const [addedBooks,    setAddedBooks]    = useState(new Set())

  const timer = useRef(null)

  function debounce(fn, value) {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(value), 450)
  }

  async function doAuthorSearch(q) {
    if (!q.trim()) { setAuthorResults([]); return }
    setAuthorLoading(true)
    try {
      const res  = await fetch(`https://openlibrary.org/search/authors.json?q=${encodeURIComponent(q)}&limit=6`)
      const data = await res.json()
      setAuthorResults(data.docs || [])
    } catch { setAuthorResults([]) }
    setAuthorLoading(false)
  }

  async function handleAddBook(book) {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid, 'myBooks', book.bookId), {
      bookId:      book.bookId,
      title:       book.title,
      authors:     book.authors  || [],
      thumbnail:   book.thumbnail || null,
      status:      'library',
      isFavorite:  true,
      checkpoints: [],
      rating:      0,
      review:      '',
      addedAt:     new Date().toISOString(),
    })
    setAddedBooks(prev => new Set([...prev, book.bookId]))
  }

  function finish() {
    localStorage.setItem(SEEN_KEY, '1')
    setVisible(false)
  }

  if (!visible || !user) return null

  const isAuthorStep = step === 0

  return (
    <div className="fixed inset-0 z-[185] flex items-center justify-center px-4 bg-black/60">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className={`${isAuthorStep ? 'bg-rose-500' : 'bg-amber-500'} px-6 pt-7 pb-5 text-center relative flex-shrink-0`}>
          <button onClick={finish}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 text-white">
            <X size={13} />
          </button>
          <div className="text-4xl mb-2">{isAuthorStep ? '✍️' : '📖'}</div>
          <h2 className="text-base font-bold text-white">
            {isAuthorStep ? 'Agrega a tu Escritor favorito' : 'Agrega tu libro que más te gusta'}
          </h2>
          <p className="text-white/80 text-xs mt-1">
            {isAuthorStep
              ? 'Tocá un autor para ver su biografía y seguirlo'
              : 'Buscá igual que en la sección Buscar'}
          </p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 py-2.5 flex-shrink-0">
          {[0, 1].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-amber-500' : 'w-1.5 bg-slate-200'}`} />
          ))}
        </div>

        {/* Search */}
        <div className="px-5 flex-shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              key={step}
              type="text"
              defaultValue=""
              onChange={e => {
                if (isAuthorStep) {
                  setAuthorQ(e.target.value)
                  debounce(doAuthorSearch, e.target.value)
                } else {
                  debounce(q => searchBooks(q, 'title'), e.target.value)
                }
              }}
              placeholder={isAuthorStep ? 'Nombre del escritor…' : 'Título o autor del libro…'}
              className={`w-full pl-9 pr-8 py-2.5 bg-slate-100 rounded-2xl text-sm outline-none focus:ring-2 ${isAuthorStep ? 'focus:ring-rose-300' : 'focus:ring-amber-300'}`}
            />
            {(isAuthorStep ? authorLoading : bookLoading) && (
              <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2" style={{ minHeight: 160 }}>
          {isAuthorStep ? (
            authorResults.length > 0
              ? authorResults.map(a => (
                  <AuthorResult key={a.key} author={a} onAdd={addFavoriteAuthor} />
                ))
              : <p className="text-xs text-slate-400 text-center py-8">
                  {authorQ ? `Sin resultados para "${authorQ}"` : 'Escribí el nombre de un escritor para buscarlo'}
                </p>
          ) : (
            bookResults.length > 0
              ? bookResults.map(b => (
                  <BookResult key={b.bookId} book={b} onAdd={handleAddBook} added={addedBooks.has(b.bookId)} />
                ))
              : <p className="text-xs text-slate-400 text-center py-8">
                  Buscá un libro para guardarlo en tu biblioteca
                </p>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-2 px-5 pb-5 pt-2 flex-shrink-0">
          <button onClick={finish}
            className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-2xl text-sm font-medium">
            Saltar
          </button>
          {isAuthorStep ? (
            <button onClick={() => setStep(1)}
              className="flex-1 py-3 bg-rose-500 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-1">
              Siguiente <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={finish}
              className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-sm font-semibold">
              ¡Empezar!
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
