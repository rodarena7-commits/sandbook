import { useState, useMemo, useRef } from 'react'
import { Plus, BookOpen, BookMarked, Pencil, Trash2, X, Check, CalendarDays } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useBooks } from '../hooks/useBooks'
import { useShelves } from '../hooks/useShelves'
import BookCard from '../components/books/BookCard'
import BookDetailSheet from '../components/books/BookDetailSheet'
import CreatePlanSheet from '../components/books/CreatePlanSheet'
import ReadingPlanView from '../components/books/ReadingPlanView'
import Loader from '../components/ui/Loader'
import { createReadingPlan } from '../hooks/useReadingPlan'

const STATUS_TABS = [
  { key: 'all',     label: 'Todos' },
  { key: 'reading', label: 'Leyendo' },
  { key: 'read',    label: 'Leídos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'fav',     label: '⭐' },
]

const EMPTY_MESSAGES = {
  all:     { icon: '📚', text: 'Tu biblioteca está vacía', sub: 'Buscá libros en la pestaña Buscar' },
  reading: { icon: '📖', text: 'No estás leyendo nada', sub: 'Marcá un libro como "Leyendo"' },
  read:    { icon: '✅', text: 'Todavía no leíste ningún libro', sub: 'Marcá un libro como "Leído"' },
  pending: { icon: '🕐', text: 'No tenés libros pendientes', sub: 'Guardá libros para leer después' },
  fav:     { icon: '⭐', text: 'No tenés favoritos', sub: 'Tocá la estrella en cualquier libro' },
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
      <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl p-5 pb-8" onClick={e => e.stopPropagation()}>
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
export default function LibraryPage() {
  const { user } = useAuth()
  const { books, loading, updateStatus, toggleFavorite, removeBook, saveReview, updateReaction, assignShelf } = useBooks(user?.uid)
  const { shelves, createShelf, renameShelf, deleteShelf } = useShelves(user?.uid)

  const [statusTab, setStatusTab]       = useState('all')
  const [shelfFilter, setShelfFilter]   = useState(null)
  const [selectedBook, setSelectedBook] = useState(null)
  const [shelfModal, setShelfModal]     = useState(false)
  const [shelfMenu, setShelfMenu]       = useState(null)
  const [renameModal, setRenameModal]   = useState(null)
  const [assignModal, setAssignModal]   = useState(null)
  const [planBook, setPlanBook]         = useState(null) // create plan
  const [viewPlanBook, setViewPlanBook] = useState(null) // view plan

  const filtered = useMemo(() => {
    let list = books
    if (statusTab === 'fav')       list = list.filter(b => b.isFavorite)
    else if (statusTab !== 'all')  list = list.filter(b => b.status === statusTab)
    if (shelfFilter !== null)      list = list.filter(b => b.shelfId === shelfFilter)
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
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-5xl mb-4">
              {shelfFilter ? '📂' : empty.icon}
            </p>
            <p className="font-semibold text-slate-600 mb-1">
              {shelfFilter ? 'Este estante está vacío' : empty.text}
            </p>
            <p className="text-sm text-slate-400">
              {shelfFilter ? 'Mantené presionado un libro para moverlo aquí' : empty.sub}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map(book => {
              const hasPlan = !!book.readingPlan
              return (
                <div key={book.id} className="relative group">
                  <BookCard
                    book={book}
                    onStatusChange={(bookId, status) => updateStatus(user.uid, bookId, status)}
                    onToggleFavorite={(bookId, current) => toggleFavorite(user.uid, bookId, current)}
                    onRemove={(bookId) => removeBook(user.uid, bookId)}
                    onReaction={(bookId, reaction) => updateReaction(user.uid, bookId, reaction)}
                    onSelect={setSelectedBook}
                  />
                  {/* Plan icon */}
                  {hasPlan && (
                    <button
                      onClick={e => { e.stopPropagation(); setViewPlanBook(book) }}
                      className="absolute top-2 left-2 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-md"
                      title="Ver plan de lectura"
                    >
                      <CalendarDays size={13} className="text-white" />
                    </button>
                  )}
                  {/* Shelf icon */}
                  {shelves.length > 0 && (
                    <button
                      onClick={() => setAssignModal(book)}
                      className={`absolute ${hasPlan ? 'top-10' : 'top-2'} left-2 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all`}
                    >
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
            onOpenPlan={b => { setSelectedBook(null); b.readingPlan ? setViewPlanBook(b) : setPlanBook(b) }}
          />
        </>
      )}

      {/* Reading plan — create */}
      {planBook && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[55]" onClick={() => setPlanBook(null)} />
          <CreatePlanSheet
            book={planBook}
            onSave={(pages, days) => createReadingPlan(user.uid, planBook.bookId, pages, days)}
            onClose={() => setPlanBook(null)}
          />
        </>
      )}

      {/* Reading plan — view */}
      {viewPlanBook && (
        <ReadingPlanView
          book={books.find(b => b.bookId === viewPlanBook.bookId) || viewPlanBook}
          uid={user.uid}
          onClose={() => setViewPlanBook(null)}
          onDelete={() => setViewPlanBook(null)}
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
