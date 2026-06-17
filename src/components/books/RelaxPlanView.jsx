import { useState, useCallback, useEffect, useRef } from 'react'
import {
  ArrowLeft, Bookmark, Trash2, PenLine, Plus, X, Coffee, Pencil, Check,
} from 'lucide-react'
import {
  updateRelaxPage, addRelaxNote, deleteRelaxNote,
  savePlanMeta, deleteRelaxPlan,
  deleteRelaxHistoryDay, updateRelaxHistoryDay,
} from '../../hooks/useReadingPlan'

function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}
export default function RelaxPlanView({ book, uid, onClose, onDelete, isBible: initialIsBible = false, onFinish }) {
  const isBible = false // Plan Relax siempre realiza seguimiento por páginas
  const plan       = book.relaxPlan || {}
  const totalPages = plan.totalPages || 0
  const labelMarcador  = '¿En qué página quedaste?'
  const labelPagina    = 'Página'
  const labelHistorial = 'págs leídas'

  const [currentPage,   setCurrentPage]   = useState(book.currentPage || 0)
  const [relaxNote,     setRelaxNote]     = useState(book.relaxNote || '')
  const [relaxNotes,    setRelaxNotes]    = useState(book.relaxNotes || {})
  const [dailyHistory,  setDailyHistory]  = useState(book.dailyHistory || {})
  const [showDelete,    setShowDelete]    = useState(false)
  const [showAddNote,   setShowAddNote]   = useState(false)
  const [newNoteText,   setNewNoteText]   = useState('')
  const [newNotePage,   setNewNotePage]   = useState(String(book.currentPage || 0))
  const [editingDay,    setEditingDay]    = useState(null)   // date string being edited
  const [editDayPage,   setEditDayPage]   = useState('')
  const wasComplete = useRef(totalPages > 0 && Number(book.currentPage || 0) >= totalPages)
  const isComplete  = totalPages > 0 && Number(currentPage) >= totalPages

  const saveNoteDebounced = useCallback(
    debounce(val => savePlanMeta(uid, book.bookId, 'relaxNote', val), 800),
    []
  )

  useEffect(() => {
    const complete = totalPages > 0 && Number(currentPage) >= totalPages
    if (complete && !wasComplete.current) onFinish?.()
    wasComplete.current = complete
  }, [currentPage])

  async function handlePageChange(val) {
    const newPage = Number(val)
    setCurrentPage(val)
    const today = new Date().toISOString().slice(0, 10)
    setDailyHistory(prev => ({
      ...prev,
      [today]: { ...prev[today], endPage: newPage },
    }))
    await updateRelaxPage(uid, book.bookId, newPage)
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

  async function handleDeleteHistoryDay(date) {
    setDailyHistory(prev => { const n = { ...prev }; delete n[date]; return n })
    await deleteRelaxHistoryDay(uid, book.bookId, date)
  }

  async function handleSaveHistoryDay(date) {
    const newPage = Number(editDayPage)
    setDailyHistory(prev => ({ ...prev, [date]: { ...prev[date], endPage: newPage } }))
    setEditingDay(null)
    await updateRelaxHistoryDay(uid, book.bookId, date, newPage)
  }

  async function handleDelete() {
    await deleteRelaxPlan(uid, book.bookId)
    onDelete?.()
    onClose()
  }

  const cover = book.customThumbnail || book.thumbnail

  // Compute daily progress as endPage diff between consecutive days (not cumulative input)
  const sortedAsc = Object.entries(dailyHistory).sort((a, b) => a[0].localeCompare(b[0]))
  const historyWithProgress = sortedAsc.map(([date, data], i) => {
    const prevEnd = i > 0 ? (sortedAsc[i - 1][1].endPage || 0) : 0
    return [date, { ...data, pagesRead: Math.max(0, (data.endPage || 0) - prevEnd) }]
  })
  const sortedHistory = [...historyWithProgress].reverse()
  const sortedNotes   = Object.entries(relaxNotes).sort((a, b) => b[1].createdAt.localeCompare(a[1].createdAt))
  const totalRead     = historyWithProgress.reduce((sum, [, d]) => sum + d.pagesRead, 0)

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
        <div className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 border ${isComplete ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-100'}`}>
          <Bookmark size={14} className={`${isComplete ? 'text-green-500' : 'text-blue-500'} flex-shrink-0`} />
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
        {(totalRead > 0 || isComplete) && (
          <div className={`${isComplete ? 'bg-green-500' : 'bg-blue-500'} rounded-2xl p-4 text-white text-center shadow-sm`}>
            {isComplete ? (
              <>
                <p className="text-2xl mb-1">✅</p>
                <p className="text-sm font-bold">¡Libro terminado!</p>
                <p className="text-xs text-white/80 mt-0.5">Marcado como leído</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold">{totalRead}</p>
                <p className="text-xs text-blue-100 mt-0.5">{labelHistorial} en total</p>
              </>
            )}
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
                <div key={date} className="bg-white rounded-2xl border border-slate-100 px-4 py-3">
                  {editingDay === date ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-700 capitalize mb-1">{formatDate(date)}</p>
                        <input
                          type={isBible ? 'text' : 'number'}
                          inputMode={isBible ? 'text' : 'numeric'}
                          value={editDayPage}
                          onChange={e => setEditDayPage(e.target.value)}
                          autoFocus
                          className="w-full px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder={isBible ? 'Versículo' : 'Página'}
                        />
                      </div>
                      <button
                        onClick={() => handleSaveHistoryDay(date)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white flex-shrink-0"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingDay(null)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-700 capitalize">{formatDate(date)}</p>
                        {data.endPage > 0 && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {isBible ? `Versículo: ${data.endPage}` : `Marcador en pág. ${data.endPage}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {(data.pagesRead || 0) > 0 && (
                          <div className="text-right mr-2">
                            <p className="text-lg font-bold text-blue-500">{data.pagesRead}</p>
                            <p className="text-[10px] text-slate-400">{labelHistorial}</p>
                          </div>
                        )}
                        <button
                          onClick={() => { setEditingDay(date); setEditDayPage(String(data.endPage || '')) }}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteHistoryDay(date)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
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
