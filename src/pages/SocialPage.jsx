import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search, X, BookOpen, Users, Loader2,
  ChevronRight, RefreshCw, Plus, MessageCircle,
  Feather, ShieldCheck, User, FileText, Repeat2,
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
  const init = (displayName||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const sz = { sm:'w-8 h-8 text-xs', md:'w-10 h-10 text-sm', lg:'w-14 h-14 text-lg' }[size] || 'w-10 h-10 text-sm'
  const dotSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'
  return (
    <div className="relative flex-shrink-0">
      {photoURL
        ? <img src={photoURL} alt="" className={`${sz} rounded-full object-cover border-2 border-amber-200`} />
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
  return (
    <button onClick={() => onSelect(user)}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 active:bg-slate-50 text-left">
      <Avatar photoURL={user.photoURL} displayName={user.displayName} online={user.online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-slate-800 line-clamp-1">{user.displayName||'Lector'}</p>
          {user.online && <span className="text-[9px] text-green-500 font-semibold">● En línea</span>}
        </div>
        <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
          <span>{(user.followers||[]).length} seguidores</span>
          {isFollowing && <span className="text-amber-500 font-medium">· Siguiendo</span>}
        </div>
        {user.bio && <p className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">"{user.bio}"</p>}
      </div>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
    </button>
  )
}

// ── Admin User Row ─────────────────────────────────────────
function AdminUserRow({ user, onSelect }) {
  const createdAt = user.createdAt?.toDate
    ? user.createdAt.toDate().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'2-digit' })
    : '—'
  return (
    <button onClick={() => onSelect(user)}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 active:bg-slate-50 text-left">
      <Avatar photoURL={user.photoURL} displayName={user.displayName} size="sm" online={user.online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold text-slate-800 line-clamp-1">{user.displayName||'(sin nombre)'}</p>
          {user.online && <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" style={{boxShadow:'0 0 5px #4ade80'}}/>}
        </div>
        <p className="text-[10px] text-slate-400 line-clamp-1">{user.bio || ''}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[9px] text-slate-300">{createdAt}</p>
        <p className="text-[9px] text-slate-400">{(user.followers||[]).length} seg.</p>
      </div>
    </button>
  )
}

// ── Following Card ─────────────────────────────────────────
function FollowingCard({ user, onSelect }) {
  return (
    <button onClick={() => onSelect(user)}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 active:bg-slate-50 text-left">
      <Avatar photoURL={user.photoURL} displayName={user.displayName} online={user.online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-slate-800 line-clamp-1">{user.displayName||'Lector'}</p>
          {user.online && <span className="text-[9px] text-green-500 font-semibold">● En línea</span>}
        </div>
        {user.currentBook
          ? <div className="flex items-center gap-1 mt-0.5"><BookOpen size={9} className="text-amber-400 flex-shrink-0"/><p className="text-[10px] text-slate-400 line-clamp-1">{user.currentBook.title}</p></div>
          : <p className="text-[10px] text-slate-300 mt-0.5">Sin lectura activa</p>
        }
      </div>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
    </button>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function SocialPage() {
  const { user, profile, setProfile, appConfig } = useAuth()
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

  // Admin: todos los usuarios filtrados
  const displayedAdmin = useMemo(() => {
    if (!adminQuery.trim()) return allUsers
    const q = adminQuery.toLowerCase()
    return allUsers.filter(u =>
      (u.displayName||'').toLowerCase().includes(q) ||
      (u.email||'').toLowerCase().includes(q)
    )
  }, [allUsers, adminQuery])

  const onlineCount = useMemo(() => allUsers.filter(u => u.online).length, [allUsers])

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
          <h1 className="text-xl font-bold text-slate-800">Red Social</h1>
          {activeTab === 'feed' && (
            <button onClick={() => setShowCreatePost(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-full text-xs font-semibold shadow-sm active:scale-95">
              <Plus size={13}/> Publicar
            </button>
          )}
        </div>

        {/* Main tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab===tab.key?'bg-amber-500 text-white shadow-sm':'bg-slate-100 text-slate-500'}`}>
              {tab.label}
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
              <Users size={11}/> Lectores
            </button>
            <button onClick={() => setDiscoverTab('authors')}
              className={`flex items-center gap-1.5 flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${discoverTab==='authors'?'bg-slate-800 text-white':'bg-slate-100 text-slate-500'}`}>
              <Feather size={11}/> Escritores
            </button>
          </div>
        )}

        {/* Search bars */}
        {activeTab==='discover' && discoverTab==='readers' && (
          <form onSubmit={e=>{e.preventDefault(); readerInputRef.current?.blur()}} className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              <input ref={readerInputRef} value={readerQuery} onChange={e=>setReaderQuery(e.target.value)}
                placeholder="Buscá un lector por nombre…"
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
                placeholder="Buscar escritor/a…"
                className="w-full pl-9 pr-8 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"/>
              {authorQuery && (
                <button type="button" onClick={clearAuthor} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={13}/></button>
              )}
            </div>
            <button type="submit" disabled={!authorQuery.trim()||authorsLoading}
              className="px-4 py-2.5 bg-slate-800 text-white rounded-2xl text-xs font-semibold disabled:opacity-40 active:scale-95">
              Buscar
            </button>
          </form>
        )}

        {/* Admin search bar */}
        {activeTab==='admin' && (
          <div className="relative mt-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input value={adminQuery} onChange={e=>setAdminQuery(e.target.value)}
              placeholder="Filtrar por nombre o email…"
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
              <p className="font-semibold text-slate-500">Todavía no hay publicaciones</p>
              <p className="text-xs mt-1">¡Sé el primero en compartir una frase!</p>
              <button onClick={()=>setShowCreatePost(true)}
                className="mt-4 px-5 py-2.5 bg-amber-500 text-white rounded-2xl text-sm font-semibold shadow-sm">
                Publicar ahora
              </button>
            </div>
          )}

          {!postsLoading && posts.length>0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium">Publicaciones recientes</p>
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
                <p className="text-xs text-slate-400 font-medium">Actividad de lectores que seguís</p>
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
                  <p className="font-semibold text-slate-500">Buscá un lector</p>
                  <p className="text-xs mt-1">Escribí el nombre y encontrá otros lectores</p>
                </div>
              ) : allUsersLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-400"/></div>
              ) : displayedReaders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <p className="text-3xl mb-3">🔍</p>
                  <p className="text-sm font-semibold text-slate-500">Sin resultados para "{readerQuery}"</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400 font-medium px-1">{displayedReaders.length} resultado{displayedReaders.length !== 1 ? 's' : ''}</p>
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
                  <p className="font-semibold text-slate-500">Buscá un escritor/a</p>
                  <p className="text-xs mt-1">Escribí el nombre y encontrá sus libros</p>
                </div>
              )}

              {!authorsLoading && authors.length===0 && authorQuery && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <p className="text-3xl mb-3">🔍</p>
                  <p className="text-sm font-semibold text-slate-500">Sin resultados</p>
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
              <p className="font-semibold text-slate-500">Todavía no seguís a nadie</p>
              <p className="text-xs mt-1">Buscá lectores en Descubrir</p>
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
              <p className="text-[10px] text-slate-400 mt-0.5">Usuarios</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
              <p className="text-2xl font-bold text-green-500">{onlineCount}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">En línea</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
              <p className="text-2xl font-bold text-amber-500">
                {allUsers.filter(u => {
                  const ms = u.createdAt?.toMillis?.() || (u.createdAt?.seconds||0)*1000
                  return Date.now() - ms < 7*24*60*60*1000
                }).length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Esta semana</p>
            </div>
          </div>

          {/* Configuración de logotipo */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-2">
            <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-wide">
              ⚙️ Logotipo de la App
            </h3>
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <img 
                src={appConfig?.logoUrl || '/logosandbook.png'} 
                alt="Logo actual" 
                className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-white"
                onError={(e) => { e.target.src = '/logosandbook.png' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700">Imagen del Logotipo</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {appConfig?.logoUrl ? 'Personalizado (Base64)' : 'Predeterminado (/logosandbook.png)'}
                </p>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => setShowLogoPicker(true)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-bold active:scale-95 transition-all shadow-sm"
                  >
                    Subir nuevo
                  </button>
                  {appConfig?.logoUrl && (
                    <button 
                      onClick={async () => {
                        await setDoc(doc(db, 'appConfig', 'settings'), { logoUrl: '' }, { merge: true })
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[10px] font-semibold active:scale-95 transition-all"
                    >
                      Restablecer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-medium px-1 flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-indigo-400"/> Panel de administrador · {displayedAdmin.length} usuarios
          </p>

          {allUsersLoading
            ? <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-400"/></div>
            : displayedAdmin.map(u => (
                <AdminUserRow key={u.uid} user={u} onSelect={setSelectedUser}/>
              ))
          }
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
            title="Logotipo de la aplicación"
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
            <h3 className="font-bold text-slate-800">Enviar a un usuario</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <X size={15} />
            </button>
          </div>
          <div className="px-5 py-3 border-b border-slate-50 flex-shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Buscar usuario…"
                className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 px-5 py-2">
            {candidates.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">Sin usuarios para mostrar</p>
            )}
            {candidates.map(u => (
              <button key={u.uid} onClick={() => handleSend(u)}
                disabled={sending === u.uid}
                className="flex items-center gap-3 w-full py-3 border-b border-slate-50 last:border-0 active:bg-slate-50 text-left">
                {u.photoURL
                  ? <img src={u.photoURL} alt="" className="w-9 h-9 rounded-full object-cover border border-amber-200 flex-shrink-0" />
                  : <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0 text-amber-600 font-bold text-xs">
                      {(u.displayName || '?')[0].toUpperCase()}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 line-clamp-1">{u.displayName || 'Lector'}</p>
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
              <h3 className="font-bold text-slate-800 line-clamp-1">Publicaciones sobre {authorName}</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <X size={15} />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <FileText size={36} className="mb-3 text-slate-200" />
                <p className="text-sm font-semibold text-slate-500">Sin publicaciones aún</p>
                <p className="text-xs mt-1">Nadie etiquetó a {authorName} todavía</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400 font-medium px-1">{filtered.length} publicacion{filtered.length !== 1 ? 'es' : ''}</p>
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
