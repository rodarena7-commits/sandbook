import { useState, useEffect, useRef } from 'react'
import {
  Search, X, UserPlus, UserMinus, BookOpen,
  Users, Loader2, ChevronRight, RefreshCw, Send, Plus, MessageCircle,
} from 'lucide-react'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useUsers } from '../hooks/useUsers'
import { useFeed } from '../hooks/useFeed'
import { usePosts } from '../hooks/usePosts'
import { useBooks } from '../hooks/useBooks'
import { useConversations } from '../hooks/useConversations'
import { usePublicReviews } from '../hooks/usePublicReviews'
import { sendLoanRequest } from '../hooks/useLoanRequests'
import PostCard from '../components/social/PostCard'
import CreatePostSheet from '../components/social/CreatePostSheet'
import ChatWindow from '../components/chat/ChatWindow'

const TABS = [
  { key: 'feed',      label: 'Feed' },
  { key: 'discover',  label: 'Descubrir' },
  { key: 'following', label: 'Siguiendo' },
]

const STATUS_LABELS = {
  reading: 'Leyendo',
  read:    'Leído',
  pending: 'Pendiente',
  library: 'Biblioteca',
}

// ── Avatar ─────────────────────────────────────────────────
function Avatar({ photoURL, displayName, size = 'md' }) {
  const initials = (displayName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' }[size] || 'w-10 h-10 text-sm'
  if (photoURL) {
    return <img src={photoURL} alt="" className={`${sz} rounded-full object-cover border-2 border-amber-200 flex-shrink-0`} />
  }
  return (
    <div className={`${sz} rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center font-bold text-amber-600 flex-shrink-0`}>
      {initials}
    </div>
  )
}

// ── Feed Item ──────────────────────────────────────────────
function FeedItem({ item, onUserPress, onBookPress }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* User row */}
      <button
        onClick={() => onUserPress(item.user)}
        className="flex items-center gap-2.5 px-3 pt-3 pb-2 w-full text-left hover:bg-slate-50"
      >
        <Avatar photoURL={item.user.photoURL} displayName={item.user.displayName} size="sm" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-slate-800">{item.user.displayName || 'Lector'}</span>
          <span className="text-xs text-slate-400"> {item.action}</span>
        </div>
        <span className="text-[10px] text-slate-300 flex-shrink-0">{item.time}</span>
      </button>

      {/* Book row */}
      <button
        onClick={() => onBookPress && onBookPress(item.book)}
        className="flex gap-3 items-center px-3 pb-3 w-full text-left"
      >
        {item.book.thumbnail ? (
          <img src={item.book.thumbnail} alt="" className="w-10 h-14 object-cover rounded-xl flex-shrink-0 shadow-sm" />
        ) : (
          <div className="w-10 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookOpen size={14} className="text-slate-300" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 line-clamp-1">{item.book.title}</p>
          {item.book.authors?.[0] && (
            <p className="text-xs text-slate-400 line-clamp-1">{item.book.authors[0]}</p>
          )}
          {item.book.review && (
            <p className="text-xs text-slate-500 italic mt-1 line-clamp-2">"{item.book.review}"</p>
          )}
        </div>
      </button>
    </div>
  )
}

// ── Loan Request Modal ─────────────────────────────────────
function LoanModal({ book, onSend, onClose }) {
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-slate-800 mb-1">Pedir prestado</h3>
        <div className="flex gap-2 items-center mb-4 mt-2 bg-slate-50 rounded-2xl p-2.5">
          {book.customThumbnail || book.thumbnail
            ? <img src={book.customThumbnail || book.thumbnail} alt="" className="w-8 h-11 object-cover rounded-lg flex-shrink-0" />
            : <div className="w-8 h-11 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0"><BookOpen size={12} className="text-slate-300" /></div>
          }
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700 line-clamp-1">{book.title}</p>
            {book.authors?.[0] && <p className="text-[10px] text-slate-400">{book.authors[0]}</p>}
          </div>
        </div>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3} maxLength={200}
          placeholder="Mensaje opcional: cuánto tiempo lo necesitás, etc."
          className="w-full px-3 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400 resize-none mb-3" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-medium">Cancelar</button>
          <button disabled={sending} onClick={async () => { setSending(true); await onSend(msg); onClose() }}
            className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-sm font-semibold disabled:opacity-40">
            {sending ? 'Enviando…' : 'Solicitar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── User Sheet ─────────────────────────────────────────────
function UserSheet({ user, isFollowing, onFollow, onUnfollow, onClose, getUserBooks, onMessage }) {
  const { user: me, profile } = useAuth()
  const { reviews: publicReviews, loading: reviewsLoading } = usePublicReviews(user.uid)

  const [books, setBooks]       = useState(null)
  const [acting, setActing]     = useState(false)
  const [tab, setTab]           = useState('library')
  const [bookTab, setBookTab]   = useState('fav')
  const [recMsg, setRecMsg]     = useState('')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [loanBook, setLoanBook] = useState(null)

  useEffect(() => { getUserBooks(user.uid).then(setBooks) }, [user.uid])

  const showLibrary  = user.showLibrary !== false
  const reading      = books?.filter(b => b.status === 'reading') || []
  const favorites    = books?.filter(b => b.isFavorite)            || []
  const liked        = books?.filter(b => b.myReaction === 'like') || []
  const disliked     = books?.filter(b => b.myReaction === 'dislike') || []

  async function handleFollow() {
    setActing(true)
    if (isFollowing) await onUnfollow(user.uid)
    else await onFollow(user.uid)
    setActing(false)
  }

  async function sendRec() {
    if (!recMsg.trim()) return
    setSending(true)
    const snap = await getDoc(doc(db, 'users', user.uid))
    if (!snap.exists() || snap.data().notificationsEnabled !== false) {
      await setDoc(doc(db, 'users', user.uid, 'notifications', `rec_${me.uid}_${Date.now()}`), {
        type: 'recommendation', fromUid: me.uid,
        fromName: profile?.displayName || 'Alguien', fromPhoto: profile?.photoURL || null,
        message: recMsg.trim(), createdAt: serverTimestamp(), read: false,
      })
    }
    setRecMsg(''); setSending(false); setSent(true)
    setTimeout(() => setSent(false), 2500)
  }

  async function handleLoanRequest(book, msg) {
    await sendLoanRequest(me.uid, profile, user.uid, book, msg)
  }

  const BOOK_TABS = [
    { key: 'fav',     label: '⭐', list: favorites },
    { key: 'liked',   label: '👍', list: liked },
    { key: 'disliked',label: '👎', list: disliked },
    { key: 'reading', label: '📖', list: reading },
  ]

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="w-full bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 sticky top-0 bg-white border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar photoURL={user.photoURL} displayName={user.displayName} size="lg" />
            <div>
              <p className="font-bold text-slate-800">{user.displayName || 'Lector'}</p>
              {user.bio && <p className="text-xs text-slate-500 italic mt-0.5 line-clamp-1">"{user.bio}"</p>}
              <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                <span><b className="text-slate-600">{(user.following||[]).length}</b> siguiendo</span>
                <span><b className="text-slate-600">{(user.followers||[]).length}</b> seguidores</span>
                {books && <span><b className="text-green-500">{books.filter(b=>b.status==='read').length}</b> leídos</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-500 p-1 mt-1"><X size={18} /></button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 flex-shrink-0 flex-wrap">
          <button onClick={handleFollow} disabled={acting}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 ${isFollowing ? 'bg-slate-100 text-slate-600' : 'bg-amber-500 text-white shadow-sm'} disabled:opacity-50`}>
            {isFollowing ? <><UserMinus size={12}/> Siguiendo</> : <><UserPlus size={12}/> Seguir</>}
          </button>
          <button onClick={() => { onClose(); onMessage && onMessage(user) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 active:scale-95">
            <MessageCircle size={12}/> Mensaje
          </button>
          {/* Recommendation */}
          <div className="flex gap-1.5 flex-1 min-w-0">
            <input value={recMsg} onChange={e => setRecMsg(e.target.value)} maxLength={120}
              placeholder="Recomendar libro…"
              className="flex-1 min-w-0 px-3 py-2 bg-slate-100 rounded-full text-xs text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400" />
            <button onClick={sendRec} disabled={!recMsg.trim()||sending}
              className="px-3 py-2 bg-amber-500 text-white rounded-full text-xs font-semibold disabled:opacity-40 flex-shrink-0">
              {sent ? '✓' : <Send size={11}/>}
            </button>
          </div>
        </div>

        {/* Main tabs */}
        <div className="flex border-b border-slate-100 flex-shrink-0">
          <button onClick={() => setTab('library')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-all ${tab==='library' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400'}`}>
            Biblioteca
          </button>
          <button onClick={() => setTab('reviews')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-all ${tab==='reviews' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-400'}`}>
            Reseñas {publicReviews.length > 0 && <span className="text-slate-300">({publicReviews.length})</span>}
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4">

          {/* ── BIBLIOTECA TAB ── */}
          {tab === 'library' && (
            <>
              {!showLibrary ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                  <p className="text-3xl mb-2">🔒</p>
                  <p className="font-semibold text-slate-500 text-sm">Biblioteca privada</p>
                  <p className="text-xs mt-1">Este usuario eligió no mostrar sus libros</p>
                </div>
              ) : books === null ? (
                <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-amber-400"/></div>
              ) : (
                <>
                  {/* Book sub-tabs */}
                  <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none">
                    {BOOK_TABS.map(t => (
                      <button key={t.key} onClick={() => setBookTab(t.key)}
                        className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${bookTab===t.key ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {t.label} <span className={bookTab===t.key ? 'text-white/70' : 'text-slate-400'}>({t.list.length})</span>
                      </button>
                    ))}
                  </div>

                  {/* Book list */}
                  {BOOK_TABS.find(t=>t.key===bookTab)?.list.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">Sin libros en esta sección</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {BOOK_TABS.find(t=>t.key===bookTab)?.list.map(b => (
                        <div key={b.id} className="flex gap-2.5 items-center bg-slate-50 rounded-2xl p-2.5">
                          {b.customThumbnail || b.thumbnail
                            ? <img src={b.customThumbnail||b.thumbnail} alt="" className="w-9 h-12 object-cover rounded-lg flex-shrink-0 shadow-sm"/>
                            : <div className="w-9 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0"><BookOpen size={12} className="text-slate-300"/></div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 line-clamp-1">{b.title}</p>
                            {b.authors?.[0] && <p className="text-[10px] text-slate-400">{b.authors[0]}</p>}
                            {b.rating > 0 && (
                              <p className="text-[10px] text-amber-500 mt-0.5">
                                {'★'.repeat(b.rating)}{'☆'.repeat(5-b.rating)}
                              </p>
                            )}
                          </div>
                          <button onClick={() => setLoanBook(b)}
                            className="flex-shrink-0 px-2.5 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-semibold text-slate-600 hover:border-amber-400 hover:text-amber-600 transition-all active:scale-95">
                            Pedir prestado
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── RESEÑAS TAB ── (always public) */}
          {tab === 'reviews' && (
            <>
              {reviewsLoading && <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-amber-400"/></div>}
              {!reviewsLoading && publicReviews.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-10">No ha publicado reseñas todavía</p>
              )}
              <div className="flex flex-col gap-3">
                {publicReviews.map(r => (
                  <div key={r.id} className="bg-slate-50 rounded-2xl p-3">
                    <div className="flex gap-2.5 items-center mb-2">
                      {r.bookThumbnail
                        ? <img src={r.bookThumbnail} alt="" className="w-8 h-11 object-cover rounded-lg flex-shrink-0 shadow-sm"/>
                        : <div className="w-8 h-11 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0"><BookOpen size={11} className="text-slate-300"/></div>
                      }
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">{r.bookTitle}</p>
                        {r.bookAuthors?.[0] && <p className="text-[10px] text-slate-400">{r.bookAuthors[0]}</p>}
                        {r.rating > 0 && (
                          <p className="text-[11px] text-amber-500 mt-0.5">
                            {'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)} <span className="text-slate-400 text-[10px]">
                              {['','No le gustó','Estuvo bien','Bueno','Muy bueno','Excelente'][r.rating]}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    {r.comment && <p className="text-xs text-slate-600 leading-relaxed italic">"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>

    {/* Loan modal */}
    {loanBook && (
      <>
        <div className="fixed inset-0 bg-black/50 z-[65]" onClick={() => setLoanBook(null)}/>
        <LoanModal book={loanBook} onSend={msg => handleLoanRequest(loanBook, msg)} onClose={() => setLoanBook(null)}/>
      </>
    )}
    </>
  )
}

function MiniBookRow({ book }) {
  return (
    <div className="flex gap-2 items-center py-2 border-b border-slate-50 last:border-0">
      {book.thumbnail ? (
        <img src={book.thumbnail} alt="" className="w-8 h-11 object-cover rounded-lg flex-shrink-0 shadow-sm" />
      ) : (
        <div className="w-8 h-11 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen size={12} className="text-slate-300" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-700 line-clamp-1">{book.title}</p>
        {book.authors?.[0] && <p className="text-[10px] text-slate-400">{book.authors[0]}</p>}
        {book.rating > 0 && <p className="text-[10px] text-amber-500 mt-0.5">{'★'.repeat(book.rating)}{'☆'.repeat(5-book.rating)}</p>}
      </div>
    </div>
  )
}

// ── User Card ──────────────────────────────────────────────
function UserCard({ user, isFollowing, onSelect }) {
  return (
    <button
      onClick={() => onSelect(user)}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 active:bg-slate-50 text-left"
    >
      <Avatar photoURL={user.photoURL} displayName={user.displayName} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{user.displayName || 'Lector'}</p>
        <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
          <span>{(user.followers || []).length} seguidores</span>
          {isFollowing && <span className="text-amber-500 font-medium">· Siguiendo</span>}
        </div>
        {user.bio && <p className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">"{user.bio}"</p>}
      </div>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
    </button>
  )
}

// ── Following Card ─────────────────────────────────────────
function FollowingCard({ user, onSelect }) {
  return (
    <button
      onClick={() => onSelect(user)}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 active:bg-slate-50 text-left"
    >
      <Avatar photoURL={user.photoURL} displayName={user.displayName} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{user.displayName || 'Lector'}</p>
        {user.currentBook ? (
          <div className="flex items-center gap-1 mt-0.5">
            <BookOpen size={9} className="text-amber-400 flex-shrink-0" />
            <p className="text-[10px] text-slate-400 line-clamp-1">{user.currentBook.title}</p>
          </div>
        ) : (
          <p className="text-[10px] text-slate-300 mt-0.5">Sin lectura activa</p>
        )}
      </div>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
    </button>
  )
}

// ── Notifications ──────────────────────────────────────────
function NotificationsBadge({ count }) {
  if (!count) return null
  return (
    <span className="ml-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
      {count > 9 ? '9+' : count}
    </span>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function SocialPage() {
  const { user, profile, setProfile } = useAuth()
  const {
    searchResults, searchLoading, searchUsers,
    followingUsers, followingLoading, loadFollowing,
    getUserBooks, followUser, unfollowUser,
  } = useUsers(user?.uid, profile, setProfile)

  const followingUids = profile?.following || []
  const { items: feedItems, loading: feedLoading, loaded: feedLoaded, load: loadFeed } = useFeed(user?.uid, followingUids)
  const { posts, loading: postsLoading, createPost, toggleLike, deletePost } = usePosts()
  const { books } = useBooks(user?.uid)
  const { canMessage, sendMessage } = useConversations(user?.uid)

  const [activeTab, setActiveTab]       = useState('feed')
  const [query, setQuery]               = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [chatTarget, setChatTarget] = useState(null)
  const inputRef = useRef(null)

  const followingSet = new Set(followingUids)

  // Load data when switching tabs
  useEffect(() => {
    if (activeTab === 'feed' && !feedLoaded) loadFeed()
    if (activeTab === 'following') loadFollowing()
  }, [activeTab])

  // Reload feed when following list changes
  useEffect(() => {
    if (activeTab === 'feed') loadFeed()
  }, [followingUids.length])

  function handleSearch(e) {
    e.preventDefault()
    searchUsers(query)
    inputRef.current?.blur()
  }

  function handleClear() {
    setQuery('')
    searchUsers('')
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-slate-800">Red Social</h1>
          {activeTab === 'feed' && (
            <button onClick={() => setShowCreatePost(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-all">
              <Plus size={13} /> Publicar
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === tab.key ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
              }`}>
              {tab.label}
              {tab.key === 'following' && followingSet.size > 0 && (
                <span className={`ml-1 text-[10px] ${activeTab === tab.key ? 'text-white/70' : 'text-amber-400'}`}>
                  ({followingSet.size})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search bar only on Discover */}
        {activeTab === 'discover' && (
          <form onSubmit={handleSearch} className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Buscar lectores…"
                className="w-full pl-9 pr-8 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400" />
              {query && (
                <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <X size={13} />
                </button>
              )}
            </div>
            <button type="submit" disabled={!query.trim() || searchLoading}
              className="px-4 py-2.5 bg-amber-500 text-white rounded-2xl text-xs font-semibold disabled:opacity-40 active:scale-95 shadow-sm">
              Buscar
            </button>
          </form>
        )}
      </div>

      {/* ── FEED TAB ── */}
      {activeTab === 'feed' && (
        <div className="px-4 py-4 flex flex-col gap-3">
          {/* Posts section */}
          {postsLoading && (
            <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-400" /></div>
          )}

          {!postsLoading && posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <p className="text-5xl mb-4">✍️</p>
              <p className="font-semibold text-slate-500">Todavía no hay publicaciones</p>
              <p className="text-xs mt-1">¡Sé el primero en compartir una frase!</p>
              <button onClick={() => setShowCreatePost(true)}
                className="mt-4 px-5 py-2.5 bg-amber-500 text-white rounded-2xl text-sm font-semibold shadow-sm">
                Publicar ahora
              </button>
            </div>
          )}

          {!postsLoading && posts.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium">Publicaciones recientes</p>
              </div>
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  myUid={user?.uid}
                  onLike={(postId, liked) => toggleLike(postId, user.uid, liked)}
                  onDelete={deletePost}
                  onUserPress={setSelectedUser}
                />
              ))}
            </>
          )}

          {/* Activity from following */}
          {feedLoaded && feedItems.length > 0 && (
            <>
              <p className="text-xs text-slate-400 font-medium mt-2">Actividad de lectores que seguís</p>
              {feedItems.slice(0, 10).map(item => (
                <FeedItem key={item.key} item={item} onUserPress={setSelectedUser} />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── DISCOVER TAB ── */}
      {activeTab === 'discover' && (
        <div className="px-4 py-4 flex flex-col gap-2">
          {searchLoading && (
            <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-400" /></div>
          )}

          {!searchLoading && searchResults.length === 0 && !query && (
            <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
              <Users size={44} className="mb-4 text-slate-200" />
              <p className="font-semibold text-slate-500">Encontrá otros lectores</p>
              <p className="text-xs mt-1">Buscá por nombre de usuario</p>
            </div>
          )}

          {!searchLoading && searchResults.length === 0 && query && (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-3xl mb-3">👤</p>
              <p className="text-sm font-semibold text-slate-500">Sin resultados</p>
            </div>
          )}

          {!searchLoading && searchResults.map(u => (
            <UserCard key={u.uid} user={u} isFollowing={followingSet.has(u.uid)} onSelect={setSelectedUser} />
          ))}
        </div>
      )}

      {/* ── FOLLOWING TAB ── */}
      {activeTab === 'following' && (
        <div className="px-4 py-4 flex flex-col gap-2">
          {followingLoading && (
            <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-400" /></div>
          )}

          {!followingLoading && followingUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
              <Users size={44} className="mb-4 text-slate-200" />
              <p className="font-semibold text-slate-500">Todavía no seguís a nadie</p>
              <p className="text-xs mt-1">Buscá lectores en Descubrir</p>
            </div>
          )}

          {!followingLoading && followingUsers.map(u => (
            <FollowingCard key={u.uid} user={u} onSelect={setSelectedUser} />
          ))}
        </div>
      )}

      {/* Chat Window */}
      {chatTarget && (
        <ChatWindow
          myUid={user?.uid}
          myProfile={profile}
          otherUser={chatTarget}
          canSend={true}
          onSend={async text => {
            const allowed = await canMessage(user.uid, chatTarget.uid, profile)
            if (!allowed) return
            await sendMessage(user.uid, profile, chatTarget.uid, chatTarget, text)
          }}
          onBack={() => setChatTarget(null)}
        />
      )}

      {/* Create Post Sheet */}
      {showCreatePost && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowCreatePost(false)} />
          <CreatePostSheet
            myBooks={books}
            onPublish={({ text, book }) => createPost(user.uid, profile, { text, book })}
            onClose={() => setShowCreatePost(false)}
          />
        </>
      )}

      {/* User Sheet */}
      {selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedUser(null)} />
          <UserSheet
            user={selectedUser}
            isFollowing={followingSet.has(selectedUser.uid)}
            onFollow={async uid => { await followUser(uid); loadFeed() }}
            onUnfollow={async uid => { await unfollowUser(uid); setSelectedUser(null); loadFeed() }}
            onClose={() => setSelectedUser(null)}
            getUserBooks={getUserBooks}
            onMessage={target => setChatTarget(target)}
          />
        </>
      )}
    </div>
  )
}
