import { useState, useRef } from 'react'
import { X, BookOpen, Search, Loader2, ChevronLeft } from 'lucide-react'
import { useGoogleBooks } from '../../hooks/useGoogleBooks'

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

export default function CreatePostSheet({ myBooks, onPublish, onClose }) {
  const [text, setText]           = useState('')
  const [selectedBook, setSelectedBook] = useState(null)
  const [showBookPicker, setShowBookPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [publishing, setPublishing]   = useState(false)

  const { results: searchResults, loading: searching, search, clear } = useGoogleBooks()
  const searchRef = useRef(null)

  function handleSearchSubmit(e) {
    e.preventDefault()
    search(searchQuery, 'title')
  }

  async function handlePublish() {
    if (!text.trim()) return
    setPublishing(true)
    await onPublish({ text, book: selectedBook })
    setPublishing(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
          {showBookPicker ? (
            <button onClick={() => { setShowBookPicker(false); clear(); setSearchQuery('') }}
              className="flex items-center gap-1 text-sm font-medium text-slate-500">
              <ChevronLeft size={16} /> Volver
            </button>
          ) : (
            <h3 className="font-bold text-slate-800">Nueva publicación</h3>
          )}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <X size={15} />
          </button>
        </div>

        {/* Book picker mode */}
        {showBookPicker ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search bar */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar libro por título…"
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <button type="submit" disabled={!searchQuery.trim() || searching}
                className="px-3 py-2 bg-amber-500 text-white rounded-2xl text-xs font-semibold disabled:opacity-40">
                Buscar
              </button>
            </form>

            <div className="overflow-y-auto flex-1 px-5 py-2">
              {/* My library */}
              {!searchQuery && myBooks.length > 0 && (
                <>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2 mt-1">Mi biblioteca</p>
                  {myBooks.slice(0, 10).map(b => (
                    <BookOption key={b.id} book={b} onSelect={book => { setSelectedBook(book); setShowBookPicker(false) }} />
                  ))}
                </>
              )}

              {/* Search results */}
              {searching && <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-amber-400" /></div>}
              {searchResults.length > 0 && (
                <>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2 mt-2">Resultados</p>
                  {searchResults.map(b => (
                    <BookOption key={b.bookId} book={b} onSelect={book => { setSelectedBook(book); setShowBookPicker(false) }} />
                  ))}
                </>
              )}

              {!searching && searchResults.length === 0 && searchQuery && (
                <p className="text-xs text-slate-400 text-center py-8">Sin resultados</p>
              )}
            </div>
          </div>
        ) : (
          /* Post compose mode */
          <div className="flex flex-col flex-1 overflow-y-auto px-5 py-4 gap-4">
            {/* Quote textarea */}
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

            {/* Book anchor */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Libro de referencia</p>
              {selectedBook ? (
                <div className="flex gap-3 items-center bg-amber-50 rounded-2xl p-3 border border-amber-100">
                  {selectedBook.customThumbnail || selectedBook.thumbnail ? (
                    <img src={selectedBook.customThumbnail || selectedBook.thumbnail} alt=""
                      className="w-10 h-14 object-cover rounded-xl flex-shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-10 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen size={14} className="text-slate-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2">{selectedBook.title}</p>
                    {selectedBook.authors?.[0] && (
                      <p className="text-[10px] text-slate-500 mt-0.5">{selectedBook.authors[0]}</p>
                    )}
                  </div>
                  <button onClick={() => setSelectedBook(null)} className="text-slate-300 hover:text-slate-500 flex-shrink-0">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowBookPicker(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-all"
                >
                  <BookOpen size={16} />
                  <span className="text-sm">Anclar un libro</span>
                </button>
              )}
            </div>

            {/* Publish button */}
            <button
              onClick={handlePublish}
              disabled={!text.trim() || publishing}
              className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-95 transition-all shadow-sm"
            >
              {publishing ? 'Publicando…' : 'Publicar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
