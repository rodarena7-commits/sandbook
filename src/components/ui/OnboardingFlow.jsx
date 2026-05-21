import { useState, useEffect, useRef } from 'react'
import { X, Search, Check, Loader2, ChevronRight, User, BookOpen } from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { useFavoriteAuthors } from '../../hooks/useFavoriteAuthors'

const SEEN_KEY = 'sandbook_onboarding_v1'

export default function OnboardingFlow() {
  const { user } = useAuth()
  const { addFavoriteAuthor } = useFavoriteAuthors(user?.uid)

  const [visible,       setVisible]       = useState(false)
  const [step,          setStep]          = useState(0)       // 0=autor 1=libro

  const [authorQ,       setAuthorQ]       = useState('')
  const [authorResults, setAuthorResults] = useState([])
  const [authorLoading, setAuthorLoading] = useState(false)
  const [authorAdded,   setAuthorAdded]   = useState(null)

  const [bookQ,         setBookQ]         = useState('')
  const [bookResults,   setBookResults]   = useState([])
  const [bookLoading,   setBookLoading]   = useState(false)
  const [bookAdded,     setBookAdded]     = useState(null)

  const timer = useRef(null)

  useEffect(() => {
    if (!localStorage.getItem(SEEN_KEY)) setVisible(true)
  }, [])

  function debounce(fn, value) {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(value), 450)
  }

  async function searchAuthors(q) {
    if (!q.trim()) { setAuthorResults([]); return }
    setAuthorLoading(true)
    try {
      const res  = await fetch(`https://openlibrary.org/search/authors.json?q=${encodeURIComponent(q)}&limit=6`)
      const data = await res.json()
      setAuthorResults(data.docs || [])
    } catch { setAuthorResults([]) }
    setAuthorLoading(false)
  }

  async function searchBooks(q) {
    if (!q.trim()) { setBookResults([]); return }
    setBookLoading(true)
    try {
      const res  = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=6&langRestrict=es`)
      const data = await res.json()
      setBookResults(data.items || [])
    } catch { setBookResults([]) }
    setBookLoading(false)
  }

  async function handleAddAuthor(author) {
    await addFavoriteAuthor({
      name:      author.name,
      olid:      author.key?.replace('/authors/', '') || null,
      photoUrl:  null,
      topWork:   author.top_work  || null,
      workCount: author.work_count || 0,
    })
    setAuthorAdded(author.name)
    setAuthorResults([])
    setAuthorQ('')
  }

  async function handleAddBook(item) {
    if (!user) return
    const info   = item.volumeInfo
    const bookId = item.id
    await setDoc(doc(db, 'users', user.uid, 'myBooks', bookId), {
      bookId,
      title:     info.title,
      authors:   info.authors || [],
      thumbnail: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
      status:    'library',
      isFavorite: true,
      checkpoints: [],
      rating:    0,
      review:    '',
      addedAt:   new Date().toISOString(),
    })
    setBookAdded(info.title)
    setBookResults([])
    setBookQ('')
  }

  function finish() {
    localStorage.setItem(SEEN_KEY, '1')
    setVisible(false)
  }

  if (!visible || !user) return null

  const isAuthorStep = step === 0

  return (
    <div className="fixed inset-0 z-[185] flex items-center justify-center px-4 bg-black/60">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className={`${isAuthorStep ? 'bg-rose-500' : 'bg-amber-500'} px-6 pt-7 pb-6 text-center relative`}>
          <button onClick={finish}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 text-white">
            <X size={13} />
          </button>
          <div className="text-4xl mb-2">{isAuthorStep ? '✍️' : '📖'}</div>
          <h2 className="text-base font-bold text-white leading-snug">
            {isAuthorStep ? 'Agrega a tu Escritor favorito' : 'Agrega tu libro que más te gusta'}
          </h2>
          <p className="text-white/80 text-xs mt-1">
            {isAuthorStep
              ? 'Seguí autores y encontrá sus libros fácilmente'
              : 'Guardalo en tu biblioteca con un solo toque'}
          </p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 pt-3">
          {[0, 1].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-amber-500' : 'w-1.5 bg-slate-200'}`} />
          ))}
        </div>

        {/* Contenido */}
        <div className="px-5 pt-4 pb-2 min-h-[200px]">
          {isAuthorStep ? (
            <>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={authorQ}
                  onChange={e => { setAuthorQ(e.target.value); debounce(searchAuthors, e.target.value) }}
                  placeholder="Nombre del escritor…"
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-rose-300"
                />
                {authorLoading && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
              </div>

              {authorAdded && (
                <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-xl text-xs text-green-700 mb-2">
                  <Check size={13} className="shrink-0" />
                  <span><strong>{authorAdded}</strong> agregado a tus favoritos ✨</span>
                </div>
              )}

              <div className="space-y-0.5 max-h-40 overflow-y-auto">
                {authorResults.map(a => (
                  <button key={a.key} onClick={() => handleAddAuthor(a)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all text-left">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                      <User size={14} className="text-rose-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{a.name}</p>
                      {a.top_work && <p className="text-[10px] text-slate-400 truncate">{a.top_work}</p>}
                    </div>
                  </button>
                ))}
                {authorQ && !authorLoading && authorResults.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">Sin resultados para "{authorQ}"</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={bookQ}
                  onChange={e => { setBookQ(e.target.value); debounce(searchBooks, e.target.value) }}
                  placeholder="Título o autor del libro…"
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-amber-300"
                />
                {bookLoading && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
              </div>

              {bookAdded && (
                <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-xl text-xs text-green-700 mb-2">
                  <Check size={13} className="shrink-0" />
                  <span><strong className="line-clamp-1">{bookAdded}</strong> guardado en tu biblioteca ✨</span>
                </div>
              )}

              <div className="space-y-0.5 max-h-40 overflow-y-auto">
                {bookResults.map(item => {
                  const info = item.volumeInfo
                  return (
                    <button key={item.id} onClick={() => handleAddBook(item)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all text-left">
                      {info.imageLinks?.thumbnail
                        ? <img src={info.imageLinks.thumbnail} alt="" className="w-8 h-10 object-cover rounded shrink-0" />
                        : <div className="w-8 h-10 rounded bg-amber-100 flex items-center justify-center shrink-0">
                            <BookOpen size={14} className="text-amber-500" />
                          </div>
                      }
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 line-clamp-1">{info.title}</p>
                        {info.authors?.[0] && <p className="text-[10px] text-slate-400 truncate">{info.authors[0]}</p>}
                      </div>
                    </button>
                  )
                })}
                {bookQ && !bookLoading && bookResults.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">Sin resultados para "{bookQ}"</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-2 px-5 pb-5 pt-3">
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
