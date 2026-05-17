import { useState } from 'react'
import { X, BookOpen, CalendarDays } from 'lucide-react'
import { calculatePlan } from '../../hooks/useReadingPlan'

export default function CreatePlanSheet({ book, onSave, onClose }) {
  const [totalPages, setTotalPages] = useState(book.pageCount > 0 ? String(book.pageCount) : '')
  const [totalDays,  setTotalDays]  = useState('')
  const [saving, setSaving] = useState(false)

  const pages  = Number(totalPages)
  const days   = Number(totalDays)
  const valid  = pages > 0 && days > 0
  const daily  = valid ? Math.ceil(pages / days) : 0

  async function handleCreate() {
    if (!valid) return
    setSaving(true)
    await onSave(pages, days)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl p-5 pb-10">
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

        {/* Inputs */}
        <div className="flex flex-col gap-4 mb-5">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
              Cantidad de páginas
            </label>
            <input
              type="number" min="1" inputMode="numeric"
              value={totalPages}
              onChange={e => setTotalPages(e.target.value)}
              placeholder="ej: 320"
              className="w-full px-4 py-3 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
              Días para terminarlo
            </label>
            <input
              type="number" min="1" inputMode="numeric"
              value={totalDays}
              onChange={e => setTotalDays(e.target.value)}
              placeholder="ej: 30"
              className="w-full px-4 py-3 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Preview */}
        {valid && (
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
          disabled={!valid || saving}
          className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-95 transition-all shadow-sm"
        >
          {saving ? 'Creando plan…' : 'Crear plan de lectura'}
        </button>
      </div>
    </div>
  )
}
