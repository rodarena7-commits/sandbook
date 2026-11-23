import { useState } from 'react'
import { BookOpen, Star, Trash2, ChevronDown, ThumbsUp, ThumbsDown, User, Pencil, Bookmark, Share2, Heart, Users } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import BookCoverUpload from './BookCoverUpload'
import PeopleListSheet from './PeopleListSheet'
import { useBookStats } from '../../hooks/useBookStats'
import { useAuth } from '../../contexts/AuthContext'

async function shareBook(book, t) {
  const text = t('book_share_text', { title: book.title, author: book.authors?.[0] ? t('book_share_by', { author: book.authors[0] }) : '' })
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title: 'Sandbook', text, dialogTitle: t('book_share_dialog') })
    } else if (navigator.share) {
      await navigator.share({ title: 'Sandbook', text })
    } else {
      await navigator.clipboard?.writeText(text)
    }
  } catch { /* usuario canceló el share, ignorar */ }
}

// Estados posibles (el texto sale de las traducciones: status_<clave>)
const STATUS_KEYS = ['reading', 'read', 'pending', 'library', 'ebook', 'loaned']

const STATUS_COLORS = {
  reading: 'bg-amber-100 text-amber-700',
  read:    'bg-green-100 text-green-700',
  pending: 'bg-slate-100 text-slate-500',
  library: 'bg-blue-100 text-blue-600',
  ebook:   'bg-purple-100 text-purple-600',
  loaned:  'bg-rose-100 text-rose-700',
}

export default function BookCard({ book, onStatusChange, onToggleFavorite, onRemove, onReaction, onSelect, onOpenPlan, onStartPlan, onUpdateLoanedTo }) {
  const { t } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [showLoanedName, setShowLoanedName] = useState(false)
  const [showLikes, setShowLikes]     = useState(false)
  const [showReaders, setShowReaders] = useState(false)
  const stats = useBookStats(book.bookId)
  const likedBy   = stats?.likedBy   || []
  const readingBy = stats?.readingBy || []

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
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm"
        >
          <Star size={13} className={book.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
        </button>

        {/* Loaned person icon */}
        {book.status === 'loaned' && (
          <div className="absolute top-2 left-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLoanedName(v => !v);
              }}
              className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 transition-all active:scale-90"
              title={t('book_loaned')}
            >
              <User size={13} />
            </button>
            {showLoanedName && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowLoanedName(false); }} />
                <div className="absolute left-0 top-8 bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-lg whitespace-nowrap z-20 border border-slate-800 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <span>{t('book_loaned_to', { name: book.loanedTo || t('book_no_name') })}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const name = prompt(t('book_loaned_prompt'), book.loanedTo || '');
                      if (name !== null) {
                        onUpdateLoanedTo?.(book.bookId, name.trim());
                      }
                      setShowLoanedName(false);
                    }}
                    className="p-0.5 hover:text-rose-300 transition-colors"
                  >
                    <Pencil size={10} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Co-reader avatars */}
        {book.coReaders?.length > 0 && (
          <div className="absolute bottom-1.5 left-1.5 flex -space-x-1.5">
            {book.coReaders.slice(0, 2).map(r => (
              r.photoURL
                ? <img key={r.uid} src={r.photoURL} alt={r.displayName} referrerPolicy="no-referrer" className="w-5 h-5 rounded-full border-2 border-white object-cover shadow-sm" />
                : <div key={r.uid} className="w-5 h-5 rounded-full border-2 border-white bg-blue-400 flex items-center justify-center shadow-sm">
                    <span className="text-[7px] text-white font-bold">{(r.displayName || '?')[0].toUpperCase()}</span>
                  </div>
            ))}
          </div>
        )}

        {/* Guardado: tocar de nuevo lo quita de la biblioteca */}
        <button
          onClick={e => { e.stopPropagation(); onRemove(book.bookId) }}
          className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-90 transition-all"
          title={t('book_remove_library')}
        >
          <Bookmark size={12} className="fill-amber-400 text-amber-400" />
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
            <span>{t(STATUS_KEYS.includes(book.status) ? `status_${book.status}` : 'status_library')}</span>
            <ChevronDown size={9} />
          </button>

          {showMenu && (
            <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl shadow-lg border border-slate-100 z-20 w-32 overflow-hidden">
              {STATUS_KEYS.map(key => (
                <button key={key} onClick={() => handleStatusChange(key)}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 ${book.status === key ? 'font-semibold text-amber-600' : 'text-slate-700'}`}>
                  {t(`status_${key}`)}
                </button>
              ))}
              <div className="border-t border-slate-100" />
              <button onClick={() => { setShowMenu(false); onRemove(book.bookId) }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 flex items-center gap-1.5">
                <Trash2 size={10} /> {t('common_delete')}
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

        {/* Compartir · Me gusta (izq.) · Lectores actuales (der.) */}
        <div className="flex items-center gap-1 pt-1 border-t border-slate-50 mt-0.5">
          <button
            onClick={e => { e.stopPropagation(); shareBook(book, t) }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600"
            title={t('common_share')}
          >
            <Share2 size={10} />
          </button>

          <button
            onClick={e => { e.stopPropagation(); setShowLikes(true) }}
            className="flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] text-slate-400 hover:text-rose-500"
            title={t('book_who_liked')}
          >
            <Heart size={9} className={likedBy.length > 0 ? 'fill-rose-400 text-rose-400' : ''} />
            {likedBy.length > 0 && <span className="font-semibold">{likedBy.length}</span>}
          </button>

          <button
            onClick={e => { e.stopPropagation(); setShowReaders(true) }}
            className="ml-auto flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[9px] text-slate-400 hover:text-green-600"
            title={t('book_who_reading')}
          >
            {readingBy.length > 0 && <span className="font-semibold">{readingBy.length}</span>}
            <Users size={9} className={readingBy.length > 0 ? 'text-green-500' : ''} />
          </button>
        </div>
      </div>

      {showMenu && <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />}

      {showLikes && (
        <PeopleListSheet
          title={t('book_likes_title')}
          uids={likedBy}
          emptyText={t('book_likes_empty')}
          onClose={() => setShowLikes(false)}
        />
      )}

      {showReaders && (
        <PeopleListSheet
          title={t('book_readers_title')}
          uids={readingBy}
          emptyText={t('book_readers_empty')}
          onClose={() => setShowReaders(false)}
          onStartPlan={onStartPlan ? () => { setShowReaders(false); onStartPlan(book) } : undefined}
        />
      )}
    </div>
  )
}
