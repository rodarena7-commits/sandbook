import { useState, useCallback } from 'react'
import { ArrowLeft, Check, Trash2, StickyNote, Bookmark, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { bibleBooks } from '../../data/bibleBooks'
import {
  saveBookProgress, saveBibleMeta, deleteBiblePlan,
  countCompleted, TOTAL_CHAPTERS,
} from '../../hooks/useBibleProgress'

const OT_COUNT = 39 // Old Testament books

function debounce(fn, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}

// ── Single Bible Book Section ──────────────────────────────
function BibleBookSection({ bookIdx, bookData, progress, uid, bookId }) {
  const [open, setOpen] = useState(false)
  const [showNote, setShowNote] = useState(false)

  const completed  = progress?.completed || []
  const note       = progress?.note || ''
  const totalChaps = bookData.chapters.length
  const doneCount  = completed.length

  async function toggleChapter(chap) {
    const next = completed.includes(chap)
      ? completed.filter(c => c !== chap)
      : [...completed, chap].sort((a, b) => a - b)
    await saveBookProgress(uid, bookId, bookIdx, next, note)
  }

  async function saveNote(val) {
    await saveBookProgress(uid, bookId, bookIdx, completed, val)
  }

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${doneCount === totalChaps ? 'border-green-300 bg-green-50/30' : 'border-slate-200 bg-white'}`}>
      {/* Book header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button onClick={() => setOpen(v => !v)} className="flex-1 flex items-center gap-2 text-left">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${doneCount === totalChaps ? 'bg-green-500 border-green-500' : doneCount > 0 ? 'border-amber-400' : 'border-slate-300'}`}>
            {doneCount === totalChaps
              ? <Check size={12} className="text-white"/>
              : doneCount > 0 && <span className="text-[8px] font-bold text-amber-600">{doneCount}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${doneCount === totalChaps ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {bookData.name}
            </p>
            <p className="text-[10px] text-slate-400">{doneCount}/{totalChaps} capítulos</p>
          </div>
        </button>

        <button onClick={() => setShowNote(v => !v)}
          className={`p-1.5 rounded-full flex-shrink-0 ${showNote || note ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}>
          <StickyNote size={13}/>
        </button>
        <button onClick={() => setOpen(v => !v)} className="text-slate-400 flex-shrink-0">
          {open ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
        </button>
      </div>

      {/* Note */}
      {showNote && (
        <div className="px-3 pb-2">
          <textarea defaultValue={note} rows={2} maxLength={300}
            placeholder={`Notas sobre ${bookData.name}…`}
            onBlur={e => saveNote(e.target.value)}
            className="w-full px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-slate-700 placeholder-slate-300 outline-none focus:ring-2 focus:ring-amber-300 resize-none"/>
        </div>
      )}

      {/* Chapters grid */}
      {open && (
        <div className="px-3 pb-3 border-t border-slate-100">
          <div className="flex flex-wrap gap-1.5 pt-2">
            {bookData.chapters.map(chap => {
              const done = completed.includes(chap)
              return (
                <button key={chap} onClick={() => toggleChapter(chap)}
                  className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all active:scale-90 ${
                    done ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700'
                  }`}>
                  {chap}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Testament Section ──────────────────────────────────────
function TestamentSection({ title, books, startIdx, progress, uid, bookId }) {
  const [open, setOpen] = useState(true)

  const totalChaps = books.reduce((s, b) => s + b.chapters.length, 0)
  const doneChaps  = books.reduce((s, b, i) => s + (progress?.[startIdx + i]?.completed?.length || 0), 0)

  return (
    <div className="mb-4">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-amber-500 rounded-2xl mb-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{title}</span>
          <span className="text-xs text-white/70">{books.length} libros</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white font-medium">{doneChaps}/{totalChaps} caps</span>
          {open ? <ChevronUp size={15} className="text-white"/> : <ChevronDown size={15} className="text-white"/>}
        </div>
      </button>

      {open && (
        <div className="flex flex-col gap-2">
          {books.map((b, i) => (
            <BibleBookSection
              key={b.name}
              bookIdx={startIdx + i}
              bookData={b}
              progress={progress?.[startIdx + i]}
              uid={uid}
              bookId={bookId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main View ──────────────────────────────────────────────
export default function BiblePlanView({ book, uid, onClose, onDelete, readonly = false }) {
  const progress     = book.bibleProgress || {}
  const completed    = countCompleted(progress)
  const pct          = Math.round((completed / TOTAL_CHAPTERS) * 100)

  const [currentVerse, setCurrentVerse] = useState(book.currentVerse || '')
  const [planNote, setPlanNote]         = useState(book.planNote || '')
  const [showDelete, setShowDelete]     = useState(false)

  const saveVerseDb = useCallback(debounce(val => saveBibleMeta(uid, book.bookId, 'currentVerse', val), 800), [])
  const saveNoteDb  = useCallback(debounce(val => saveBibleMeta(uid, book.bookId, 'planNote', val), 800), [])

  async function handleDelete() {
    await deleteBiblePlan(uid, book.bookId)
    onDelete?.()
    onClose()
  }

  const OT = bibleBooks.slice(0, OT_COUNT)
  const NT = bibleBooks.slice(OT_COUNT)

  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-amber-500 flex items-center gap-3 px-4 pt-12 pb-3 flex-shrink-0 shadow-sm">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white flex-shrink-0">
          <ArrowLeft size={16}/>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Santa Biblia</p>
          <p className="text-[10px] text-white/70">66 libros · {TOTAL_CHAPTERS} capítulos</p>
        </div>
        {!readonly && (
          <button onClick={() => setShowDelete(true)} className="text-white/60 hover:text-white p-1 flex-shrink-0">
            <Trash2 size={15}/>
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="bg-white px-4 py-3 flex-shrink-0 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs text-slate-400">{completed} de {TOTAL_CHAPTERS} capítulos leídos</p>
          <p className="text-xs font-bold text-amber-500">{pct}%</p>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}/>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          {bibleBooks.filter((_, i) => (progress[i]?.completed?.length || 0) === bibleBooks[i].chapters.length).length} libros completados de 66
        </p>
      </div>

      {/* Sticky controls */}
      {!readonly && (
        <div className="bg-white px-4 py-3 flex flex-col gap-2 flex-shrink-0 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-3 py-2">
            <Bookmark size={13} className="text-amber-500 flex-shrink-0"/>
            <input
              value={currentVerse}
              onChange={e => { setCurrentVerse(e.target.value); saveVerseDb(e.target.value) }}
              placeholder="Versículo actual (ej: Juan 3:16)"
              className="bg-transparent text-sm text-slate-700 outline-none flex-1 placeholder-slate-400"
            />
          </div>
          <div className="flex items-start gap-2 bg-amber-50 rounded-2xl px-3 py-2">
            <StickyNote size={13} className="text-amber-400 flex-shrink-0 mt-0.5"/>
            <textarea
              value={planNote}
              onChange={e => { setPlanNote(e.target.value); saveNoteDb(e.target.value) }}
              rows={2} maxLength={400}
              placeholder="Nota general de tu lectura…"
              className="bg-transparent text-sm text-slate-700 outline-none w-full resize-none placeholder-slate-300 leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* Show verse and note in readonly mode */}
      {readonly && (currentVerse || planNote) && (
        <div className="bg-white px-4 py-3 flex flex-col gap-2 flex-shrink-0 border-b border-slate-100">
          {currentVerse && (
            <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-3 py-2">
              <Bookmark size={13} className="text-amber-500 flex-shrink-0"/>
              <p className="text-sm text-slate-700">{currentVerse}</p>
            </div>
          )}
          {planNote && (
            <div className="flex items-start gap-2 bg-amber-50 rounded-2xl px-3 py-2">
              <StickyNote size={13} className="text-amber-400 flex-shrink-0 mt-0.5"/>
              <p className="text-sm text-slate-600 leading-relaxed">{planNote}</p>
            </div>
          )}
        </div>
      )}

      {/* Bible books */}
      <div className="overflow-y-auto flex-1 px-4 py-4">
        <TestamentSection
          title="Antiguo Testamento"
          books={OT}
          startIdx={0}
          progress={progress}
          uid={uid}
          bookId={book.bookId}
        />
        <TestamentSection
          title="Nuevo Testamento"
          books={NT}
          startIdx={OT_COUNT}
          progress={progress}
          uid={uid}
          bookId={book.bookId}
        />
        <div className="h-6"/>
      </div>

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6 bg-black/40">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl">
            <p className="font-bold text-slate-800 mb-1">Eliminar plan bíblico</p>
            <p className="text-sm text-slate-500 mb-4">Se borrará todo el progreso. No se puede deshacer.</p>
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
