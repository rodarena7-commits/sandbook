import { useState, useRef, useCallback } from 'react'
import { ArrowLeft, Check, BookOpen, Trash2, StickyNote, Bookmark } from 'lucide-react'
import { calculatePlan, updatePlanDay, savePlanMeta, deleteReadingPlan } from '../../hooks/useReadingPlan'

function debounce(fn, ms) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

export default function ReadingPlanView({ book, uid, onClose, onDelete }) {
  const plan     = book.readingPlan
  const planDays = book.planDays || {}
  const days     = calculatePlan(plan.totalPages, plan.totalDays)

  const [currentPage, setCurrentPage] = useState(book.currentPage || 0)
  const [planNote, setPlanNote]       = useState(book.planNote || '')
  const [dayData, setDayData]         = useState(planDays)
  const [showDelete, setShowDelete]   = useState(false)
  const [dayNotes, setDayNotes]       = useState({}) // open day note editors

  const savePageDebounced = useCallback(debounce(val =>
    savePlanMeta(uid, book.bookId, 'currentPage', Number(val)), 800), [])

  const saveNoteDebounced = useCallback(debounce(val =>
    savePlanMeta(uid, book.bookId, 'planNote', val), 800), [])

  function handlePageChange(val) {
    setCurrentPage(val)
    savePageDebounced(val)
  }

  function handleNoteChange(val) {
    setPlanNote(val)
    saveNoteDebounced(val)
  }

  async function toggleDay(day) {
    const prev = dayData[day] || {}
    const next = { ...prev, checked: !prev.checked }
    setDayData(d => ({ ...d, [day]: next }))
    await updatePlanDay(uid, book.bookId, day, next)
  }

  async function saveDayNote(day, note) {
    const prev = dayData[day] || {}
    const next = { ...prev, note }
    setDayData(d => ({ ...d, [day]: next }))
    await updatePlanDay(uid, book.bookId, day, next)
  }

  const startDate = plan.startDate ? new Date(plan.startDate + 'T00:00:00') : new Date()

  function dayDate(dayNum) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + dayNum - 1)
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const completed = Object.values(dayData).filter(d => d?.checked).length
  const pct       = Math.round((completed / days.length) * 100)
  const cover     = book.customThumbnail || book.thumbnail

  async function handleDelete() {
    await deleteReadingPlan(uid, book.bookId)
    onDelete && onDelete()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col max-w-lg mx-auto">

      {/* Header */}
      <div className="bg-white shadow-sm flex items-center gap-3 px-4 pt-12 pb-3 flex-shrink-0">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 flex-shrink-0">
          <ArrowLeft size={16} />
        </button>
        {cover && <img src={cover} alt="" className="w-8 h-11 object-cover rounded-lg flex-shrink-0 shadow-sm" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 line-clamp-1">{book.title}</p>
          <p className="text-[10px] text-slate-400">{plan.totalPages} págs · {plan.totalDays} días · {plan.dailyPages} págs/día</p>
        </div>
        <button onClick={() => setShowDelete(true)} className="text-slate-300 hover:text-red-400 transition-colors p-1">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-white px-4 pb-3 flex-shrink-0 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-slate-400">{completed} de {days.length} días completados</p>
          <p className="text-xs font-semibold text-amber-500">{pct}%</p>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Sticky: current page + note */}
      <div className="bg-white px-4 py-3 flex gap-3 flex-shrink-0 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-1 bg-slate-100 rounded-2xl px-3 py-2">
          <Bookmark size={13} className="text-amber-500 flex-shrink-0" />
          <input
            type="number" min="0" max={plan.totalPages} inputMode="numeric"
            value={currentPage}
            onChange={e => handlePageChange(e.target.value)}
            className="bg-transparent text-sm text-slate-700 outline-none w-full"
            placeholder="Página actual"
          />
          <span className="text-xs text-slate-400 flex-shrink-0">/ {plan.totalPages}</span>
        </div>
      </div>

      {/* Note general */}
      <div className="bg-white px-4 pb-3 flex-shrink-0 border-b border-slate-100">
        <div className="flex items-start gap-2 bg-amber-50 rounded-2xl px-3 py-2">
          <StickyNote size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <textarea
            value={planNote}
            onChange={e => handleNoteChange(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Notas del libro…"
            className="bg-transparent text-sm text-slate-700 outline-none w-full resize-none placeholder-slate-300 leading-relaxed"
          />
        </div>
      </div>

      {/* Days list */}
      <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-2">
        {days.map(d => {
          const dData   = dayData[d.day] || {}
          const checked = !!dData.checked
          const note    = dData.note || ''
          const showNote = dayNotes[d.day]

          return (
            <div key={d.day}
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${checked ? 'border-green-200' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3 px-3 py-3">
                {/* Checkbox */}
                <button onClick={() => toggleDay(d.day)}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
                    checked ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-400'
                  }`}>
                  {checked && <Check size={14} className="text-white" />}
                </button>

                {/* Day info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className={`text-sm font-semibold ${checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      Día {d.day}
                    </p>
                    <p className="text-[10px] text-slate-400">{dayDate(d.day)}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Págs {d.start}–{d.end}
                    <span className="text-slate-300 ml-1">({d.pages} págs)</span>
                  </p>
                  {note && !showNote && (
                    <p className="text-[10px] text-amber-600 italic mt-0.5 line-clamp-1">"{note}"</p>
                  )}
                </div>

                {/* Note toggle */}
                <button
                  onClick={() => setDayNotes(n => ({ ...n, [d.day]: !n[d.day] }))}
                  className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${showNote || note ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}>
                  <StickyNote size={13} />
                </button>
              </div>

              {/* Inline note editor */}
              {showNote && (
                <div className="px-3 pb-3">
                  <textarea
                    defaultValue={note}
                    rows={2}
                    maxLength={200}
                    placeholder="Anotá algo sobre este día…"
                    onBlur={e => saveDayNote(d.day, e.target.value)}
                    className="w-full px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-slate-700 placeholder-slate-300 outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                  />
                </div>
              )}
            </div>
          )
        })}

        <div className="h-6" />
      </div>

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6 bg-black/40">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl">
            <p className="font-bold text-slate-800 mb-1">Eliminar plan</p>
            <p className="text-sm text-slate-500 mb-4">Se borrará el plan y todo el progreso. No se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-medium">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-semibold">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
