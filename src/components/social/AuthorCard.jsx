import { useState, useEffect } from 'react'
import { User, BookOpen, ChevronDown, ChevronUp, Heart, X, Upload } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getGlobalAuthorPhoto, saveGlobalAuthorPhoto } from '../../hooks/useGlobalMedia'
import ImagePickerSheet from '../ui/ImagePickerSheet'

// ── Book Detail Sheet (from author) ───────────────────────
function AuthorBookSheet({ book, author, allBooks, onClose }) {
  const otherBooks = allBooks.filter(b => b.bookId !== book.bookId)

  return (
    <div className="fixed inset-0 z-[70] flex items-end">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
          <p className="font-bold text-slate-800 text-sm line-clamp-1">{book.title}</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {/* Selected book */}
          <div className="flex gap-4 mb-5">
            {book.thumbnail
              ? <img src={book.thumbnail} alt="" className="w-24 rounded-2xl shadow-md object-cover flex-shrink-0"/>
              : <div className="w-24 aspect-[2/3] bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0"><BookOpen size={24} className="text-slate-300"/></div>
            }
            <div className="flex-1 min-w-0 py-1">
              <p className="font-bold text-slate-800 leading-tight">{book.title}</p>
              <p className="text-sm text-slate-500 mt-1">{author.name}</p>
              {book.publishedDate && <p className="text-xs text-slate-400 mt-0.5">{book.publishedDate.slice(0,4)}</p>}
              {book.pageCount > 0 && <p className="text-xs text-slate-400">{book.pageCount} páginas</p>}
            </div>
          </div>

          {/* More books by this author */}
          {otherBooks.length > 0 && (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Más libros de {author.name}
              </p>
              <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
                {otherBooks.map(b => (
                  <div key={b.bookId} className="flex-shrink-0 w-20">
                    {b.thumbnail
                      ? <img src={b.thumbnail} alt="" className="w-20 h-28 object-cover rounded-xl shadow-sm"/>
                      : <div className="w-20 h-28 bg-slate-100 rounded-xl flex items-center justify-center"><BookOpen size={16} className="text-slate-300"/></div>
                    }
                    <p className="text-[10px] text-slate-600 mt-1.5 line-clamp-2 text-center leading-tight">{b.title}</p>
                    {b.publishedDate && <p className="text-[9px] text-slate-300 text-center">{b.publishedDate.slice(0,4)}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Author Card ────────────────────────────────────────────
export default function AuthorCard({ author, isFav = false, onToggleFav }) {
  const { user } = useAuth()
  const [expanded, setExpanded]         = useState(false)
  const [imgError, setImgError]         = useState(false)
  const [globalPhoto, setGlobalPhoto]   = useState(null)
  const [showPhotoPicker, setShowPhotoPicker] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)

  useEffect(() => {
    if ((!author.photoUrl || imgError) && author.name) {
      getGlobalAuthorPhoto(author.name).then(url => { if (url) setGlobalPhoto(url) })
    }
  }, [author.name, imgError])

  return (
    <>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Author header */}
      <div className="flex gap-3 p-4">
        {/* Photo */}
        <div className="relative flex-shrink-0 group">
          {(author.photoUrl && !imgError) || globalPhoto ? (
            <img
              src={(!imgError && author.photoUrl) ? author.photoUrl : globalPhoto}
              alt={author.name}
              className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-slate-100"
              onError={() => setImgError(true)}
            />
          ) : (
            <button onClick={() => setShowPhotoPicker(true)}
              className="w-16 h-16 rounded-2xl bg-slate-100 flex flex-col items-center justify-center gap-1 hover:bg-amber-50 transition-all">
              <User size={20} className="text-slate-300"/>
              <span className="text-[8px] text-slate-400">+ foto</span>
            </button>
          )}
          {user && (author.photoUrl || globalPhoto) && (
            <button onClick={() => setShowPhotoPicker(true)}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-sm border-2 border-white opacity-0 group-hover:opacity-100 transition-all">
              <Upload size={10} className="text-white"/>
            </button>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-slate-800 leading-tight">{author.name}</p>
            {onToggleFav && (
              <button onClick={() => onToggleFav(author, isFav)}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${isFav ? 'bg-red-100' : 'bg-slate-100 hover:bg-red-50'}`}>
                <Heart size={15} className={isFav ? 'fill-red-500 text-red-500' : 'text-slate-400'} />
              </button>
            )}
          </div>
          {author.birthDate && (
            <p className="text-xs text-slate-400 mt-0.5">
              {author.birthDate}{author.deathDate ? ` – ${author.deathDate}` : ''}
            </p>
          )}
          {author.topWork && (
            <p className="text-xs text-slate-500 mt-1 italic line-clamp-1">"{author.topWork}"</p>
          )}
          {author.workCount > 0 && (
            <p className="text-[10px] text-slate-400 mt-0.5">{author.workCount} obras</p>
          )}
        </div>
      </div>

      {/* Books */}
      {author.books?.length > 0 && (
        <>
          <div className="flex gap-2.5 px-4 pb-3 overflow-x-auto scrollbar-none">
            {(expanded ? author.books : author.books.slice(0, 5)).map(b => (
              <button key={b.bookId} onClick={() => setSelectedBook(b)}
                className="flex-shrink-0 w-14 text-left active:scale-95 transition-all">
                {b.thumbnail ? (
                  <img src={b.thumbnail} alt={b.title} className="w-14 h-20 object-cover rounded-xl shadow-sm" />
                ) : (
                  <div className="w-14 h-20 bg-slate-100 rounded-xl flex items-center justify-center">
                    <BookOpen size={14} className="text-slate-300" />
                  </div>
                )}
                <p className="text-[9px] text-slate-500 mt-1 line-clamp-2 text-center leading-tight">{b.title}</p>
              </button>
            ))}
          </div>

          {author.books.length > 5 && (
            <button onClick={() => setExpanded(v => !v)}
              className="flex items-center justify-center gap-1 w-full py-2 text-xs text-amber-500 font-medium border-t border-slate-100 hover:bg-amber-50 transition-all">
              {expanded
                ? <><ChevronUp size={13}/> Ver menos</>
                : <><ChevronDown size={13}/> Ver los {author.books.length - 5} libros más</>
              }
            </button>
          )}
        </>
      )}
      {!author.books?.length && (
        <p className="text-xs text-slate-300 text-center px-4 pb-3">Sin libros disponibles</p>
      )}
    </div>

    {/* Author photo picker */}
    {showPhotoPicker && (
      <>
        <div className="fixed inset-0 bg-black/40 z-[75]" onClick={() => setShowPhotoPicker(false)}/>
        <div className="fixed inset-0 z-[76] flex items-end">
          <ImagePickerSheet
            title={`Foto de ${author.name}`}
            storagePath={`authorPhotos/${author.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`}
            onSave={async url => {
              setGlobalPhoto(url)
              setImgError(false)
              if (user) await saveGlobalAuthorPhoto(author.name, url, user.uid)
            }}
            onClose={() => setShowPhotoPicker(false)}
          />
        </div>
      </>
    )}

    {/* Book detail sheet */}
    {selectedBook && (
      <>
        <div className="fixed inset-0 bg-black/40 z-[65]" onClick={() => setSelectedBook(null)} />
        <AuthorBookSheet
          book={selectedBook}
          author={author}
          allBooks={author.books || []}
          onClose={() => setSelectedBook(null)}
        />
      </>
    )}
    </>
  )
}
