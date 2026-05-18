import { useState, useEffect } from 'react'
import { X, Star, BookOpen, ChevronDown, Trash2, ZoomIn, Send, User, ThumbsUp, Users, ImagePlus, CalendarDays, Loader2 } from 'lucide-react'
import { useAuthorBooks } from '../../hooks/useAuthorBooks'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { useBookReviews } from '../../hooks/useBookReviews'
import { useAuthor } from '../../hooks/useAuthor'
import { useBookStats } from '../../hooks/useBookStats'
import ImagePickerSheet from '../ui/ImagePickerSheet'

const STATUS_LABELS = { reading: 'Leyendo', read: 'Leído', pending: 'Pendiente', library: 'Biblioteca' }
const STATUS_COLORS = {
  reading: 'bg-amber-500 text-white',
  read:    'bg-green-500 text-white',
  pending: 'bg-slate-200 text-slate-600',
  library: 'bg-blue-500 text-white',
}
const ADD_OPTIONS = [
  { key: 'reading', label: 'Leyendo ahora',  color: 'bg-amber-500 text-white' },
  { key: 'pending', label: 'Quiero leer',     color: 'bg-slate-100 text-slate-700 border border-slate-200' },
  { key: 'read',    label: 'Ya lo leí',       color: 'bg-green-100 text-green-700' },
  { key: 'library', label: 'Solo guardar',    color: 'bg-blue-100 text-blue-600' },
]
const RATING_LABELS = ['', 'No me gustó', 'Estuvo bien', 'Bueno', 'Muy bueno', 'Excelente']

function largeCover(url) {
  if (!url) return null
  return url.replace('zoom=1', 'zoom=0').replace('&edge=curl', '')
}

function StarRating({ value, onChange, size = 28, readonly = false }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(n === value ? 0 : n)}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={readonly ? 'cursor-default' : 'transition-transform active:scale-90'}
        >
          <Star
            size={size}
            className={n <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
          />
        </button>
      ))}
    </div>
  )
}

function StatusMenu({ current, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${STATUS_COLORS[current] || STATUS_COLORS.library}`}
      >
        {STATUS_LABELS[current] || 'Biblioteca'} <ChevronDown size={13} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden min-w-[150px]">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => { onChange(key); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 ${current === key ? 'font-semibold text-amber-600' : 'text-slate-700'}`}>
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function AuthorSection({ authorName }) {
  const author = useAuthor(authorName)
  const [expanded, setExpanded] = useState(false)

  if (!authorName) return null

  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Autor</p>
      <div className="flex gap-3 items-start">
        {author?.photoUrl ? (
          <img
            src={author.photoUrl}
            alt={authorName}
            className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 flex-shrink-0"
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            <User size={22} className="text-slate-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">{author?.name || authorName}</p>
          {author?.birthDate && <p className="text-xs text-slate-400 mt-0.5">{author.birthDate}</p>}
          {author?.workCount > 0 && (
            <p className="text-xs text-slate-400">{author.workCount} obras</p>
          )}
          {author?.bio && (
            <>
              <p className={`text-xs text-slate-500 leading-relaxed mt-1.5 ${expanded ? '' : 'line-clamp-3'}`}>
                {author.bio}
              </p>
              {author.bio.length > 120 && (
                <button onClick={() => setExpanded(v => !v)} className="text-xs text-amber-500 mt-1">
                  {expanded ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </>
          )}
          {!author && (
            <p className="text-xs text-slate-300 mt-1">Cargando…</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Author Books Carousel ──────────────────────────────────
function AuthorBooksCarousel({ authorName, currentBookId }) {
  const { books, loading } = useAuthorBooks(authorName, currentBookId)
  const [selected, setSelected] = useState(null)

  if (loading) {
    return (
      <div className="mb-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Más de {authorName}</p>
        <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-amber-400"/></div>
      </div>
    )
  }
  if (!books.length) return null

  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
        Más de {authorName}
      </p>

      {/* Carousel */}
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 -mx-5 px-5">
        {books.map(b => (
          <button
            key={b.bookId}
            onClick={() => setSelected(b)}
            className="flex-shrink-0 w-[72px] text-left active:scale-95 transition-all"
          >
            {b.thumbnail ? (
              <img src={b.thumbnail} alt={b.title}
                className="w-[72px] h-[104px] object-cover rounded-xl shadow-sm border border-slate-100" />
            ) : (
              <div className="w-[72px] h-[104px] bg-slate-100 rounded-xl flex items-center justify-center">
                <BookOpen size={16} className="text-slate-300" />
              </div>
            )}
            <p className="text-[9px] text-slate-500 mt-1.5 line-clamp-2 text-center leading-tight">
              {b.title}
            </p>
            {b.publishedDate && (
              <p className="text-[8px] text-slate-300 text-center">{b.publishedDate.slice(0,4)}</p>
            )}
          </button>
        ))}
      </div>

      {/* Selected book mini-detail */}
      {selected && (
        <div className="mt-3 bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <div className="flex gap-3 items-start">
            {selected.thumbnail ? (
              <img src={selected.thumbnail} alt="" className="w-12 h-16 object-cover rounded-xl shadow-sm flex-shrink-0"/>
            ) : (
              <div className="w-12 h-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen size={14} className="text-slate-300"/>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 line-clamp-2">{selected.title}</p>
              {selected.publishedDate && <p className="text-xs text-slate-400 mt-0.5">{selected.publishedDate.slice(0,4)}</p>}
              {selected.pageCount > 0 && <p className="text-xs text-slate-400">{selected.pageCount} páginas</p>}
              {selected.description && (
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">{selected.description}</p>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-300 hover:text-slate-500 flex-shrink-0">
              <X size={14}/>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewsSection({ bookId, bookMeta, myUid, myProfile }) {
  const { reviews, loading, submitReview, avgRating } = useBookReviews(bookId, bookMeta)
  const [myRating, setMyRating] = useState(0)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)

  const myReview = reviews.find(r => r.uid === myUid)

  useEffect(() => {
    if (myReview) {
      setMyRating(myReview.rating || 0)
      setComment(myReview.comment || '')
    }
  }, [myReview?.uid])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!comment.trim() && !myRating) return
    setSending(true)
    await submitReview(myUid, myProfile?.displayName || 'Lector', myProfile?.photoURL, myRating, comment)
    setSending(false)
  }

  const withRating = reviews.filter(r => r.rating > 0)

  return (
    <div>
      {/* Aggregate */}
      {withRating.length > 0 && (
        <div className="flex items-center gap-2 mb-4 bg-amber-50 rounded-2xl px-4 py-3">
          <p className="text-2xl font-bold text-amber-500">{avgRating.toFixed(1)}</p>
          <div>
            <StarRating value={Math.round(avgRating)} size={14} readonly />
            <p className="text-[10px] text-slate-400 mt-0.5">{withRating.length} calificacion{withRating.length !== 1 ? 'es' : ''}</p>
          </div>
        </div>
      )}

      {/* Write review */}
      <div className="mb-5 bg-slate-50 rounded-2xl p-4">
        <p className="text-xs font-semibold text-slate-500 mb-2">
          {myReview ? 'Tu reseña' : 'Escribí tu opinión'}
        </p>
        <StarRating value={myRating} onChange={setMyRating} size={24} />
        {myRating > 0 && (
          <p className="text-xs text-amber-500 mt-1 mb-2">{RATING_LABELS[myRating]}</p>
        )}
        <form onSubmit={handleSubmit} className="mt-2">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Contá qué te pareció el libro…"
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-300 outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-slate-300">{comment.length}/500</span>
            <button
              type="submit"
              disabled={(!comment.trim() && !myRating) || sending}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-white rounded-full text-xs font-semibold disabled:opacity-40 active:scale-95 transition-all"
            >
              <Send size={11} /> {myReview ? 'Actualizar' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>

      {/* Others' reviews */}
      {loading && <p className="text-xs text-slate-300 text-center py-4">Cargando opiniones…</p>}
      {!loading && reviews.filter(r => r.uid !== myUid).length === 0 && (
        <p className="text-xs text-slate-300 text-center py-2">Todavía no hay opiniones de otros lectores</p>
      )}
      <div className="flex flex-col gap-3">
        {reviews.filter(r => r.uid !== myUid).map(r => (
          <div key={r.id} className="flex gap-2.5">
            {r.photoURL ? (
              <img src={r.photoURL} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400 text-xs font-bold">
                {(r.displayName || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 bg-slate-50 rounded-2xl px-3 py-2.5">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-slate-700">{r.displayName || 'Lector'}</p>
                {r.rating > 0 && <StarRating value={r.rating} size={10} readonly />}
              </div>
              {r.comment && <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function BookDetailSheet({
  book, onClose,
  // Library mode
  onStatusChange, onToggleFavorite, onSaveRating, onRemove,
  // Search mode (book not yet saved)
  onAdd,
}) {
  const { user, profile } = useAuth()
  const [lightbox, setLightbox] = useState(false)
  const [rating, setRating] = useState(book.rating || 0)
  const [rateSaving, setRateSaving] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)

  const [customThumb, setCustomThumb] = useState(book.customThumbnail || null)
  const [showImgPicker, setShowImgPicker] = useState(false)
  const cover = customThumb || largeCover(book.thumbnail)
  const isLibrary = !!onStatusChange
  const stats = useBookStats(book.bookId)

  async function handleRating(n) {
    setRating(n)
    setRateSaving(true)
    await onSaveRating(book.bookId, n)
    setRateSaving(false)
  }

  async function handleAdd(status) {
    setAdding(true)
    await onAdd(book, status)
    setAdding(false)
    setAddOpen(false)
    onClose()
  }

  async function handleRemove() {
    onClose()
    await onRemove(book.bookId)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end">
        <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl max-h-[94vh] flex flex-col">

          {/* Top bar */}
          <div className="relative flex items-center justify-center px-5 pt-3 pb-2 flex-shrink-0">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-200 rounded-full" />
            <button onClick={onClose} className="absolute right-4 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-5 pb-10 pt-1">

            {/* Cover + title */}
            <div className="flex gap-4 mb-5">
              <div className="flex-shrink-0 relative group">
                {cover ? (
                  <>
                    <img src={cover} alt={book.title}
                      className="w-28 rounded-2xl shadow-md object-cover cursor-pointer"
                      onClick={() => setLightbox(true)} />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-2xl transition-all pointer-events-none">
                      <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    {isLibrary && (
                      <button onClick={() => setShowImgPicker(true)}
                        className="absolute bottom-1.5 right-1.5 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all">
                        <ImagePlus size={13} />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-28 aspect-[2/3] bg-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2">
                    <BookOpen size={24} className="text-slate-300" />
                    {isLibrary && (
                      <button onClick={() => setShowImgPicker(true)}
                        className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-white rounded-full text-[10px] font-medium">
                        <ImagePlus size={10} /> Agregar
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <h2 className="font-bold text-slate-800 text-base leading-tight mb-1">{book.title}</h2>
                  {book.authors?.length > 0 && (
                    <p className="text-sm text-slate-500">{book.authors.join(', ')}</p>
                  )}
                  <div className="flex flex-wrap gap-x-3 mt-1.5 text-xs text-slate-400">
                    {book.publishedDate && <span>{book.publishedDate.slice(0, 4)}</span>}
                    {book.pageCount > 0 && <span>{book.pageCount} pág.</span>}
                  </div>

                  {/* Global stats */}
                  {stats && (stats.likes > 0 || stats.readers > 0) && (
                    <div className="flex gap-3 mt-2">
                      {stats.likes > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-blue-500">
                          <ThumbsUp size={11} className="fill-blue-400" />
                          {stats.likes} {stats.likes === 1 ? 'like' : 'likes'}
                        </span>
                      )}
                      {stats.readers > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-green-500">
                          <Users size={11} />
                          {stats.readers} {stats.readers === 1 ? 'lo leyó' : 'lo leyeron'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isLibrary ? (
                  <button
                    onClick={() => onToggleFavorite(book.bookId, book.isFavorite)}
                    className="flex items-center gap-1.5 mt-3 text-xs font-medium w-fit"
                  >
                    <Star size={15} className={book.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                    <span className={book.isFavorite ? 'text-amber-500' : 'text-slate-400'}>
                      {book.isFavorite ? 'En favoritos' : 'Agregar a favoritos'}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => setAddOpen(true)}
                    className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-2xl text-sm font-semibold shadow-sm active:scale-95 transition-all w-fit"
                  >
                    + Agregar
                  </button>
                )}
              </div>
            </div>

            {/* Library: status + my rating */}
            {isLibrary && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs text-slate-400 font-medium">Estado:</span>
                  <StatusMenu current={book.status} onChange={s => onStatusChange(book.bookId, s)} />
                </div>
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Mi calificación {rateSaving && <span className="normal-case text-amber-400 font-normal">· guardando…</span>}
                  </p>
                  <StarRating value={rating} onChange={handleRating} size={28} />
                  {rating > 0 && <p className="text-xs text-slate-400 mt-1">{RATING_LABELS[rating]}</p>}
                </div>
              </>
            )}

            {/* Categories */}
            {book.categories?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {book.categories.map(c => (
                  <span key={c} className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-medium">{c}</span>
                ))}
              </div>
            )}

            {/* Description */}
            {book.description && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Sinopsis</p>
                <p className={`text-sm text-slate-600 leading-relaxed ${descExpanded ? '' : 'line-clamp-4'}`}>
                  {book.description}
                </p>
                {book.description.length > 200 && (
                  <button onClick={() => setDescExpanded(v => !v)} className="text-xs text-amber-500 mt-1">
                    {descExpanded ? 'Ver menos' : 'Ver más'}
                  </button>
                )}
              </div>
            )}

            {/* Author bio */}
            {book.authors?.length > 0 && (
              <AuthorSection authorName={book.authors[0]} />
            )}

            {/* More books by same author carousel */}
            {book.authors?.length > 0 && (
              <AuthorBooksCarousel authorName={book.authors[0]} currentBookId={book.bookId} />
            )}

            <div className="border-t border-slate-100 pt-5 mb-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Opiniones</p>
              <ReviewsSection bookId={book.bookId} bookMeta={book} myUid={user?.uid} myProfile={profile} />
            </div>

            {/* Plan de lectura (library only) */}
            {isLibrary && (
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => { onOpenPlan ? onOpenPlan(book) : onClose() }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl text-sm font-medium w-full active:scale-95 transition-all"
                >
                  <CalendarDays size={15} className="text-amber-500" />
                  {book.readingPlan ? 'Ver plan de lectura' : 'Crear plan de lectura'}
                </button>
                <button
                  onClick={handleRemove}
                  className="flex items-center gap-2 text-xs text-red-400 hover:text-red-500 mt-1"
                >
                  <Trash2 size={13} /> Eliminar de mi biblioteca
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Centered Add Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" onClick={() => setAddOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <div className="flex gap-3 mb-5">
              {cover ? (
                <img src={cover} alt="" className="w-14 h-20 object-cover rounded-xl shadow-sm flex-shrink-0" />
              ) : (
                <div className="w-14 h-20 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen size={20} className="text-slate-300" />
                </div>
              )}
              <div className="flex flex-col justify-center min-w-0">
                <p className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">{book.title}</p>
                {book.authors?.[0] && <p className="text-xs text-slate-400 mt-0.5">{book.authors[0]}</p>}
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Agregar como…</p>
            <div className="flex flex-col gap-2">
              {ADD_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  disabled={adding}
                  onClick={() => handleAdd(opt.key)}
                  className={`w-full py-3 rounded-2xl text-sm font-medium transition-all active:scale-95 ${opt.color} ${adding ? 'opacity-50' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => setAddOpen(false)} className="w-full mt-3 py-2.5 text-sm text-slate-400">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Book image picker */}
      {showImgPicker && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[65]" onClick={() => setShowImgPicker(false)} />
          <ImagePickerSheet
            title="Portada del libro"
            storagePath={`users/${user?.uid}/books/${book.bookId}`}
            onSave={async url => {
              setCustomThumb(url)
              await updateDoc(doc(db, 'users', user.uid, 'myBooks', book.bookId), { customThumbnail: url })
            }}
            onClose={() => setShowImgPicker(false)}
          />
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white">
            <X size={18} />
          </button>
          <img src={cover} alt={book.title} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}
