import { useState } from 'react'
import { BookOpen, Star, Trash2, ChevronDown, ThumbsUp, ThumbsDown } from 'lucide-react'
import BookCoverUpload from './BookCoverUpload'

const STATUS_LABELS = {
  reading: 'Leyendo',
  read:    'Leído',
  pending: 'Pendiente',
  library: 'Biblioteca',
}

const STATUS_COLORS = {
  reading: 'bg-amber-100 text-amber-700',
  read:    'bg-green-100 text-green-700',
  pending: 'bg-slate-100 text-slate-500',
  library: 'bg-blue-100 text-blue-600',
}

export default function BookCard({ book, onStatusChange, onToggleFavorite, onRemove, onReaction, onSelect, onOpenPlan }) {
  const [showMenu, setShowMenu] = useState(false)

  function handleStatusChange(status) {
    setShowMenu(false)
    onStatusChange(book.bookId, status)
  }

  function handleReaction(e, type) {
    e.stopPropagation()
    const next = book.myReaction === type ? null : type
    onReaction && onReaction(book.bookId, next)
  }

  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-visible flex flex-col">
      {/* Cover */}
      <div className="relative">
        {/* Cover con upload integrado */}
        <div
          className="w-full aspect-[2/3] rounded-t-2xl overflow-hidden cursor-pointer"
          onClick={() => onSelect && onSelect(book)}
        >
          <BookCoverUpload
            bookId={book.bookId}
            src={book.customThumbnail || book.thumbnail}
            title={book.title}
            className="rounded-t-2xl"
            isOwnBook
            onUpdated={() => {}}
          />
        </div>

        {/* Favorite star */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite(book.bookId, book.isFavorite) }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm z-10"
        >
          <Star size={13} className={book.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
        </button>
      </div>

      {/* Info */}
      <div className="p-2 flex flex-col gap-1 flex-1">
        <p className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-2">{book.title}</p>
        {book.authors?.length > 0 && (
          <p className="text-[9px] text-slate-400 line-clamp-1">{book.authors[0]}</p>
        )}

        {/* Status badge */}
        <div className="relative mt-auto">
          <button
            onClick={() => setShowMenu(v => !v)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium w-full justify-between ${STATUS_COLORS[book.status] || STATUS_COLORS.library}`}
          >
            <span>{STATUS_LABELS[book.status] || 'Biblioteca'}</span>
            <ChevronDown size={9} />
          </button>

          {showMenu && (
            <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl shadow-lg border border-slate-100 z-20 w-32 overflow-hidden">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => handleStatusChange(key)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 ${book.status === key ? 'font-semibold text-amber-600' : 'text-slate-700'}`}>
                  {label}
                </button>
              ))}
              <div className="border-t border-slate-100" />
              <button onClick={() => { setShowMenu(false); onRemove(book.bookId) }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 flex items-center gap-1.5">
                <Trash2 size={10} /> Eliminar
              </button>
            </div>
          )}
        </div>

        {/* Reactions */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            onClick={e => handleReaction(e, 'like')}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] transition-all ${
              book.myReaction === 'like'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-500'
            }`}
          >
            <ThumbsUp size={9} />
          </button>
          <button
            onClick={e => handleReaction(e, 'dislike')}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] transition-all ${
              book.myReaction === 'dislike'
                ? 'bg-red-100 text-red-500'
                : 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-400'
            }`}
          >
            <ThumbsDown size={9} />
          </button>

          {/* Rating dots */}
          {book.rating > 0 && (
            <div className="flex gap-0.5 ml-auto">
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={7} className={n <= book.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showMenu && <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />}
    </div>
  )
}
