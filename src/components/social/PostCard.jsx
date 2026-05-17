import { BookOpen, Heart, Trash2 } from 'lucide-react'

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

function Avatar({ photoURL, displayName }) {
  const initials = (displayName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (photoURL) {
    return <img src={photoURL} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-amber-200 flex-shrink-0" />
  }
  return (
    <div className="w-9 h-9 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center font-bold text-amber-600 text-xs flex-shrink-0">
      {initials}
    </div>
  )
}

export default function PostCard({ post, myUid, onLike, onDelete, onUserPress }) {
  const liked     = (post.likedBy || []).includes(myUid)
  const isOwn     = post.uid === myUid
  const likeCount = post.likeCount || 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2">
        <button onClick={() => onUserPress?.({ uid: post.uid, displayName: post.displayName, photoURL: post.photoURL })}>
          <Avatar photoURL={post.photoURL} displayName={post.displayName} />
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={() => onUserPress?.({ uid: post.uid, displayName: post.displayName, photoURL: post.photoURL })}
            className="text-xs font-semibold text-slate-800 hover:text-amber-600 transition-colors">
            {post.displayName || 'Lector'}
          </button>
          <p className="text-[10px] text-slate-400">{timeAgo(post.createdAt)}</p>
        </div>
        {isOwn && (
          <button onClick={() => onDelete(post.id)} className="text-slate-300 hover:text-red-400 transition-colors p-1">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Quote text */}
      <div className="px-4 pb-3">
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {post.text}
        </p>
      </div>

      {/* Book anchor */}
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

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 pb-3.5 border-t border-slate-50 pt-2.5">
        <button
          onClick={() => onLike(post.id, liked)}
          className={`flex items-center gap-1.5 text-xs font-medium transition-all active:scale-90 ${liked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
        >
          <Heart size={15} className={liked ? 'fill-red-500' : ''} />
          {likeCount > 0 && <span>{likeCount}</span>}
          <span>{liked ? 'Me gusta' : 'Me gusta'}</span>
        </button>
      </div>
    </div>
  )
}
