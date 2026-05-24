import { useState, useRef, useEffect } from 'react'
import { X, BookOpen, Search, Loader2, ChevronLeft, User, ImagePlus } from 'lucide-react'
import { useGoogleBooks } from '../../hooks/useGoogleBooks'
import { useAuthorSearch } from '../../hooks/useAuthorSearch'
import { getGlobalCover, saveGlobalCover } from '../../hooks/useGlobalMedia'
import { useAuth } from '../../contexts/AuthContext'
import ImagePickerSheet from '../ui/ImagePickerSheet'

// ── Opción de libro en el picker ────────────────────────────
function BookOption({ book, onSelect }) {
  const thumb = book.customThumbnail || book.thumbnail
  return (
    <button
      onClick={() => onSelect(book)}
      className="flex gap-3 items-center w-full text-left py-2.5 border-b border-slate-50 last:border-0 active:bg-slate-50"
    >
      {thumb ? (
        <img src={thumb} alt="" className="w-9 h-12 object-cover rounded-lg flex-shrink-0 shadow-sm" />
      ) : (
        <div className="w-9 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen size={14} className="text-slate-300" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800 line-clamp-1">{book.title}</p>
        {book.authors?.[0] && <p className="text-[10px] text-slate-400">{book.authors[0]}</p>}
      </div>
    </button>
  )
}

// ── Opción de autor en el picker ────────────────────────────
function AuthorOption({ author, onSelect }) {
  return (
    <button
      onClick={() => onSelect(author)}
      className="flex gap-3 items-center w-full text-left py-2.5 border-b border-slate-50 last:border-0 active:bg-slate-50"
    >
      {author.photoUrl ? (
        <img src={author.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-slate-100" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-slate-300" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800 line-clamp-1">{author.name}</p>
        {author.topWork && <p className="text-[10px] text-slate-400 italic line-clamp-1">"{author.topWork}"</p>}
        {author.workCount > 0 && <p className="text-[10px] text-slate-300">{author.workCount} obras</p>}
      </div>
    </button>
  )
}

// ── Sheet principal ─────────────────────────────────────────
export default function CreatePostSheet({ myBooks, onPublish, onUpdate, onClose, editPost }) {
  const { user } = useAuth()
  const isEdit = !!editPost

  const [text, setText]             = useState(editPost?.text || '')
  const [selectedBook, setSelectedBook] = useState(
    editPost?.bookTitle
      ? { bookId: editPost.bookId, title: editPost.bookTitle, authors: editPost.bookAuthors, thumbnail: editPost.bookThumbnail }
      : null
  )
  const [selectedAuthor, setSelectedAuthor] = useState(
    editPost?.authorName
      ? { name: editPost.authorName, photoUrl: editPost.authorPhotoUrl, olid: editPost.authorId }
      : null
  )
  const [picker, setPicker]         = useState(null) // null | 'book' | 'author'
  const [bookSearch, setBookSearch] = useState('')
  const [authorSearch, setAuthorSearch] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [showCoverPicker, setShowCoverPicker] = useState(false)
  const [localCover, setLocalCover] = useState(null) // portada subida localmente para el libro

  const { results: bookResults, loading: bookSearching, search: searchBooks, clear: clearBooks } = useGoogleBooks()
  const { authors: authorResults, loading: authorSearching, search: searchAuthors, clear: clearAuthors, setQuery: setAuthorQuery } = useAuthorSearch()

  const bookSearchRef   = useRef(null)
  const authorSearchRef = useRef(null)

  // Cargar portada global del libro seleccionado si no tiene thumbnail
  useEffect(() => {
    if (selectedBook && !selectedBook.thumbnail && !localCover) {
      getGlobalCover(selectedBook.bookId).then(url => { if (url) setLocalCover(url) })
    }
  }, [selectedBook?.bookId])

  function handleBookSearchSubmit(e) {
    e.preventDefault()
    searchBooks(bookSearch, 'title')
  }

  function handleAuthorSearchSubmit(e) {
    e.preventDefault()
    searchAuthors(authorSearch)
  }

  async function handlePublish() {
    if (!text.trim()) return
    setPublishing(true)

    const bookPayload = selectedBook
      ? { ...selectedBook, thumbnail: localCover || selectedBook.thumbnail }
      : null

    const payload = {
      text,
      book:           bookPayload,
      authorId:       selectedAuthor?.olid       || null,
      authorName:     selectedAuthor?.name       || null,
      authorPhotoUrl: selectedAuthor?.photoUrl   || null,
    }

    if (isEdit) {
      await onUpdate(editPost.id, payload)
    } else {
      await onPublish(payload)
    }
    setPublishing(false)
    onClose()
  }

  // ── Modo PICKER DE LIBRO ────────────────────────────────────
  if (picker === 'book') {
    return (
      <div className="fixed inset-0 z-50 flex items-end">
        <div className="w-full max-w-5xl mx-auto bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
            <button onClick={() => { setPicker(null); clearBooks(); setBookSearch('') }}
              className="flex items-center gap-1 text-sm font-medium text-slate-500">
              <ChevronLeft size={16} /> Volver
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleBookSearchSubmit} className="flex gap-2 px-5 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input ref={bookSearchRef} autoFocus value={bookSearch} onChange={e => setBookSearch(e.target.value)}
                placeholder="Buscar libro por título…"
                className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button type="submit" disabled={!bookSearch.trim() || bookSearching}
              className="px-3 py-2 bg-amber-500 text-white rounded-2xl text-xs font-semibold disabled:opacity-40">
              Buscar
            </button>
          </form>

          <div className="overflow-y-auto flex-1 px-5 py-2">
            {!bookSearch && myBooks.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2 mt-1">Mi biblioteca</p>
                {myBooks.slice(0, 10).map(b => (
                  <BookOption key={b.id} book={b} onSelect={book => {
                    setSelectedBook(book)
                    setLocalCover(book.customThumbnail || null)
                    setPicker(null)
                  }} />
                ))}
              </>
            )}
            {bookSearching && <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-amber-400" /></div>}
            {bookResults.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2 mt-2">Resultados</p>
                {bookResults.map(b => (
                  <BookOption key={b.bookId} book={b} onSelect={book => {
                    setSelectedBook(book)
                    setLocalCover(null)
                    setPicker(null)
                  }} />
                ))}
              </>
            )}
            {!bookSearching && bookResults.length === 0 && bookSearch && (
              <p className="text-xs text-slate-400 text-center py-8">Sin resultados</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Modo PICKER DE AUTOR ────────────────────────────────────
  if (picker === 'author') {
    return (
      <div className="fixed inset-0 z-50 flex items-end">
        <div className="w-full max-w-5xl mx-auto bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
            <button onClick={() => { setPicker(null); clearAuthors(); setAuthorSearch('') }}
              className="flex items-center gap-1 text-sm font-medium text-slate-500">
              <ChevronLeft size={16} /> Volver
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleAuthorSearchSubmit} className="flex gap-2 px-5 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input ref={authorSearchRef} autoFocus value={authorSearch}
                onChange={e => { setAuthorSearch(e.target.value); setAuthorQuery(e.target.value) }}
                placeholder="Buscar escritor/a…"
                className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button type="submit" disabled={!authorSearch.trim() || authorSearching}
              className="px-3 py-2 bg-slate-800 text-white rounded-2xl text-xs font-semibold disabled:opacity-40">
              Buscar
            </button>
          </form>

          <div className="overflow-y-auto flex-1 px-5 py-2">
            {authorSearching && <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-amber-400" /></div>}
            {authorResults.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2 mt-1">Resultados</p>
                {authorResults.map((a, i) => (
                  <AuthorOption key={`${a.olid}-${i}`} author={a} onSelect={author => {
                    setSelectedAuthor(author)
                    setPicker(null)
                  }} />
                ))}
              </>
            )}
            {!authorSearching && authorResults.length === 0 && authorSearch && (
              <p className="text-xs text-slate-400 text-center py-8">Sin resultados</p>
            )}
            {!authorSearch && (
              <p className="text-xs text-slate-400 text-center py-8">Escribí el nombre del escritor/a</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Modo COMPOSICIÓN ────────────────────────────────────────
  const bookThumb = localCover || selectedBook?.thumbnail

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end">
        <div className="w-full max-w-5xl mx-auto bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
            <h3 className="font-bold text-slate-800">
              {isEdit ? 'Editar publicación' : 'Nueva publicación'}
            </h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <X size={15} />
            </button>
          </div>

          <div className="flex flex-col flex-1 overflow-y-auto px-5 py-4 gap-4">

            {/* Texto */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Frase o pensamiento</p>
              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={500}
                rows={5}
                placeholder='"Las palabras son la fuente del malentendido." — El Principito'
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-300 outline-none focus:ring-2 focus:ring-amber-400 resize-none leading-relaxed"
              />
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-slate-300">{text.length}/500</span>
              </div>
            </div>

            {/* Libro de referencia */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Libro de referencia</p>
              {selectedBook ? (
                <div className="flex gap-3 items-center bg-amber-50 rounded-2xl p-3 border border-amber-100">
                  <div className="relative flex-shrink-0">
                    {bookThumb ? (
                      <img src={bookThumb} alt="" className="w-10 h-14 object-cover rounded-xl shadow-sm" />
                    ) : (
                      <div className="w-10 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                        <BookOpen size={14} className="text-slate-300" />
                      </div>
                    )}
                    {/* Botón para agregar/cambiar portada */}
                    <button
                      onClick={() => setShowCoverPicker(true)}
                      className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow border-2 border-white"
                      title="Agregar portada"
                    >
                      <ImagePlus size={10} className="text-white" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2">{selectedBook.title}</p>
                    {selectedBook.authors?.[0] && (
                      <p className="text-[10px] text-slate-500 mt-0.5">{selectedBook.authors[0]}</p>
                    )}
                    {!bookThumb && (
                      <button onClick={() => setShowCoverPicker(true)}
                        className="text-[10px] text-amber-500 font-medium mt-1">
                        + Agregar portada
                      </button>
                    )}
                  </div>
                  <button onClick={() => { setSelectedBook(null); setLocalCover(null) }}
                    className="text-slate-300 hover:text-slate-500 flex-shrink-0">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPicker('book')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-all"
                >
                  <BookOpen size={16} />
                  <span className="text-sm">Anclar un libro</span>
                </button>
              )}
            </div>

            {/* Escritor */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Etiquetar escritor/a</p>
              {selectedAuthor ? (
                <div className="flex gap-3 items-center bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  {selectedAuthor.photoUrl ? (
                    <img src={selectedAuthor.photoUrl} alt=""
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-slate-100" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-slate-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800">{selectedAuthor.name}</p>
                    {selectedAuthor.topWork && (
                      <p className="text-[10px] text-slate-400 italic line-clamp-1">"{selectedAuthor.topWork}"</p>
                    )}
                  </div>
                  <button onClick={() => setSelectedAuthor(null)} className="text-slate-300 hover:text-slate-500 flex-shrink-0">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPicker('author')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-slate-400 hover:text-slate-500 transition-all"
                >
                  <User size={16} />
                  <span className="text-sm">Etiquetar un escritor/a</span>
                </button>
              )}
            </div>

            {/* Botón publicar */}
            <button
              onClick={handlePublish}
              disabled={!text.trim() || publishing}
              className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-95 transition-all shadow-sm"
            >
              {publishing ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Publicar'}
            </button>
          </div>
        </div>
      </div>

      {/* Cover picker para el libro */}
      {showCoverPicker && selectedBook && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => setShowCoverPicker(false)} />
          <div className="fixed inset-0 z-[61] flex items-end">
            <ImagePickerSheet
              title={`Portada: ${selectedBook.title}`}
              storagePath={`bookCovers/${selectedBook.bookId}`}
              onSave={async url => {
                setLocalCover(url)
                if (selectedBook.bookId && user) {
                  await saveGlobalCover(selectedBook.bookId, url, user.uid)
                }
              }}
              onClose={() => setShowCoverPicker(false)}
            />
          </div>
        </>
      )}
    </>
  )
}
