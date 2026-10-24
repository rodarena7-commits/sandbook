import { useState } from 'react'
import { ArrowLeft, Trash2, Timer, Play, Pause, Square, Bookmark, Clock, X } from 'lucide-react'
import { setTimePlanMinutes, deleteTimeSession, deleteTimePlan, DEFAULT_TIME_PLAN_MINUTES } from '../../hooks/useReadingPlan'
import { useReadingTimer, formatClock, formatDuration } from '../../contexts/ReadingTimerContext'

export const TIME_PRESETS = [10, 15, 20, 30, 45, 60]

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export default function TimePlanView({ book, uid, onClose, onDelete }) {
  const plan       = book.timePlan || {}
  const totalPages = plan.totalPages || book.pageCount || 0
  const { timer, remainingMs, start, pause, resume, finishEarly } = useReadingTimer()

  const [minutes, setMinutes]       = useState(plan.minutes || DEFAULT_TIME_PLAN_MINUTES)
  const [custom, setCustom]         = useState(TIME_PRESETS.includes(plan.minutes || DEFAULT_TIME_PLAN_MINUTES) ? '' : String(plan.minutes))
  const [showDelete, setShowDelete] = useState(false)

  const sessions = Object.entries(book.timeSessions || {})
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''))
  const totalSeconds = sessions.reduce((sum, s) => sum + (s.seconds || 0), 0)
  const currentPage  = Number(book.currentPage) || 0
  const pct = totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : null

  const mine      = timer?.bookId === book.bookId
  const otherBook = timer && !mine
  const running   = mine && timer.status === 'running'
  const paused    = mine && timer.status === 'paused'
  const done      = mine && timer.status === 'done'

  function pickMinutes(m) {
    setMinutes(m)
    setCustom('')
    setTimePlanMinutes(uid, book.bookId, m).catch(() => {})
  }

  function handleCustom(val) {
    setCustom(val)
    const m = Number(val)
    if (m > 0 && m <= 600) {
      setMinutes(m)
      setTimePlanMinutes(uid, book.bookId, m).catch(() => {})
    }
  }

  async function handleDeleteSession(s) {
    if (!window.confirm('¿Borrar esta sesión del historial?')) return
    await deleteTimeSession(uid, book.bookId, s.id, s.seconds)
  }

  async function handleDeletePlan() {
    await deleteTimePlan(uid, book.bookId)
    onDelete?.()
    onClose()
  }

  const cover = book.customThumbnail || book.thumbnail
  const clockMs = mine ? remainingMs : minutes * 60 * 1000
  const progress = mine && timer.durationSec > 0 ? 1 - remainingMs / (timer.durationSec * 1000) : 0

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
            <Timer size={10} className="text-violet-500" />
            <p className="text-[10px] text-violet-500 font-medium">Plan por tiempo</p>
            {totalPages > 0 && <p className="text-[10px] text-slate-400">· {totalPages} págs totales</p>}
          </div>
        </div>
        <button onClick={() => setShowDelete(true)} aria-label="Borrar plan" className="text-slate-300 hover:text-red-400 p-1 flex-shrink-0">
          <Trash2 size={15} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-4">

        {/* Resumen */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-violet-500 rounded-2xl p-4 text-white text-center shadow-sm">
            <p className="text-2xl font-bold">{formatDuration(totalSeconds)}</p>
            <p className="text-[11px] text-violet-100 mt-0.5">tiempo total leído</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100">
            <p className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-1.5">
              <Bookmark size={16} className="text-violet-400" /> {currentPage}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {pct !== null ? `página actual · ${pct}%` : 'página actual'}
            </p>
          </div>
        </div>

        {/* Temporizador */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="relative mx-auto w-48 h-48 mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#ede9fe" strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
                className="transition-all duration-500" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-slate-800 tabular-nums">{formatClock(clockMs)}</span>
              <span className="text-[11px] text-slate-400 mt-1">
                {running ? 'leyendo…' : paused ? 'en pausa' : done ? '¡tiempo cumplido!' : 'listo para empezar'}
              </span>
            </div>
          </div>

          {!mine && (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center mb-2">¿Cuánto tiempo querés leer?</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {TIME_PRESETS.map(m => (
                  <button key={m} onClick={() => pickMinutes(m)}
                    className={`py-2 rounded-xl text-sm font-semibold transition-all ${minutes === m && !custom ? 'bg-violet-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}`}>
                    {m} min
                  </button>
                ))}
              </div>
              <div className="relative mb-4">
                <input
                  type="number" min="1" max="600" inputMode="numeric"
                  value={custom}
                  onChange={e => handleCustom(e.target.value)}
                  placeholder="Otro tiempo"
                  className={`w-full px-4 py-2.5 pr-16 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400 ${custom ? 'bg-violet-50 text-violet-700 font-semibold' : 'bg-slate-100 text-slate-800'}`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">minutos</span>
              </div>

              {otherBook ? (
                <p className="text-xs text-center text-amber-600 bg-amber-50 rounded-xl px-3 py-2.5">
                  Ya tenés un temporizador corriendo para «{timer.title}». Terminalo antes de empezar otro.
                </p>
              ) : (
                <button onClick={() => start(book, minutes)} disabled={!(minutes > 0)}
                  className="w-full py-3.5 bg-violet-500 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all shadow-sm">
                  <Play size={16} /> Empezar a leer {minutes} min
                </button>
              )}
              <p className="text-[10px] text-slate-400 text-center mt-2 leading-relaxed">
                Cuando se cumpla el tiempo suena una alarma y anotás en qué página quedaste.
                Mientras corre, la pantalla queda encendida.
              </p>
            </>
          )}

          {(running || paused) && (
            <div className="flex gap-2">
              <button onClick={running ? pause : resume}
                className="flex-1 py-3 bg-violet-500 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
                {running ? <><Pause size={15} /> Pausar</> : <><Play size={15} /> Seguir</>}
              </button>
              <button onClick={finishEarly}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Square size={13} /> Terminar
              </button>
            </div>
          )}
        </div>

        {/* Historial */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">Historial de lectura</p>
          {sessions.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-100">
              <Clock size={22} className="text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Todavía no hay sesiones. Empezá tu primera lectura con el temporizador.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
              {sessions.map(s => {
                const pages = Math.max(0, (s.endPage || 0) - (s.startPage || 0))
                return (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <Timer size={15} className="text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">{formatDuration(s.seconds)}</p>
                      <p className="text-[11px] text-slate-400 capitalize">{formatDate(s.startedAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-slate-600">pág. {s.startPage} → {s.endPage}</p>
                      <p className="text-[10px] text-slate-400">{pages} {pages === 1 ? 'página' : 'páginas'}</p>
                    </div>
                    <button onClick={() => handleDeleteSession(s)} aria-label="Borrar sesión" className="text-slate-200 hover:text-red-400 p-1 flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-end" onClick={() => setShowDelete(false)}>
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl p-5 pb-8" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-slate-800 mb-1">¿Borrar el plan por tiempo?</p>
            <p className="text-xs text-slate-500 mb-4">Se borra el historial de sesiones y el tiempo total de este libro.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-semibold">Cancelar</button>
              <button onClick={handleDeletePlan} className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-semibold">Borrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
