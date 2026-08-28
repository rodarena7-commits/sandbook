import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search, X, BookOpen, Users, Loader2,
  ChevronRight, RefreshCw, Plus, MessageCircle,
  Feather, ShieldCheck, User, FileText, Repeat2,
  Trash2, ArrowDown, ArrowUp,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUsers } from '../hooks/useUsers'
import { useFeed } from '../hooks/useFeed'
import { usePosts } from '../hooks/usePosts'
import { useBooks } from '../hooks/useBooks'
import { useConversations } from '../hooks/useConversations'
import { useAllUsers } from '../hooks/useAllUsers'
import { useAuthorSearch } from '../hooks/useAuthorSearch'
import { useFavoriteAuthors } from '../hooks/useFavoriteAuthors'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import PostCard from '../components/social/PostCard'
import CreatePostSheet from '../components/social/CreatePostSheet'
import AuthorCard from '../components/social/AuthorCard'
import UserProfileScreen from '../components/social/UserProfileScreen'
import ChatWindow from '../components/chat/ChatWindow'
import ImagePickerSheet from '../components/ui/ImagePickerSheet'
import MarketplacePage from './MarketplacePage'

const ADMIN_EMAIL = 'rodrigo.n.arena@hotmail.com'

const TABS = [
  { key: 'feed',        label: 'Feed' },
  { key: 'discover',    label: 'Descubrir' },
  { key: 'following',   label: 'Siguiendo' },
  { key: 'marketplace', label: '🛒 Marketplace' },
]

// ── Avatar con punto online ─────────────────────────────────
function Avatar({ photoURL, displayName, size = 'md', online = false }) {
  const [imgError, setImgError] = useState(false)
  const init = (displayName||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const sz = { sm:'w-8 h-8 text-xs', md:'w-10 h-10 text-sm', lg:'w-14 h-14 text-lg' }[size] || 'w-10 h-10 text-sm'
  const dotSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'
  return (
    <div className="relative flex-shrink-0">
      {photoURL && !imgError
        ? <img src={photoURL} alt="" referrerPolicy="no-referrer" onError={() => setImgError(true)} className={`${sz} rounded-full object-cover border-2 border-amber-200`} />
        : <div className={`${sz} rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center font-bold text-amber-600`}>{init}</div>
      }
      {online && (
        <span className={`absolute bottom-0 right-0 ${dotSize} bg-green-400 border-2 border-white rounded-full`}
              style={{boxShadow:'0 0 6px #4ade80'}} />
      )}
    </div>
  )
}

// ── Feed Item ──────────────────────────────────────────────
function FeedItem({ item, onUserPress }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <button onClick={() => onUserPress(item.user)}
        className="flex items-center gap-2.5 px-3 pt-3 pb-2 w-full text-left hover:bg-slate-50">
        <Avatar photoURL={item.user.photoURL} displayName={item.user.displayName} size="sm" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-slate-800">{item.user.displayName||'Lector'}</span>
          <span className="text-xs text-slate-400"> {item.action}</span>
        </div>
        <span className="text-[10px] text-slate-300 flex-shrink-0">{item.time}</span>
      </button>
      <div className="flex gap-3 items-center px-3 pb-3">
        {item.book.thumbnail
          ? <img src={item.book.thumbnail} alt="" className="w-10 h-14 object-cover rounded-xl flex-shrink-0 shadow-sm"/>
          : <div className="w-10 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0"><BookOpen size={14} className="text-slate-300"/></div>
        }
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 line-clamp-1">{item.book.title}</p>
          {item.book.authors?.[0] && <p className="text-xs text-slate-400 line-clamp-1">{item.book.authors[0]}</p>}
          {item.book.review && <p className="text-xs text-slate-500 italic mt-1 line-clamp-2">"{item.book.review}"</p>}
        </div>
      </div>
    </div>
  )
}

// ── User Card ──────────────────────────────────────────────
function UserCard({ user, isFollowing, onSelect }) {
  const { t } = useAuth()
  return (
    <button onClick={() => onSelect(user)}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 active:bg-slate-50 text-left">
      <Avatar photoURL={user.photoURL} displayName={user.displayName} online={user.online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-slate-800 line-clamp-1">{user.displayName||t('soc_reader_default')}</p>
          {user.online && <span className="text-[9px] text-green-500 font-semibold">● {t('soc_online')}</span>}
        </div>
        <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
          <span>{(user.followers||[]).length} {t('soc_followers')}</span>
          {isFollowing && <span className="text-amber-500 font-medium">· {t('soc_following')}</span>}
        </div>
        {user.bio && <p className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">"{user.bio}"</p>}
      </div>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
    </button>
  )
}

// ── Admin User Row ─────────────────────────────────────────
function getLastSeenMs(u) {
  if (u.online) return Date.now()
  if (u.lastSeen?.toMillis) return u.lastSeen.toMillis()
  if (u.lastSeen?.seconds) return u.lastSeen.seconds * 1000
  return 0
}

function formatActiveTime(totalMinutes) {
  if (!totalMinutes) return 'Sin datos'
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function AdminUserRow({ user, onSelect }) {
  const { t } = useAuth()
  const createdAt = user.createdAt?.toDate
    ? user.createdAt.toDate().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'2-digit' })
    : '—'
  const lastSeenMs = getLastSeenMs(user)
  const lastSeenLabel = user.online
    ? 'En línea ahora'
    : lastSeenMs
      ? new Date(lastSeenMs).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })
      : 'Sin registro'
  return (
    <button onClick={() => onSelect(user)}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 active:bg-slate-50 text-left">
      <Avatar photoURL={user.photoURL} displayName={user.displayName} size="sm" online={user.online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold text-slate-800 line-clamp-1">{user.displayName||t('soc_no_name')}</p>
          {user.online && <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" style={{boxShadow:'0 0 5px #4ade80'}}/>}
        </div>
        <p className="text-[10px] text-slate-400 line-clamp-1">{user.bio || ''}</p>
        <p className={`text-[9px] mt-0.5 font-medium ${user.online ? 'text-green-500' : 'text-slate-400'}`}>
          Última conexión: {lastSeenLabel}
        </p>
        <p className="text-[9px] mt-0.5 text-indigo-400 font-medium">
          Tiempo activo: {formatActiveTime(user.totalActiveMinutes)}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[9px] text-slate-300">Alta {createdAt}</p>
        <p className="text-[9px] text-slate-400">{(user.followers||[]).length} {t('soc_followers_abbrev')}</p>
      </div>
    </button>
  )
}

// ── Following Card ─────────────────────────────────────────
function FollowingCard({ user, onSelect }) {
  const { t } = useAuth()
  return (
    <button onClick={() => onSelect(user)}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 active:bg-slate-50 text-left">
      <Avatar photoURL={user.photoURL} displayName={user.displayName} online={user.online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-slate-800 line-clamp-1">{user.displayName||t('soc_reader_default')}</p>
          {user.online && <span className="text-[9px] text-green-500 font-semibold">● {t('soc_online')}</span>}
        </div>
        {user.currentBook
          ? <div className="flex items-center gap-1 mt-0.5"><BookOpen size={9} className="text-amber-400 flex-shrink-0"/><p className="text-[10px] text-slate-400 line-clamp-1">{user.currentBook.title}</p></div>
          : <p className="text-[10px] text-slate-300 mt-0.5">{t('soc_no_active_reading')}</p>
        }
      </div>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
    </button>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function SocialPage() {
  const { user, profile, setProfile, appConfig, t } = useAuth()
  const isAdmin = user?.email === ADMIN_EMAIL

  const { searchResults, searchLoading, searchUsers,
          followingUsers, followingLoading, loadFollowing,
          getUserBooks, followUser, unfollowUser } = useUsers(user?.uid, profile, setProfile)

  const followingUids = profile?.following || []
  const { items: feedItems, loading: feedLoading, loaded: feedLoaded, load: loadFeed } = useFeed(user?.uid, followingUids)
  const { posts, loading: postsLoading, createPost, updatePost, repostPost, toggleLike, deletePost } = usePosts()
  const { books } = useBooks(user?.uid)
  const { canMessage, sendMessage } = useConversations(user?.uid)
  const { users: allUsers, loading: allUsersLoading } = useAllUsers(user?.uid)

  const { authors, loading: authorsLoading, query: authorQuery, setQuery: setAuthorQuery, search: searchAuthor, clear: clearAuthor } = useAuthorSearch()
  const { authors: favAuthors, addFavoriteAuthor, removeFavoriteAuthor, isFavorite: isAuthorFav } = useFavoriteAuthors(user?.uid)

  const tabs = isAdmin
    ? [...TABS, { key: 'admin', label: '🛡 Admin' }]
    : TABS

  const [activeTab, setActiveTab]           = useState('feed')
  const [discoverTab, setDiscoverTab]       = useState('readers')
  const [readerQuery, setReaderQuery]       = useState('')
  const [adminQuery, setAdminQuery]         = useState('')
  const [adminSubTab, setAdminSubTab]       = useState('users')
  const [adminUsersSort, setAdminUsersSort] = useState('recent') // 'recent' = más reciente primero, 'oldest' = más antiguo primero
  const [adminPostsSort, setAdminPostsSort] = useState('newest')
  const [selectedUser, setSelectedUser]     = useState(null)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showLogoPicker, setShowLogoPicker] = useState(false)
  const [editingPost, setEditingPost]       = useState(null)
  const [chatTarget, setChatTarget]         = useState(null)
  const [sendPostTarget, setSendPostTarget] = useState(null) // { post, users }
  const [authorPostsFilter, setAuthorPostsFilter] = useState(null) // nombre del autor

  const followingSet = new Set(followingUids)

  const userStreakMap = useMemo(() =>
    Object.fromEntries(allUsers.map(u => [u.uid, u]))
  , [allUsers])

  const readerInputRef = useRef(null)
  const authorInputRef = useRef(null)

  // Lectores: solo muestra resultados si hay query (como autores)
  const displayedReaders = useMemo(() => {
    if (!readerQuery.trim()) return []
    const q = readerQuery.toLowerCase()
    return allUsers.filter(u =>
      (u.displayName||'').toLowerCase().includes(q) ||
      (u.email||'').toLowerCase().includes(q)
    )
  }, [allUsers, readerQuery])

  // Admin: todos los usuarios filtrados, ordenados por última conexión
  const displayedAdmin = useMemo(() => {
    const filtered = !adminQuery.trim()
      ? allUsers
      : allUsers.filter(u => {
          const q = adminQuery.toLowerCase()
          return (u.displayName||'').toLowerCase().includes(q) ||
                 (u.email||'').toLowerCase().includes(q)
        })
    return [...filtered].sort((a, b) => {
      const diff = getLastSeenMs(a) - getLastSeenMs(b)
      return adminUsersSort === 'recent' ? -diff : diff
    })
  }, [allUsers, adminQuery, adminUsersSort])

  const onlineCount = useMemo(() => allUsers.filter(u => u.online).length, [allUsers])

  const sortedAdminPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds || 0) * 1000
      const timeB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds || 0) * 1000
      if (adminPostsSort === 'oldest') {
        return timeA - timeB // oldest first (mayor cantidad de días publicada)
      } else {
        return timeB - timeA // newest first (menor cantidad de días publicada)
      }
    })
  }, [posts, adminPostsSort])

  useEffect(() => {
    if (activeTab === 'feed' && !feedLoaded) loadFeed()
    if (activeTab === 'following') loadFollowing()
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'feed') loadFeed()
  }, [followingUids.length])

  function handleAuthorSearch(e) {
    e.preventDefault()
    searchAuthor(authorQuery)
    authorInputRef.current?.blur()
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-slate-800">{t('soc_social_network')}</h1>
          {activeTab === 'feed' && (
            <button onClick={() => setShowCreatePost(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-full text-xs font-semibold shadow-sm active:scale-95">
              <Plus size={13}/> {t('soc_publish')}
            </button>
          )}
        </div>

        {/* Main tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab===tab.key?'bg-amber-500 text-white shadow-sm':'bg-slate-100 text-slate-500'}`}>
              {t('soc_' + tab.key) || tab.label}
              {tab.key==='following' && followingSet.size>0 && (
                <span className={`ml-1 text-[10px] ${activeTab===tab.key?'text-white/70':'text-amber-400'}`}>({followingSet.size})</span>
              )}
            </button>
          ))}
        </div>

        {/* Discover sub-tabs */}
        {activeTab === 'discover' && (
          <div className="flex gap-1.5 mt-2">
            <button onClick={() => setDiscoverTab('readers')}
              className={`flex items-center gap-1.5 flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${discoverTab==='readers'?'bg-slate-800 text-white':'bg-slate-100 text-slate-500'}`}>
              <Users size={11}/> {t('soc_readers')}
            </button>
            <button onClick={() => setDiscoverTab('authors')}
              className={`flex items-center gap-1.5 flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${discoverTab==='authors'?'bg-slate-800 text-white':'bg-slate-100 text-slate-500'}`}>
              <Feather size={11}/> {t('soc_writers')}
            </button>
          </div>
        )}

        {/* Search bars */}
        {activeTab==='discover' && discoverTab==='readers' && (
          <form onSubmit={e=>{e.preventDefault(); readerInputRef.current?.blur()}} className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              <input ref={readerInputRef} value={readerQuery} onChange={e=>setReaderQuery(e.target.value)}
                placeholder={t('soc_search_reader_placeholder')}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"/>
              {readerQuery && (
                <button type="button" onClick={()=>setReaderQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={13}/></button>
              )}
            </div>
          </form>
        )}

        {activeTab==='discover' && discoverTab==='authors' && (
          <form onSubmit={handleAuthorSearch} className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              <input ref={authorInputRef} value={authorQuery} onChange={e=>setAuthorQuery(e.target.value)}
                placeholder={t('soc_search_writer_placeholder')}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"/>
              {authorQuery && (
                <button type="button" onClick={clearAuthor} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={13}/></button>
              )}
            </div>
            <button type="submit" disabled={!authorQuery.trim()||authorsLoading}
              className="px-4 py-2.5 bg-slate-800 text-white rounded-2xl text-xs font-semibold disabled:opacity-40 active:scale-95">
              {t('nav_search')}
            </button>
          </form>
        )}

        {/* Admin search bar */}
        {activeTab==='admin' && (
          <div className="relative mt-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input value={adminQuery} onChange={e=>setAdminQuery(e.target.value)}
              placeholder={t('soc_filter_placeholder')}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"/>
            {adminQuery && (
              <button onClick={()=>setAdminQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={13}/></button>
            )}
          </div>
        )}
      </div>

      {/* ── FEED TAB ── */}
      {activeTab==='feed' && (
        <div className="px-4 py-4 flex flex-col gap-3">
          {postsLoading && <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-400"/></div>}

          {!postsLoading && posts.length===0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <p className="text-5xl mb-4">✍️</p>
              <p className="font-semibold text-slate-500">{t('soc_no_posts')}</p>
              <p className="text-xs mt-1">{t('soc_first_post')}</p>
              <button onClick={()=>setShowCreatePost(true)}
                className="mt-4 px-5 py-2.5 bg-amber-500 text-white rounded-2xl text-sm font-semibold shadow-sm">
                {t('soc_publish_now')}
              </button>
            </div>
          )}

          {!postsLoading && posts.length>0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium">{t('soc_recent_posts')}</p>
              </div>
              {posts.map(post => (
                <PostCard key={post.id} post={post} myUid={user?.uid}
                  authorUser={userStreakMap[post.uid]}
                  onLike={(postId,liked)=>toggleLike(postId,user.uid,liked)}
                  onDelete={deletePost}
                  onUserPress={setSelectedUser}
                  onEdit={p => { setEditingPost(p); setShowCreatePost(true) }}
                  onRepost={p => repostPost(user.uid, profile, p)}
                  onSendToUser={p => setSendPostTarget({ post: p, users: followingUsers })}
                />
              ))}
            </>
          )}

          {feedLoaded && feedItems.length>0 && (
            <>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-400 font-medium">{t('soc_following_activity')}</p>
                <button onClick={loadFeed} className="text-slate-300 hover:text-amber-500 transition-colors"><RefreshCw size={13}/></button>
              </div>
              {feedItems.slice(0,10).map(item => (
                <FeedItem key={item.key} item={item} onUserPress={setSelectedUser}/>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── DISCOVER TAB ── */}
      {activeTab==='discover' && (
        <div className="px-4 py-4 flex flex-col gap-2">

          {/* Readers */}
          {discoverTab==='readers' && (
            <>
              {!readerQuery.trim() ? (
                <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
                  <Users size={44} className="mb-4 text-slate-200"/>
                  <p className="font-semibold text-slate-500">{t('soc_find_reader')}</p>
                  <p className="text-xs mt-1">{t('soc_find_reader_desc')}</p>
                </div>
              ) : allUsersLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-400"/></div>
              ) : displayedReaders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <p className="text-3xl mb-3">🔍</p>
                  <p className="text-sm font-semibold text-slate-500">{t('soc_no_results_for')} "{readerQuery}"</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400 font-medium px-1">{displayedReaders.length} {t('soc_results')}</p>
                  {displayedReaders.map(u => (
                    <UserCard key={u.uid} user={u} isFollowing={followingSet.has(u.uid)} onSelect={setSelectedUser}/>
                  ))}
                </>
              )}
            </>
          )}

          {/* Authors */}
          {discoverTab==='authors' && (
            <>
              {authorsLoading && <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-400"/></div>}

              {!authorsLoading && authors.length===0 && !authorQuery && (
                <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
                  <Feather size={44} className="mb-4 text-slate-200"/>
                  <p className="font-semibold text-slate-500">{t('soc_find_writer')}</p>
                  <p className="text-xs mt-1">{t('soc_find_writer_desc')}</p>
                </div>
              )}

              {!authorsLoading && authors.length===0 && authorQuery && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <p className="text-3xl mb-3">🔍</p>
                  <p className="text-sm font-semibold text-slate-500">{t('search_no_results')}</p>
                </div>
              )}

              {!authorsLoading && authors.map((a, i) => (
                <AuthorCard
                  key={`${a.olid}-${i}`}
                  author={a}
                  isFav={isAuthorFav(a.olid, a.name)}
                  onToggleFav={(author, fav) => fav ? removeFavoriteAuthor(author.olid || author.name.replace(/\s+/g,'_').toLowerCase()) : addFavoriteAuthor(author)}
                  onViewPosts={a => setAuthorPostsFilter(a.name)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── FOLLOWING TAB ── */}
      {activeTab==='following' && (
        <div className="px-4 py-4 flex flex-col gap-2">
          {followingLoading && <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-400"/></div>}
          {!followingLoading && followingUsers.length===0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
              <Users size={44} className="mb-4 text-slate-200"/>
              <p className="font-semibold text-slate-500">{t('soc_no_following')}</p>
              <p className="text-xs mt-1">{t('soc_no_following_desc')}</p>
            </div>
          )}
          {!followingLoading && followingUsers.map(u => (
            <FollowingCard key={u.uid} user={u} onSelect={setSelectedUser}/>
          ))}
        </div>
      )}

      {/* ── Marketplace ── */}
      {activeTab === 'marketplace' && (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
          <MarketplacePage
            onStartChat={target => { setChatTarget(target) }}
          />
        </div>
      )}

      {/* ── ADMIN TAB ── */}
      {activeTab === 'admin' && isAdmin && (
        <div className="px-4 py-4 flex flex-col gap-2">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
              <p className="text-2xl font-bold text-slate-800">{allUsers.length}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{t('soc_users_count')}</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
              <p className="text-2xl font-bold text-green-500">{onlineCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{t('soc_online')}</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
              <p className="text-2xl font-bold text-amber-500">
                {allUsers.filter(u => {
                  const ms = u.createdAt?.toMillis?.() || (u.createdAt?.seconds||0)*1000
                  return Date.now() - ms < 7*24*60*60*1000
                }).length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{t('soc_this_week')}</p>
            </div>
          </div>

          {/* Configuración de logotipo */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-2">
            <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-wide">
              ⚙️ {t('soc_app_logo')}
            </h3>
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <img 
                src={appConfig?.logoUrl || '/logosandbook.png'} 
                alt="Logo actual" 
                className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-white"
                onError={(e) => { e.target.src = '/logosandbook.png' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700">{t('soc_logo_image')}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {appConfig?.logoUrl ? t('soc_logo_custom') : t('soc_logo_default')}
                </p>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => setShowLogoPicker(true)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-bold active:scale-95 transition-all shadow-sm"
                  >
                    {t('soc_upload_new')}
                  </button>
                  {appConfig?.logoUrl && (
                    <button 
                      onClick={async () => {
                        await setDoc(doc(db, 'appConfig', 'settings'), { logoUrl: '' }, { merge: true })
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[10px] font-semibold active:scale-95 transition-all"
                    >
                      {t('soc_reset')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sub-tabs Selector inside Admin Panel */}
          <div className="flex gap-2 mb-3 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setAdminSubTab('users')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                adminSubTab === 'users'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              👥 {t('soc_users_count')} ({displayedAdmin.length})
            </button>
            <button
              onClick={() => setAdminSubTab('posts')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                adminSubTab === 'posts'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              📝 {t('soc_posts_count')} ({posts.length})
            </button>
          </div>

          {/* Tab 1: Users list */}
          {adminSubTab === 'users' && (
            <>
              <div className="flex items-center justify-between px-1 mb-1.5 gap-2">
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 min-w-0">
                  <ShieldCheck size={12} className="text-indigo-400 flex-shrink-0"/>
                  <span className="truncate">{t('soc_admin_panel')} · {displayedAdmin.length} {t('soc_users_count').toLowerCase()}</span>
                </p>
                {/* Orden por última conexión */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[9px] text-slate-400 font-medium mr-0.5 hidden sm:inline">Últ. conexión</span>
                  <button
                    onClick={() => setAdminUsersSort('recent')}
                    title="Más reciente primero"
                    className={`p-1 rounded-lg transition-all ${adminUsersSort === 'recent' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    onClick={() => setAdminUsersSort('oldest')}
                    title="Más antiguo primero"
                    className={`p-1 rounded-lg transition-all ${adminUsersSort === 'oldest' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
                  >
                    <ArrowUp size={12} />
                  </button>
                </div>
              </div>
              {allUsersLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-400"/></div>
              ) : (
                <div className="flex flex-col gap-2">
                  {displayedAdmin.map(u => (
                    <AdminUserRow key={u.uid} user={u} onSelect={setSelectedUser}/>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Tab 2: Publications list with date filter (mayor a menor y menor a mayor) */}
          {adminSubTab === 'posts' && (
            <>
              <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-indigo-400"/> {t('soc_moderation')} · {posts.length} {t('soc_posts_count').toLowerCase()}
                </p>
                {/* Order Selector (de mayor a menor días vs de menor a mayor días) */}
                <select
                  value={adminPostsSort}
                  onChange={e => setAdminPostsSort(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-xl px-2 py-1 outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="newest">{t('soc_sort_newest')}</option>
                  <option value="oldest">{t('soc_sort_oldest')}</option>
                </select>
              </div>

              {postsLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-400"/></div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sortedAdminPosts.map(post => {
                    const days = (() => {
                      if (!post.createdAt) return 0
                      const ms = post.createdAt.toMillis?.() || (post.createdAt.seconds || 0) * 1000
                      const diff = Math.max(0, Date.now() - ms)
                      return Math.floor(diff / (1000 * 60 * 60 * 24))
                    })()

                    const dateText = days === 0 
                      ? t('soc_published_today') 
                      : days === 1 
                        ? t('soc_published_yesterday') 
                        : t('soc_published_days_ago').replace('{days}', days)

                    return (
                      <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-3 relative">
                        {/* User Avatar */}
                        {post.photoURL ? (
                          <img src={post.photoURL} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover border border-slate-100 flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200">
                            <span className="text-xs font-bold text-slate-400">{(post.displayName || 'L')[0]}</span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 text-xs truncate">{post.displayName}</span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{dateText}</span>
                          </div>
                          
                          {/* Snippet or text */}
                          <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed break-words">
                            {post.repostOf ? `${t('soc_repost_of')} @${post.repostOf.displayName}: "${post.repostOf.text}"` : post.text}
                          </p>

                          {/* Associated Book if any */}
                          {(post.bookTitle || post.repostOf?.bookTitle) && (
                            <div className="mt-2 text-[10px] text-amber-600 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg w-fit">
                              📖 {post.bookTitle || post.repostOf?.bookTitle}
                            </div>
                          )}
                        </div>

                        {/* Admin Delete Action */}
                        <button
                          onClick={async () => {
                            if (window.confirm(t('soc_delete_confirm'))) {
                              await deletePost(post.id)
                            }
                          }}
                          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                          title="Eliminar publicación"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
                  {sortedAdminPosts.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-xs">{t('soc_no_posts_yet')}</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── User Profile Screen ── */}
      {selectedUser && (
        <UserProfileScreen
          targetUser={selectedUser}
          isFollowing={followingSet.has(selectedUser.uid)}
          onFollow={async uid => { await followUser(uid); loadFeed() }}
          onUnfollow={async uid => { await unfollowUser(uid); setSelectedUser(null); loadFeed() }}
          onMessage={target => { setSelectedUser(null); setChatTarget(target) }}
          onBack={() => setSelectedUser(null)}
          getUserBooks={getUserBooks}
        />
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

      {/* Create / Edit Post Sheet */}
      {showCreatePost && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => { setShowCreatePost(false); setEditingPost(null) }}/>
          <CreatePostSheet
            myBooks={books}
            editPost={editingPost}
            onPublish={({ text, book, authorId, authorName, authorPhotoUrl }) =>
              createPost(user.uid, profile, { text, book, authorId, authorName, authorPhotoUrl })
            }
            onUpdate={(postId, { text, book, authorId, authorName, authorPhotoUrl }) =>
              updatePost(postId, { text, book, authorId, authorName, authorPhotoUrl })
            }
            onClose={() => { setShowCreatePost(false); setEditingPost(null) }}
          />
        </>
      )}

      {/* Sheet: Enviar publicación a un usuario */}
      {sendPostTarget && (
        <SendPostToUserSheet
          post={sendPostTarget.post}
          followingUsers={followingUsers}
          allUsers={allUsers}
          myUid={user?.uid}
          myProfile={profile}
          sendMessage={sendMessage}
          canMessage={canMessage}
          onClose={() => setSendPostTarget(null)}
        />
      )}

      {/* Sheet: Publicaciones sobre un escritor */}
      {authorPostsFilter && (
        <AuthorPostsSheet
          authorName={authorPostsFilter}
          posts={posts}
          myUid={user?.uid}
          onLike={(postId, liked) => toggleLike(postId, user.uid, liked)}
          onUserPress={u => { setAuthorPostsFilter(null); setSelectedUser(u) }}
          onClose={() => setAuthorPostsFilter(null)}
        />
      )}

      {/* Dynamic Logo Picker Sheet */}
      {showLogoPicker && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[65]" onClick={() => setShowLogoPicker(false)} />
          <ImagePickerSheet
            title={t('soc_app_logo')}
            onSave={async (url) => {
              await setDoc(doc(db, 'appConfig', 'settings'), { logoUrl: url }, { merge: true })
            }}
            onClose={() => setShowLogoPicker(false)}
          />
        </>
      )}
    </div>
  )
}

// ── Sheet: enviar post a un usuario ─────────────────────────
function SendPostToUserSheet({ post, followingUsers, allUsers, myUid, myProfile, sendMessage, canMessage, onClose }) {
  const { t } = useAuth()
  const [query, setQuery]       = useState('')
  const [sending, setSending]   = useState(null) // uid del que se está enviando

  const candidates = useMemo(() => {
    const base = followingUsers.length > 0 ? followingUsers : allUsers.filter(u => u.uid !== myUid)
    if (!query.trim()) return base.slice(0, 20)
    const q = query.toLowerCase()
    return base.filter(u => (u.displayName || '').toLowerCase().includes(q)).slice(0, 20)
  }, [followingUsers, allUsers, myUid, query])

  const shareText = post.repostOf
    ? `"${post.repostOf.text}"${post.repostOf.bookTitle ? ` — ${post.repostOf.bookTitle}` : ''}`
    : `"${post.text}"${post.bookTitle ? ` — ${post.bookTitle}` : ''}`

  async function handleSend(targetUser) {
    setSending(targetUser.uid)
    try {
      const allowed = await canMessage(myUid, targetUser.uid, myProfile)
      if (!allowed) { alert('Este usuario no acepta mensajes'); setSending(null); return }
      await sendMessage(myUid, myProfile, targetUser.uid, targetUser, `📖 ${shareText}`)
      onClose()
    } catch { setSending(null) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end">
        <div className="w-full max-w-5xl mx-auto bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
            <h3 className="font-bold text-slate-800">{t('soc_send_to_user')}</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <X size={15} />
            </button>
          </div>
          <div className="px-5 py-3 border-b border-slate-50 flex-shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder={t('soc_search_user_placeholder')}
                className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 px-5 py-2">
            {candidates.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">{t('soc_no_users_to_show')}</p>
            )}
            {candidates.map(u => (
              <button key={u.uid} onClick={() => handleSend(u)}
                disabled={sending === u.uid}
                className="flex items-center gap-3 w-full py-3 border-b border-slate-50 last:border-0 active:bg-slate-50 text-left">
                {u.photoURL
                  ? <img src={u.photoURL} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover border border-amber-200 flex-shrink-0" />
                  : <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0 text-amber-600 font-bold text-xs">
                      {(u.displayName || '?')[0].toUpperCase()}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 line-clamp-1">{u.displayName || t('soc_reader_default')}</p>
                </div>
                {sending === u.uid
                  ? <Loader2 size={14} className="animate-spin text-amber-400 flex-shrink-0" />
                  : <MessageCircle size={14} className="text-slate-300 flex-shrink-0" />
                }
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Sheet: publicaciones sobre un autor ──────────────────────
function AuthorPostsSheet({ authorName, posts, myUid, onLike, onUserPress, onClose }) {
  const { t } = useAuth()
  const filtered = useMemo(() =>
    posts.filter(p => p.authorName && p.authorName.toLowerCase() === authorName.toLowerCase()),
    [posts, authorName]
  )

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end">
        <div className="w-full max-w-5xl mx-auto bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-amber-500" />
              <h3 className="font-bold text-slate-800 line-clamp-1">{t('soc_posts_about')} {authorName}</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <X size={15} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <FileText size={36} className="mb-3 text-slate-200" />
                <p className="text-sm font-semibold text-slate-500">{t('soc_no_posts_yet')}</p>
                <p className="text-xs mt-1">{t('soc_nobody_tagged_prefix')} {authorName} {t('soc_nobody_tagged_suffix')}</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400 font-medium px-1">{filtered.length} {t('soc_posts_count')}</p>
                {filtered.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    myUid={myUid}
                    onLike={onLike}
                    onDelete={() => {}}
                    onUserPress={onUserPress}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
