import { useState, useRef, useEffect } from 'react'
import { BookOpen, Heart, Trash2, MoreHorizontal, Pencil, Share2, Send, Repeat2, User, X } from 'lucide-react'

function timeAgo(ts) {
  if (!ts?.seconds) return ''
  const diff = Date.now() - ts.seconds * 1000
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'ahora'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)  return `hace ${d}d`
  return new Date(ts.seconds * 1000).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function Avatar({ photoURL, displayName, size = 'md' }) {
  const initials = (displayName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs'
  if (photoURL) {
    return <img src={photoURL} alt="" className={`${sz} rounded-full object-cover border-2 border-amber-200 flex-shrink-0`} />
  }
  return (
    <div className={`${sz} rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center font-bold text-amber-600 flex-shrink-0`}>
      {initials}
    </div>
  )
}

// ── Card interna del post original (usada en repost) ─────────
function OriginalPostCard({ repostOf }) {
  return (
    <div className="mx-4 mb-3 bg-slate-50 rounded-2xl border border-slate-100 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Avatar photoURL={repostOf.photoURL} displayName={repostOf.displayName} size="sm" />
        <p className="text-[11px] font-semibold text-slate-600">{repostOf.displayName || 'Lector'}</p>
      </div>
      {repostOf.text ? (
        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-4">{repostOf.text}</p>
      ) : null}
      {repostOf.bookTitle && (
        <div className="flex gap-2 items-center mt-2">
          {repostOf.bookThumbnail ? (
            <img src={repostOf.bookThumbnail} alt="" className="w-7 h-9 object-cover rounded-lg flex-shrink-0 shadow-sm" />
          ) : (
            <div className="w-7 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen size={10} className="text-slate-300" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-700 line-clamp-1">{repostOf.bookTitle}</p>
            {repostOf.bookAuthors?.[0] && (
              <p className="text-[9px] text-slate-400">{repostOf.bookAuthors[0]}</p>
            )}
          </div>
        </div>
      )}
      {repostOf.authorName && (
        <div className="flex items-center gap-1.5 mt-2">
          {repostOf.authorPhotoUrl ? (
            <img src={repostOf.authorPhotoUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
              <User size={9} className="text-slate-400" />
            </div>
          )}
          <p className="text-[10px] text-slate-500 italic">{repostOf.authorName}</p>
        </div>
      )}
    </div>
  )
}

// ── Menú de más opciones ─────────────────────────────────────
function MoreMenu({ isOwn, onEdit, onShare, onSendToUser, onRepost, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-6 right-0 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-w-[170px]">
        {isOwn && (
          <button onClick={() => { onEdit(); onClose() }}
            className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-50">
            <Pencil size={14} className="text-amber-500" /> Editar
          </button>
        )}
        <button onClick={() => { onShare(); onClose() }}
          className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-50">
          <Share2 size={14} className="text-blue-500" /> Compartir
        </button>
        <button onClick={() => { onSendToUser(); onClose() }}
          className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-50">
          <Send size={14} className="text-green-500" /> Enviar a usuario
        </button>
        {!isOwn && (
          <button onClick={() => { onRepost(); onClose() }}
            className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
            <Repeat2 size={14} className="text-purple-500" /> Republicar
          </button>
        )}
      </div>
    </>
  )
}

function activeStreak(u) {
  const streak = u?.currentStreak || 0
  if (streak < 1) return 0
  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  return (u.lastReadDate === today || u.lastReadDate === yesterday) ? streak : 0
}

// ── PostCard principal ───────────────────────────────────────
export default function PostCard({ post, myUid, authorUser, onLike, onDelete, onUserPress, onEdit, onRepost, onSendToUser }) {
  const liked     = (post.likedBy || []).includes(myUid)
  const isOwn     = post.uid === myUid
  const likeCount = post.likeCount || 0
  const isRepost  = !!post.repostOf

  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    if (showMenu) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showMenu])

  function handleShare() {
    const shareText = post.repostOf
      ? `${post.repostOf.displayName}: "${post.repostOf.text}"`
      : `"${post.text}"`
    const bookInfo = (post.repostOf?.bookTitle || post.bookTitle)
      ? ` — ${post.repostOf?.bookTitle || post.bookTitle}`
      : ''

    if (navigator.share) {
      navigator.share({ title: 'Sandbook', text: shareText + bookInfo }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(shareText + bookInfo)
        .then(() => alert('Copiado al portapapeles'))
        .catch(() => {})
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2">
        <button onClick={() => onUserPress?.({ uid: post.uid, displayName: post.displayName, photoURL: post.photoURL })}>
          <Avatar photoURL={post.photoURL} displayName={post.displayName} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <button onClick={() => onUserPress?.({ uid: post.uid, displayName: post.displayName, photoURL: post.photoURL })}
              className="text-xs font-semibold text-slate-800 hover:text-amber-600 transition-colors">
              {post.displayName || 'Lector'}
            </button>
            {activeStreak(authorUser) > 0 && (
              <span className="flex items-center gap-0.5 bg-orange-50 border border-orange-100 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-orange-500 leading-none">
                🔥{activeStreak(authorUser)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] text-slate-400">{timeAgo(post.createdAt)}</p>
            {post.editedAt && <p className="text-[10px] text-slate-300">· editado</p>}
            {isRepost && (
              <span className="flex items-center gap-0.5 text-[10px] text-purple-400 font-medium">
                <Repeat2 size={9} /> republicó
              </span>
            )}
          </div>
        </div>

        {/* More menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setShowMenu(v => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <MoreHorizontal size={15} />
          </button>
          {showMenu && (
            <MoreMenu
              isOwn={isOwn}
              onEdit={() => onEdit?.(post)}
              onShare={handleShare}
              onSendToUser={() => onSendToUser?.(post)}
              onRepost={() => onRepost?.(post)}
              onClose={() => setShowMenu(false)}
            />
          )}
        </div>

        {isOwn && (
          <button onClick={() => onDelete(post.id)} className="text-slate-300 hover:text-red-400 transition-colors p-1 flex-shrink-0">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Contenido del repost: muestra el post original */}
      {isRepost ? (
        <OriginalPostCard repostOf={post.repostOf} />
      ) : (
        <>
          {/* Texto del post */}
          {post.text ? (
            <div className="px-4 pb-3">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.text}</p>
            </div>
          ) : null}

          {/* Tag de libro */}
          {post.bookTitle && (
            <div className="mx-4 mb-3 flex gap-3 items-center bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              {post.bookThumbnail ? (
                <img src={post.bookThumbnail} alt="" className="w-9 h-12 object-cover rounded-lg flex-shrink-0 shadow-sm" />
              ) : (
                <div className="w-9 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen size={12} className="text-slate-300" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-700 line-clamp-1">{post.bookTitle}</p>
                {post.bookAuthors?.[0] && (
                  <p className="text-[10px] text-slate-400 mt-0.5">{post.bookAuthors[0]}</p>
                )}
              </div>
            </div>
          )}

          {/* Tag de autor */}
          {post.authorName && (
            <div className="mx-4 mb-3 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
              {post.authorPhotoUrl ? (
                <img src={post.authorPhotoUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200 flex-shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <User size={12} className="text-slate-400" />
                </div>
              )}
              <p className="text-[11px] font-semibold text-slate-600 italic">{post.authorName}</p>
            </div>
          )}
        </>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-4 px-4 pb-3.5 border-t border-slate-50 pt-2.5">
        <button
          onClick={() => onLike(post.id, liked)}
          className={`flex items-center gap-1.5 text-xs font-medium transition-all active:scale-90 ${liked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
        >
          <Heart size={15} className={liked ? 'fill-red-500' : ''} />
          {likeCount > 0 && <span>{likeCount}</span>}
          <span>Me gusta</span>
        </button>

        {!isOwn && (
          <button
            onClick={() => onRepost?.(post)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-purple-500 transition-all active:scale-90"
          >
            <Repeat2 size={14} />
            <span>Republicar</span>
          </button>
        )}
      </div>
    </div>
  )
}
