import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, BookOpen, BookMarked, Pencil, Trash2, X, Check, CalendarDays, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useBooks } from '../hooks/useBooks'
import { useShelves } from '../hooks/useShelves'
import BookCard from '../components/books/BookCard'
import BookDetailSheet from '../components/books/BookDetailSheet'
import CreatePlanSheet from '../components/books/CreatePlanSheet'
import ReadingPlanView from '../components/books/ReadingPlanView'
import RelaxPlanView from '../components/books/RelaxPlanView'
import BiblePlanView from '../components/books/BiblePlanView'
import Loader from '../components/ui/Loader'
import { createReadingPlan, createRelaxPlan } from '../hooks/useReadingPlan'
import { isBibleBook, initBiblePlan, countCompleted, TOTAL_CHAPTERS } from '../hooks/useBibleProgress'

const STATUS_TABS = [
  { key: 'all',     label: 'Total' },
  { key: 'reading', label: 'Leyendo' },
  { key: 'read',    label: 'Leídos' },
  { key: 'fav',     label: 'Favoritos' },
  { key: 'shared',  label: 'Compartidos' },
]

const EMPTY_MESSAGES = {
  all:     { icon: '📚', text: 'Tu biblioteca está vacía',      sub: 'Buscá libros en la pestaña Buscar' },
  reading: { icon: '📖', text: 'No estás leyendo nada',         sub: 'Marcá un libro como "Leyendo"' },
  read:    { icon: '✅', text: 'Todavía no leíste ningún libro', sub: 'Marcá un libro como "Leído"' },
  fav:     { icon: '⭐', text: 'No tenés favoritos',             sub: 'Tocá la estrella en cualquier libro' },
  shared:  { icon: '👥', text: 'Ningún libro compartido',        sub: 'Abrí un libro y agregá un compañero de lectura' },
}

// ── Create/Rename Shelf Modal ──────────────────────────────
function ShelfModal({ initial = '', onSave, onClose }) {
  const [name, setName] = useState(initial)
  const inputRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim())
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <BookMarked size={18} className="text-amber-500" />
          <h3 className="font-bold text-slate-800">{initial ? 'Renombrar estante' : 'Nuevo estante'}</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Novelas, Ciencia, Por leer…"
            maxLength={30}
            className="w-full px-4 py-3 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400 mb-4"
          />
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 text-sm font-medium">
              Cancelar
            </button>
            <button type="submit" disabled={!name.trim()}
              className="flex-1 py-3 rounded-2xl bg-amber-500 text-white text-sm font-semibold disabled:opacity-40">
              {initial ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Shelf Context Menu ─────────────────────────────────────
function ShelfMenu({ shelf, onRename, onDelete, onClose }) {
  return (
    <div className="fixed inset-0 z-[55] flex items-end" onClick={onClose}>
      <div className="w-full max-w-5xl mx-auto bg-white rounded-t-3xl shadow-2xl p-5 pb-8" onClick={e => e.stopPropagation()}>
        <p className="font-semibold text-slate-700 mb-4 text-center">"{shelf.name}"</p>
        <div className="flex flex-col gap-2">
          <button onClick={onRename}
            className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl text-sm text-slate-700 font-medium">
            <Pencil size={15} className="text-slate-400" /> Renombrar
          </button>
          <button onClick={onDelete}
            className="flex items-center gap-3 px-4 py-3 bg-red-50 rounded-2xl text-sm text-red-500 font-medium">
            <Trash2 size={15} /> Eliminar estante
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-3 py-2.5 text-sm text-slate-400">Cancelar</button>
      </div>
    </div>
  )
}

// ── Assign Shelf Modal ─────────────────────────────────────
function AssignShelfModal({ book, shelves, currentShelfId, onAssign, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-slate-800 mb-1">Mover a estante</h3>
        <p className="text-xs text-slate-400 mb-4 line-clamp-1">{book.title}</p>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
          <button onClick={() => onAssign(null)}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all ${!currentShelfId ? 'bg-amber-50 text-amber-600 font-semibold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
            Sin estante
            {!currentShelfId && <Check size={14} />}
          </button>
          {shelves.map(s => (
            <button key={s.id} onClick={() => onAssign(s.id)}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all ${currentShelfId === s.id ? 'bg-amber-50 text-amber-600 font-semibold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
              {s.name}
              {currentShelfId === s.id && <Check size={14} />}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-3 py-2.5 text-sm text-slate-400">Cancelar</button>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function LibraryPage({ startOnPlan = false, onPlanConsumed }) {
  const { user } = useAuth()
  const { books, loading, updateStatus, toggleFavorite, removeBook, saveReview, updateReaction, assignShelf, savePrivateNotes, setCoReader, removeCoReader } = useBooks(user?.uid)
  const { shelves, createShelf, renameShelf, deleteShelf } = useShelves(user?.uid)

  const [statusTab, setStatusTab]       = useState('all')
  const [shelfFilter, setShelfFilter]   = useState(null)
  const [selectedBook, setSelectedBook] = useState(null)
  const [shelfModal, setShelfModal]     = useState(false)
  const [shelfMenu, setShelfMenu]       = useState(null)
  const [renameModal, setRenameModal]   = useState(null)
  const [assignModal, setAssignModal]   = useState(null)
  const [planBook, setPlanBook]           = useState(null)
  const [viewPlanBook, setViewPlanBook]   = useState(null)
  const [viewRelaxBook, setViewRelaxBook] = useState(null)
  const [viewBibleBook, setViewBibleBook] = useState(null)
  const [planSearch, setPlanSearch]       = useState('')
  const [pendingPlan, setPendingPlan]     = useState(null) // book awaiting plan creation

  // Navigate from Search page to plan tab
  useEffect(() => {
    if (startOnPlan) {
      setStatusTab('plan')
      onPlanConsumed?.()
    }
  }, [startOnPlan])

  // Open CreatePlanSheet AFTER BookDetailSheet fully closes
  useEffect(() => {
    if (pendingPlan && !selectedBook) {
      setStatusTab('plan')
      if (pendingPlan.biblePlan)      setViewBibleBook(pendingPlan)
      else if (pendingPlan.readingPlan) setViewPlanBook(pendingPlan)
      else if (pendingPlan.relaxPlan)   setViewRelaxBook(pendingPlan)
      else setPlanBook(pendingPlan)
      setPendingPlan(null)
    }
  }, [pendingPlan, selectedBook])

  const filtered = useMemo(() => {
    let list = books
    if (statusTab === 'fav')        list = list.filter(b => b.isFavorite)
    else if (statusTab === 'shared') list = list.filter(b => b.coReaders?.length > 0)
    else if (statusTab === 'plan')  list = list.filter(b => !!b.readingPlan || !!b.relaxPlan || !!b.biblePlan)
    else if (statusTab !== 'all')   list = list.filter(b => b.status === statusTab)
    if (shelfFilter !== null)       list = list.filter(b => b.shelfId === shelfFilter)
    return list
  }, [books, statusTab, shelfFilter])

  const stats = useMemo(() => ({
    total:   books.length,
    reading: books.filter(b => b.status === 'reading').length,
    read:    books.filter(b => b.status === 'read').length,
  }), [books])

  if (loading) return <Loader />

  const empty = EMPTY_MESSAGES[statusTab] || EMPTY_MESSAGES.all

  async function handleCreateShelf(name) {
    await createShelf(name)
    setShelfModal(false)
  }

  async function handleRenameShelf(name) {
    await renameShelf(renameModal.id, name)
    setRenameModal(null)
    setShelfMenu(null)
  }

  async function handleDeleteShelf() {
    await deleteShelf(shelfMenu.shelf.id)
    if (shelfFilter === shelfMenu.shelf.id) setShelfFilter(null)
    setShelfMenu(null)
  }

  async function handleAssignShelf(shelfId) {
    await assignShelf(user.uid, assignModal.bookId, shelfId)
    setAssignModal(null)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-slate-800">Mi Biblioteca</h1>
          {stats.total > 0 && (
            <div className="flex gap-3 text-xs text-slate-400">
              <span><span className="font-semibold text-slate-600">{stats.total}</span> libros</span>
              {stats.reading > 0 && <span><span className="font-semibold text-amber-500">{stats.reading}</span> leyendo</span>}
              {stats.read > 0 && <span><span className="font-semibold text-green-500">{stats.read}</span> leídos</span>}
            </div>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5 mb-2">
          {STATUS_TABS.map(tab => (
            <button key={tab.key} onClick={() => setStatusTab(tab.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                statusTab === tab.key ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Shelf tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {/* Todos */}
          <button onClick={() => setShelfFilter(null)}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
              shelfFilter === null
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-500 border-slate-200'
            }`}>
            <BookOpen size={10} /> Todos
          </button>

          {shelves.map(shelf => (
            <button key={shelf.id}
              onClick={() => setShelfFilter(shelfFilter === shelf.id ? null : shelf.id)}
              onLongPress={() => setShelfMenu({ shelf })}
              onContextMenu={e => { e.preventDefault(); setShelfMenu({ shelf }) }}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                shelfFilter === shelf.id
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
              style={{ WebkitUserSelect: 'none' }}
              onTouchStart={e => {
                const timer = setTimeout(() => setShelfMenu({ shelf }), 600)
                e.currentTarget._timer = timer
              }}
              onTouchEnd={e => clearTimeout(e.currentTarget._timer)}
            >
              {shelf.name}
            </button>
          ))}

          {/* Create shelf button */}
          <button onClick={() => setShelfModal(true)}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-all">
            <Plus size={11} /> Nuevo
          </button>
        </div>
      </div>

      {/* Active shelf label */}
      {shelfFilter && (
        <div className="px-4 pt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            {shelves.find(s => s.id === shelfFilter)?.name}
          </span>
          <button onClick={() => setShelfFilter(null)} className="text-slate-300 hover:text-slate-500">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4">
        {/* ── EN PLAN tab: buscador + lista de libros ── */}
        {statusTab === 'plan' && (
          <div className="mb-4">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={planSearch}
                onChange={e => setPlanSearch(e.target.value)}
                placeholder="Buscar libro por título o autor…"
                className="w-full pl-9 pr-8 py-2.5 bg-white rounded-2xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
              />
              {planSearch && (
                <button onClick={() => setPlanSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Books matching search OR all library books */}
            {(() => {
              const q = planSearch.trim().toLowerCase()
              const list = q
                ? books.filter(b =>
                    b.title?.toLowerCase().includes(q) ||
                    b.authors?.some(a => a.toLowerCase().includes(q))
                  )
                : books

              if (!list.length) {
                return (
                  <p className="text-xs text-slate-400 text-center py-6">
                    {q ? 'Sin resultados en tu biblioteca' : 'Tu biblioteca está vacía'}
                  </p>
                )
              }

              return (
                <div className="flex flex-col gap-2">
                  {list.map(b => {
                    const hasMetaPlan  = !!b.readingPlan
                    const hasRelaxPlan = !!b.relaxPlan
                    const hasPlan      = hasMetaPlan || hasRelaxPlan

                    const metaPct = hasMetaPlan
                      ? Math.round((Object.values(b.planDays||{}).filter(d=>d?.checked).length / b.readingPlan.totalDays) * 100)
                      : 0
                    const relaxPct = hasRelaxPlan && b.relaxPlan.totalPages > 0
                      ? Math.min(100, Math.round(((b.currentPage || 0) / b.relaxPlan.totalPages) * 100))
                      : null

                    function openPlan() {
                      if (b.relaxPlan)      setViewRelaxBook(b)
                      else if (b.readingPlan) setViewPlanBook(b)
                      else setPlanBook(b)
                    }

                    return (
                      <div key={b.id} className="flex gap-3 items-center bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
                        {b.customThumbnail || b.thumbnail ? (
                          <img src={b.customThumbnail || b.thumbnail} alt=""
                            className="w-10 h-14 object-cover rounded-xl flex-shrink-0 shadow-sm" />
                        ) : (
                          <div className="w-10 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <BookOpen size={14} className="text-slate-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 line-clamp-1">{b.title}</p>
                          {b.authors?.[0] && <p className="text-xs text-slate-400">{b.authors[0]}</p>}

                          {hasMetaPlan && (
                            <div className="mt-1.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${metaPct}%` }} />
                                </div>
                                <span className="text-[10px] text-amber-500 font-medium flex-shrink-0">{metaPct}%</span>
                              </div>
                              <p className="text-[10px] text-slate-400">
                                {b.readingPlan.dailyPages} págs/día · {b.readingPlan.totalDays} días
                              </p>
                            </div>
                          )}

                          {hasRelaxPlan && (
                            <div className="mt-1.5">
                              {relaxPct !== null && (
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-400 rounded-full" style={{ width: `${relaxPct}%` }} />
                                  </div>
                                  <span className="text-[10px] text-blue-500 font-medium flex-shrink-0">{relaxPct}%</span>
                                </div>
                              )}
                              <p className="text-[10px] text-slate-400">
                                ☕ Plan Relax{b.currentPage > 0 ? ` · Pág. ${b.currentPage}` : ''}
                              </p>
                            </div>
                          )}
                        </div>

                        {isBibleBook(b) ? (
                          <button
                            onClick={() => {
                              if (b.biblePlan)      setViewBibleBook(b)
                              else if (b.relaxPlan) setViewRelaxBook(b)
                              else setPlanBook(b)
                            }}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                              b.biblePlan ? 'bg-amber-500 text-white shadow-sm'
                              : b.relaxPlan ? 'bg-blue-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600'
                            }`}
                          >
                            <CalendarDays size={13}/>
                            {b.biblePlan ? 'Plan Bíblico' : b.relaxPlan ? 'Plan Relax' : 'Crear plan'}
                          </button>
                        ) : (
                          <button
                            onClick={openPlan}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                              hasRelaxPlan ? 'bg-blue-500 text-white shadow-sm'
                              : hasMetaPlan ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600'
                            }`}
                          >
                            <CalendarDays size={13}/>
                            {hasPlan ? 'Ver plan' : 'Crear plan'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}

        {statusTab !== 'plan' && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-5xl mb-4">{shelfFilter ? '📂' : empty.icon}</p>
            <p className="font-semibold text-slate-600 mb-1">
              {shelfFilter ? 'Este estante está vacío' : empty.text}
            </p>
            <p className="text-sm text-slate-400">
              {shelfFilter ? 'Mantené presionado un libro para moverlo aquí' : empty.sub}
            </p>
          </div>
        )}

        {statusTab !== 'plan' && filtered.length > 0 && (
          <div className="grid grid-cols-3 lg:grid-cols-8 gap-3">
            {filtered.map(book => {
              const hasPlan = !!book.readingPlan || !!book.relaxPlan
              return (
                <div key={book.id} className="relative group">
                  <BookCard
                    book={book}
                    onStatusChange={(bookId, status) => updateStatus(user.uid, bookId, status)}
                    onToggleFavorite={(bookId, current) => toggleFavorite(user.uid, bookId, current)}
                    onRemove={(bookId) => removeBook(user.uid, bookId)}
                    onReaction={(bookId, reaction) => updateReaction(user.uid, bookId, reaction)}
                    onSelect={setSelectedBook}
                    onOpenPlan={b => b.relaxPlan ? setViewRelaxBook(b) : setViewPlanBook(b)}
                  />
                  {(hasPlan || book.biblePlan) && (
                    <button onClick={e => {
                      e.stopPropagation()
                      if (book.biblePlan)       setViewBibleBook(book)
                      else if (book.relaxPlan)  setViewRelaxBook(book)
                      else                      setViewPlanBook(book)
                    }}
                      className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md ${book.relaxPlan ? 'bg-blue-500' : 'bg-amber-500'}`}>
                      <CalendarDays size={13} className="text-white" />
                    </button>
                  )}
                  {shelves.length > 0 && (
                    <button onClick={() => setAssignModal(book)}
                      className={`absolute ${hasPlan ? 'top-10' : 'top-2'} left-2 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all`}>
                      <BookMarked size={10} className="text-slate-500" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Book detail sheet */}
      {selectedBook && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedBook(null)} />
          <BookDetailSheet
            book={books.find(b => b.bookId === selectedBook.bookId) || selectedBook}
            onClose={() => setSelectedBook(null)}
            onStatusChange={(bookId, status) => updateStatus(user.uid, bookId, status)}
            onToggleFavorite={(bookId, current) => toggleFavorite(user.uid, bookId, current)}
            onSaveRating={(bookId, rating) => saveReview(user.uid, bookId, rating, '')}
            onRemove={(bookId) => removeBook(user.uid, bookId)}
            onSavePrivateNotes={savePrivateNotes}
            onOpenPlan={b => {
              setSelectedBook(null)
              setPendingPlan(b)
            }}
            onSetCoReader={(bookId, coReader) => setCoReader(user.uid, bookId, coReader)}
            onRemoveCoReader={(bookId, coReaderUid) => removeCoReader(user.uid, bookId, coReaderUid)}
          />
        </>
      )}

      {/* Bible plan view */}
      {viewBibleBook && (
        <BiblePlanView
          book={books.find(b => b.bookId === viewBibleBook.bookId) || viewBibleBook}
          uid={user.uid}
          onClose={() => setViewBibleBook(null)}
          onDelete={() => setViewBibleBook(null)}
        />
      )}

      {/* Reading plan — create */}
      {planBook && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[55]" onClick={() => setPlanBook(null)} />
          <CreatePlanSheet
            book={planBook}
            isBible={isBibleBook(planBook)}
            onSave={({ type, pages, days }) => {
              if (type === 'relax')  return createRelaxPlan(user.uid, planBook.bookId, pages)
              if (type === 'bible')  return initBiblePlan(user.uid, planBook.bookId)
              return createReadingPlan(user.uid, planBook.bookId, pages, days)
            }}
            onClose={() => setPlanBook(null)}
          />
        </>
      )}

      {/* Reading plan — view (Plan con Meta) */}
      {viewPlanBook && (
        <ReadingPlanView
          book={books.find(b => b.bookId === viewPlanBook.bookId) || viewPlanBook}
          uid={user.uid}
          onClose={() => setViewPlanBook(null)}
          onDelete={() => setViewPlanBook(null)}
        />
      )}

      {/* Reading plan — view (Plan Relax) */}
      {viewRelaxBook && (
        <RelaxPlanView
          book={books.find(b => b.bookId === viewRelaxBook.bookId) || viewRelaxBook}
          uid={user.uid}
          isBible={isBibleBook(viewRelaxBook)}
          onClose={() => setViewRelaxBook(null)}
          onDelete={() => setViewRelaxBook(null)}
        />
      )}

      {/* Modals & menus */}
      {shelfModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[55]" onClick={() => setShelfModal(false)} />
          <ShelfModal onSave={handleCreateShelf} onClose={() => setShelfModal(false)} />
        </>
      )}

      {renameModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[55]" onClick={() => setRenameModal(null)} />
          <ShelfModal initial={renameModal.name} onSave={handleRenameShelf} onClose={() => setRenameModal(null)} />
        </>
      )}

      {shelfMenu && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShelfMenu(null)} />
          <ShelfMenu
            shelf={shelfMenu.shelf}
            onRename={() => { setRenameModal(shelfMenu.shelf); setShelfMenu(null) }}
            onDelete={handleDeleteShelf}
            onClose={() => setShelfMenu(null)}
          />
        </>
      )}

      {assignModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[55]" onClick={() => setAssignModal(null)} />
          <AssignShelfModal
            book={assignModal}
            shelves={shelves}
            currentShelfId={assignModal.shelfId}
            onAssign={handleAssignShelf}
            onClose={() => setAssignModal(null)}
          />
        </>
      )}
    </div>
  )
}
