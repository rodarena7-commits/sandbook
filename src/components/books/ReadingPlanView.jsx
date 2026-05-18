import { useState, useCallback } from 'react'
import {
  ArrowLeft, Check, Trash2, StickyNote, Bookmark,
  ChevronDown, ChevronUp, BookOpen,
} from 'lucide-react'
import { calculatePlan, updatePlanDay, savePlanMeta, deleteReadingPlan } from '../../hooks/useReadingPlan'

function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}

function dayLabel(startDate, dayNum) {
  const d = new Date(startDate + 'T00:00:00')
  d.setDate(d.getDate() + dayNum - 1)
  return {
    short: d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }),
    week:  d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
  }
}

// ── Single Day Row ─────────────────────────────────────────
function DayRow({ d, dayData, startDate, uid, bookId, onToggle }) {
  const data    = dayData[d.day] || {}
  const checked = !!data.checked
  const [showNote, setShowNote] = useState(false)
  const note = data.note || ''
  const label = dayLabel(startDate, d.day)

  async function saveNote(val) {
    await updatePlanDay(uid, bookId, d.day, { ...data, note: val })
  }

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${checked ? 'border-green-200 bg-green-50/30' : 'border-slate-100 bg-white'}`}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(d.day, data)}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${checked ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-400'}`}
        >
          {checked && <Check size={13} className="text-white" />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <p className={`text-xs font-semibold ${checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              Día {d.day}
            </p>
            <p className="text-[10px] text-slate-400">{label.short}</p>
          </div>
          <p className="text-[10px] text-slate-500">
            Págs {d.start}–{d.end} <span className="text-slate-300">({d.pages} págs)</span>
          </p>
          {note && !showNote && (
            <p className="text-[10px] text-amber-600 italic line-clamp-1 mt-0.5">"{note}"</p>
          )}
        </div>

        {/* Note toggle */}
        <button
          onClick={() => setShowNote(v => !v)}
          className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${showNote || note ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}
        >
          <StickyNote size={13} />
        </button>
      </div>

      {/* Note editor */}
      {showNote && (
        <div className="px-3 pb-3">
          <textarea
            defaultValue={note}
            rows={2}
            maxLength={200}
            placeholder="Anotá algo sobre este día…"
            onBlur={e => saveNote(e.target.value)}
            className="w-full px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-slate-700 placeholder-slate-300 outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          />
        </div>
      )}
    </div>
  )
}

// ── Week Section ───────────────────────────────────────────
function WeekSection({ weekNum, days, dayData, startDate, uid, bookId, onToggle }) {
  const [open, setOpen] = useState(true)

  const completed = days.filter(d => dayData[d.day]?.checked).length
  const total     = days.length

  const first = dayLabel(startDate, days[0].day).week
  const last  = dayLabel(startDate, days[days.length - 1].day).week

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
      {/* Week header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-all"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700">Semana {weekNum}</span>
          <span className="text-xs text-slate-400">{first} – {last}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${completed===total?'text-green-500':'text-slate-400'}`}>
            {completed}/{total}
          </span>
          {open ? <ChevronUp size={15} className="text-slate-400"/> : <ChevronDown size={15} className="text-slate-400"/>}
        </div>
      </button>

      {/* Days */}
      {open && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          {days.map(d => (
            <DayRow
              key={d.day}
              d={d}
              dayData={dayData}
              startDate={startDate}
              uid={uid}
              bookId={bookId}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main View ──────────────────────────────────────────────
export default function ReadingPlanView({ book, uid, onClose, onDelete }) {
  const plan      = book.readingPlan
  const allDays   = calculatePlan(plan.totalPages, plan.totalDays)
  const startDate = plan.startDate || new Date().toISOString().slice(0,10)

  const [dayData, setDayData]       = useState(book.planDays || {})
  const [currentPage, setCurrentPage] = useState(book.currentPage || 0)
  const [planNote, setPlanNote]     = useState(book.planNote || '')
  const [showDelete, setShowDelete] = useState(false)

  const savePageDebounced = useCallback(debounce(val =>
    savePlanMeta(uid, book.bookId, 'currentPage', Number(val)), 800), [])
  const saveNoteDebounced = useCallback(debounce(val =>
    savePlanMeta(uid, book.bookId, 'planNote', val), 800), [])

  async function toggleDay(day, data) {
    const next = { ...data, checked: !data.checked }
    setDayData(d => ({ ...d, [day]: next }))
    await updatePlanDay(uid, book.bookId, day, next)
  }

  async function handleDelete() {
    await deleteReadingPlan(uid, book.bookId)
    onDelete?.()
    onClose()
  }

  // Group into weeks
  const weeks = []
  for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i + 7))

  const totalCompleted = Object.values(dayData).filter(d => d?.checked).length
  const pct = Math.round((totalCompleted / allDays.length) * 100)
  const cover = book.customThumbnail || book.thumbnail

  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col max-w-lg mx-auto">

      {/* Header */}
      <div className="bg-white shadow-sm flex items-center gap-3 px-4 pt-12 pb-3 flex-shrink-0">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 flex-shrink-0">
          <ArrowLeft size={16} />
        </button>
        {cover && <img src={cover} alt="" className="w-8 h-11 object-cover rounded-lg flex-shrink-0 shadow-sm"/>}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 line-clamp-1">{book.title}</p>
          <p className="text-[10px] text-slate-400">
            {plan.totalPages} págs · Meta: {plan.totalDays} días · {plan.dailyPages} págs/día
          </p>
        </div>
        <button onClick={() => setShowDelete(true)} className="text-slate-300 hover:text-red-400 p-1 flex-shrink-0">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Progress */}
      <div className="bg-white px-4 pb-3 flex-shrink-0 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-slate-400">{totalCompleted} de {allDays.length} días completados</p>
          <p className="text-xs font-bold text-amber-500">{pct}%</p>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Sticky controls */}
      <div className="bg-white px-4 py-3 flex gap-3 flex-shrink-0 border-b border-slate-100">
        {/* Current page */}
        <div className="flex items-center gap-2 flex-1 bg-slate-100 rounded-2xl px-3 py-2">
          <Bookmark size={13} className="text-amber-500 flex-shrink-0" />
          <input
            type="number" min="0" max={plan.totalPages} inputMode="numeric"
            value={currentPage}
            onChange={e => { setCurrentPage(e.target.value); savePageDebounced(e.target.value) }}
            placeholder="Página actual"
            className="bg-transparent text-sm text-slate-700 outline-none w-full"
          />
          <span className="text-xs text-slate-400 flex-shrink-0">/ {plan.totalPages}</span>
        </div>
      </div>

      {/* General note */}
      <div className="bg-white px-4 pb-3 flex-shrink-0 border-b border-slate-100">
        <div className="flex items-start gap-2 bg-amber-50 rounded-2xl px-3 py-2.5">
          <StickyNote size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <textarea
            value={planNote}
            onChange={e => { setPlanNote(e.target.value); saveNoteDebounced(e.target.value) }}
            rows={2} maxLength={300}
            placeholder="Nota general del libro…"
            className="bg-transparent text-sm text-slate-700 outline-none w-full resize-none placeholder-slate-300 leading-relaxed"
          />
        </div>
      </div>

      {/* Weekly content */}
      <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-3">
        {weeks.map((week, i) => (
          <WeekSection
            key={i}
            weekNum={i + 1}
            days={week}
            dayData={dayData}
            startDate={startDate}
            uid={uid}
            bookId={book.bookId}
            onToggle={toggleDay}
          />
        ))}
        <div className="h-4" />
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
