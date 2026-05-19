import { useState } from 'react'
import { X, BookOpen, CalendarDays, Coffee, Target } from 'lucide-react'

export default function CreatePlanSheet({ book, onSave, onClose }) {
  const [planType, setPlanType] = useState(null) // 'relax' | 'meta'
  const [totalPages, setTotalPages] = useState(book.pageCount > 0 ? String(book.pageCount) : '')
  const [totalDays,  setTotalDays]  = useState('')
  const [saving,     setSaving]     = useState(false)

  const pages    = Number(totalPages)
  const days     = Number(totalDays)
  const validMeta = pages > 0 && days > 0
  const daily    = validMeta ? Math.ceil(pages / days) : 0

  async function handleCreate() {
    setSaving(true)
    if (planType === 'meta') {
      if (!validMeta) { setSaving(false); return }
      await onSave({ type: 'meta', pages, days })
    } else {
      await onSave({ type: 'relax', pages })
    }
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-amber-500" />
            <h3 className="font-bold text-slate-800">Plan de lectura</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <X size={15} />
          </button>
        </div>

        {/* Book preview */}
        <div className="flex gap-3 items-center bg-slate-50 rounded-2xl p-3 mb-5">
          {book.customThumbnail || book.thumbnail ? (
            <img src={book.customThumbnail || book.thumbnail} alt=""
              className="w-10 h-14 object-cover rounded-xl flex-shrink-0 shadow-sm" />
          ) : (
            <div className="w-10 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen size={14} className="text-slate-300" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 line-clamp-1">{book.title}</p>
            {book.authors?.[0] && <p className="text-xs text-slate-400">{book.authors[0]}</p>}
          </div>
        </div>

        {/* ── Selector de tipo ── */}
        {!planType && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide text-center mb-1">
              ¿Qué tipo de plan querés?
            </p>

            <button
              onClick={() => setPlanType('relax')}
              className="flex items-center gap-4 p-4 rounded-2xl border-2 border-blue-100 bg-blue-50 text-left active:scale-95 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Coffee size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Plan Relax</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Leé a tu ritmo. Solo marcá dónde quedaste y llevá un historial de tus días de lectura.
                </p>
              </div>
            </button>

            <button
              onClick={() => setPlanType('meta')}
              className="flex items-center gap-4 p-4 rounded-2xl border-2 border-amber-100 bg-amber-50 text-left active:scale-95 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Target size={20} className="text-amber-500" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Plan con Meta</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Definí en cuántos días querés terminar el libro y seguí tu progreso día a día.
                </p>
              </div>
            </button>
          </div>
        )}

        {/* ── Plan Relax ── */}
        {planType === 'relax' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setPlanType(null)} className="text-xs text-slate-400 underline">
                ← Cambiar tipo
              </button>
              <Coffee size={12} className="text-blue-400" />
              <span className="text-xs font-bold text-blue-500">Plan Relax</span>
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                Páginas totales (opcional)
              </label>
              <div className="relative">
                <input
                  type="number" min="1" inputMode="numeric"
                  value={totalPages}
                  onChange={e => setTotalPages(e.target.value)}
                  placeholder="ej: 320"
                  className="w-full px-4 py-3 pr-20 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-400"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">páginas</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5">
              <p className="text-xs text-blue-600 text-center leading-relaxed">
                Cada vez que leas, actualizá el marcador con tu página actual. El historial diario de páginas leídas se guarda automáticamente.
              </p>
            </div>

            <button
              onClick={handleCreate}
              disabled={saving}
              className="w-full py-3.5 bg-blue-500 text-white rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-95 transition-all shadow-sm"
            >
              {saving ? 'Creando plan…' : 'Crear Plan Relax'}
            </button>
          </>
        )}

        {/* ── Plan con Meta ── */}
        {planType === 'meta' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setPlanType(null)} className="text-xs text-slate-400 underline">
                ← Cambiar tipo
              </button>
              <Target size={12} className="text-amber-500" />
              <span className="text-xs font-bold text-amber-500">Plan con Meta</span>
            </div>

            <div className="flex flex-col gap-4 mb-5">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                  Páginas totales del libro
                </label>
                <div className="relative">
                  <input
                    type="number" min="1" inputMode="numeric"
                    value={totalPages}
                    onChange={e => setTotalPages(e.target.value)}
                    placeholder="ej: 320"
                    className="w-full px-4 py-3 pr-20 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">páginas</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
                  Meta — días para terminarlo
                </label>
                <div className="relative">
                  <input
                    type="number" min="1" inputMode="numeric"
                    value={totalDays}
                    onChange={e => setTotalDays(e.target.value)}
                    placeholder="ej: 30"
                    className="w-full px-4 py-3 pr-12 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">días</span>
                </div>
              </div>
            </div>

            {validMeta && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5 text-center">
                <p className="text-2xl font-bold text-amber-500">{daily}</p>
                <p className="text-xs text-amber-700 mt-0.5">páginas por día</p>
                <p className="text-[11px] text-slate-400 mt-2">
                  {pages} páginas en {days} días · empieza hoy
                </p>
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={!validMeta || saving}
              className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-95 transition-all shadow-sm"
            >
              {saving ? 'Creando plan…' : 'Crear plan de lectura'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
