import { useState, useCallback, useRef } from 'react'
import {
  ArrowLeft, Bookmark, Trash2, PenLine, Plus, X, Coffee,
} from 'lucide-react'
import {
  updateRelaxPage, addRelaxNote, deleteRelaxNote,
  savePlanMeta, deleteRelaxPlan,
} from '../../hooks/useReadingPlan'

function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function RelaxPlanView({ book, uid, onClose, onDelete, isBible = false }) {
  const plan       = book.relaxPlan || {}
  const totalPages = plan.totalPages || 0
  // Etiquetas adaptadas según si es Biblia o libro normal
  const labelMarcador  = isBible ? '¿En qué versículo quedaste? (ej: Juan 3:16)' : '¿En qué página quedaste?'
  const labelPagina    = isBible ? 'Versículo' : 'Página'
  const labelHistorial = isBible ? 'capítulos / versículos leídos' : 'págs leídas'

  const [currentPage,   setCurrentPage]   = useState(book.currentPage || 0)
  const [relaxNote,     setRelaxNote]     = useState(book.relaxNote || '')
  const [relaxNotes,    setRelaxNotes]    = useState(book.relaxNotes || {})
  const [dailyHistory,  setDailyHistory]  = useState(book.dailyHistory || {})
  const [showDelete,    setShowDelete]    = useState(false)
  const [showAddNote,   setShowAddNote]   = useState(false)
  const [newNoteText,   setNewNoteText]   = useState('')
  const [newNotePage,   setNewNotePage]   = useState(String(book.currentPage || 0))

  const prevPage = useRef(Number(book.currentPage) || 0)

  const saveNoteDebounced = useCallback(
    debounce(val => savePlanMeta(uid, book.bookId, 'relaxNote', val), 800),
    []
  )

  async function handlePageChange(val) {
    const newPage = Number(val)
    const diff = Math.max(0, newPage - prevPage.current)
    setCurrentPage(val)

    const today = new Date().toISOString().slice(0, 10)
    setDailyHistory(prev => {
      const day = prev[today] || { pagesRead: 0, endPage: 0 }
      return { ...prev, [today]: { endPage: newPage, pagesRead: (day.pagesRead || 0) + diff } }
    })

    prevPage.current = newPage
    await updateRelaxPage(uid, book.bookId, newPage, diff)
  }

  async function handleAddNote() {
    if (!newNoteText.trim()) return
    const id   = Date.now().toString()
    const note = { page: Number(newNotePage) || 0, text: newNoteText.trim(), createdAt: new Date().toISOString() }
    setRelaxNotes(prev => ({ ...prev, [id]: note }))
    setNewNoteText('')
    setNewNotePage(String(currentPage))
    setShowAddNote(false)
    await addRelaxNote(uid, book.bookId, id, note.page, note.text)
  }

  async function handleDeleteNote(noteId) {
    setRelaxNotes(prev => { const n = { ...prev }; delete n[noteId]; return n })
    await deleteRelaxNote(uid, book.bookId, noteId)
  }

  async function handleDelete() {
    await deleteRelaxPlan(uid, book.bookId)
    onDelete?.()
    onClose()
  }

  const cover         = book.customThumbnail || book.thumbnail
  const sortedHistory = Object.entries(dailyHistory).sort((a, b) => b[0].localeCompare(a[0]))
  const sortedNotes   = Object.entries(relaxNotes).sort((a, b) => b[1].createdAt.localeCompare(a[1].createdAt))
  const totalRead     = sortedHistory.reduce((sum, [, d]) => sum + (d.pagesRead || 0), 0)

  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col w-full max-w-5xl mx-auto">

      {/* Header */}
      <div className="bg-white shadow-sm flex items-center gap-3 px-4 pt-12 pb-3 flex-shrink-0">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 flex-shrink-0">
          <ArrowLeft size={16} />
        </button>
        {cover && <img src={cover} alt="" className="w-8 h-11 object-cover rounded-lg flex-shrink-0 shadow-sm" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 line-clamp-1">{book.title}</p>
          <div className="flex items-center gap-1.5">
            <Coffee size={10} className="text-blue-400" />
            <p className="text-[10px] text-blue-400 font-medium">Plan Relax</p>
            {totalPages > 0 && <p className="text-[10px] text-slate-400">· {totalPages} págs totales</p>}
          </div>
        </div>
        <button onClick={() => setShowDelete(true)} className="text-slate-300 hover:text-red-400 p-1 flex-shrink-0">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Bookmark bar */}
      <div className="bg-white px-4 pb-3 pt-2 flex-shrink-0 border-b border-slate-100">
        <div className="flex items-center gap-2 bg-blue-50 rounded-2xl px-3 py-2.5 border border-blue-100">
          <Bookmark size={14} className="text-blue-500 flex-shrink-0" />
          <input
            type={isBible ? 'text' : 'number'}
            min="0" max={totalPages || 99999}
            inputMode={isBible ? 'text' : 'numeric'}
            value={currentPage}
            onChange={e => handlePageChange(e.target.value)}
            placeholder={labelMarcador}
            className="bg-transparent text-sm font-semibold text-slate-700 outline-none w-full"
          />
          {totalPages > 0 && (
            <span className="text-xs text-slate-400 flex-shrink-0">/ {totalPages}</span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-4">

        {/* Stats summary */}
        {totalRead > 0 && (
          <div className="bg-blue-500 rounded-2xl p-4 text-white text-center shadow-sm">
            <p className="text-3xl font-bold">{totalRead}</p>
            <p className="text-xs text-blue-100 mt-0.5">{labelHistorial} en total</p>
          </div>
        )}

        {/* Daily history */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Historial por día</p>
          {sortedHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
              <p className="text-xs text-slate-400">
                Actualizá el marcador para que se registre tu progreso diario automáticamente
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedHistory.map(([date, data]) => (
                <div key={date} className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 capitalize">{formatDate(date)}</p>
                    {data.endPage > 0 && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isBible ? `Versículo: ${data.endPage}` : `Marcador en pág. ${data.endPage}`}
                      </p>
                    )}
                  </div>
                  {(data.pagesRead || 0) > 0 && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-500">{data.pagesRead}</p>
                      <p className="text-[10px] text-slate-400">{labelHistorial}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notepad */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Anotador</p>
            <button
              onClick={() => { setShowAddNote(true); setNewNotePage(String(currentPage)) }}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-full text-xs font-semibold active:scale-95 transition-all"
            >
              <Plus size={12} /> Nueva nota
            </button>
          </div>

          {/* Add note form */}
          {showAddNote && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Bookmark size={12} className="text-amber-500 flex-shrink-0" />
                <input
                  type={isBible ? 'text' : 'number'}
                  min="0" inputMode={isBible ? 'text' : 'numeric'}
                  value={newNotePage}
                  onChange={e => setNewNotePage(e.target.value)}
                  placeholder={isBible ? 'Versículo' : 'Pág.'}
                  className={`${isBible ? 'w-32' : 'w-20'} px-2 py-1 bg-white border border-amber-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-amber-300`}
                />
                <span className="text-xs text-slate-400">{isBible ? 'versículo' : 'página'}</span>
              </div>
              <textarea
                value={newNoteText}
                onChange={e => setNewNoteText(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Escribí tu nota aquí…"
                autoFocus
                className="w-full px-3 py-2 bg-white border border-amber-100 rounded-xl text-sm text-slate-700 placeholder-slate-300 outline-none focus:ring-2 focus:ring-amber-300 resize-none mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddNote(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={!newNoteText.trim()}
                  className="flex-1 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold disabled:opacity-40"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* Notes list — scroll garantizado cuando hay muchas notas */}
          {sortedNotes.length === 0 && !showAddNote ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
              <PenLine size={20} className="text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                {isBible
                  ? 'Anotá reflexiones o versículos destacados con su referencia bíblica'
                  : 'Anotá reflexiones, frases importantes o momentos del libro con su número de página'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-0.5">
              {sortedNotes.map(([id, note]) => (
                <div key={id} className="bg-white rounded-2xl border border-slate-100 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Bookmark size={10} className="text-amber-500 flex-shrink-0" />
                    <span className="text-[10px] font-semibold text-amber-600">
                      {isBible ? note.page : `Pág. ${note.page}`}
                    </span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(note.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </span>
                    <button
                      onClick={() => handleDeleteNote(id)}
                      className="ml-auto text-slate-200 hover:text-red-400 transition-colors p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{note.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* General note */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nota general del libro</p>
          <div className="bg-white rounded-2xl border border-slate-100 p-3">
            <textarea
              value={relaxNote}
              onChange={e => { setRelaxNote(e.target.value); saveNoteDebounced(e.target.value) }}
              rows={3}
              maxLength={500}
              placeholder="Impresiones generales, personajes favoritos, lo que sentís al leer…"
              className="w-full bg-transparent text-sm text-slate-700 outline-none resize-none placeholder-slate-300 leading-relaxed"
            />
          </div>
        </div>

        <div className="h-4" />
      </div>

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6 bg-black/40">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl">
            <p className="font-bold text-slate-800 mb-1">Eliminar plan</p>
            <p className="text-sm text-slate-500 mb-4">
              Se borrará el plan, el historial y todas las notas. No se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-semibold"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
