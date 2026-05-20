import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Search, X, BookOpen, Users, Loader2,
  ChevronRight, RefreshCw, Plus, MessageCircle,
  Feather,
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
import PostCard from '../components/social/PostCard'
import CreatePostSheet from '../components/social/CreatePostSheet'
import AuthorCard from '../components/social/AuthorCard'
import UserProfileScreen from '../components/social/UserProfileScreen'
import ChatWindow from '../components/chat/ChatWindow'
import MarketplacePage from './MarketplacePage'

const TABS = [
  { key: 'feed',        label: 'Feed' },
  { key: 'discover',    label: 'Descubrir' },
  { key: 'following',   label: 'Siguiendo' },
  { key: 'marketplace', label: '🛒 Marketplace' },
]

// ── Avatar ─────────────────────────────────────────────────
function Avatar({ photoURL, displayName, size = 'md' }) {
  const init = (displayName||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const sz = { sm:'w-8 h-8 text-xs', md:'w-10 h-10 text-sm', lg:'w-14 h-14 text-lg' }[size] || 'w-10 h-10 text-sm'
  if (photoURL) return <img src={photoURL} alt="" className={`${sz} rounded-full object-cover border-2 border-amber-200 flex-shrink-0`} />
  return <div className={`${sz} rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center font-bold text-amber-600 flex-shrink-0`}>{init}</div>
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
      <Avatar photoURL={user.photoURL} displayName={user.displayName} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{user.displayName||'Lector'}</p>
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

// ── Following Card ─────────────────────────────────────────
function FollowingCard({ user, onSelect }) {
  return (
    <button onClick={() => onSelect(user)}
      className="w-full flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 active:bg-slate-50 text-left">
      <Avatar photoURL={user.photoURL} displayName={user.displayName} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{user.displayName||'Lector'}</p>
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
  const { user, profile, setProfile } = useAuth()

  const { searchResults, searchLoading, searchUsers,
          followingUsers, followingLoading, loadFollowing,
          getUserBooks, followUser, unfollowUser } = useUsers(user?.uid, profile, setProfile)

  const followingUids = profile?.following || []
  const { items: feedItems, loading: feedLoading, loaded: feedLoaded, load: loadFeed } = useFeed(user?.uid, followingUids)
  const { posts, loading: postsLoading, createPost, toggleLike, deletePost } = usePosts()
  const { books } = useBooks(user?.uid)
  const { canMessage, sendMessage } = useConversations(user?.uid)
  const { users: allUsers, loading: allUsersLoading } = useAllUsers(user?.uid)

  // Author search
  const { authors, loading: authorsLoading, query: authorQuery, setQuery: setAuthorQuery, search: searchAuthor, clear: clearAuthor } = useAuthorSearch()
  const { authors: favAuthors, addFavoriteAuthor, removeFavoriteAuthor, isFavorite: isAuthorFav } = useFavoriteAuthors(user?.uid)

  const [activeTab, setActiveTab]         = useState('feed')
  const [discoverTab, setDiscoverTab]     = useState('readers') // 'readers' | 'authors'
  const [readerQuery, setReaderQuery]     = useState('')
  const [selectedUser, setSelectedUser]   = useState(null)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [chatTarget, setChatTarget]       = useState(null)

  const followingSet = new Set(followingUids)

  const readerInputRef  = useRef(null)
  const authorInputRef  = useRef(null)

  // Filtered readers
  const displayedReaders = useMemo(() => {
    if (!readerQuery.trim()) return allUsers
    const q = readerQuery.toLowerCase()
    return allUsers.filter(u =>
      (u.displayName||'').toLowerCase().includes(q) ||
      (u.email||'').toLowerCase().includes(q)
    )
  }, [allUsers, readerQuery])

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
        <div className="flex gap-1.5">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab===tab.key?'bg-amber-500 text-white shadow-sm':'bg-slate-100 text-slate-500'}`}>
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
          <div className="relative mt-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input ref={readerInputRef} value={readerQuery} onChange={e=>setReaderQuery(e.target.value)}
              placeholder="Filtrar lectores…"
              className="w-full pl-9 pr-8 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"/>
            {readerQuery && (
              <button onClick={()=>setReaderQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={13}/></button>
            )}
          </div>
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
                  onLike={(postId,liked)=>toggleLike(postId,user.uid,liked)}
                  onDelete={deletePost}
                  onUserPress={setSelectedUser}/>
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
              {allUsersLoading && <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-400"/></div>}
              {!allUsersLoading && displayedReaders.length===0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Users size={40} className="mb-3 text-slate-200"/>
                  <p className="text-sm font-semibold text-slate-500">
                    {readerQuery ? 'Sin resultados' : 'Todavía no hay otros lectores registrados'}
                  </p>
                </div>
              )}
              {!allUsersLoading && displayedReaders.length>0 && (
                <>
                  {!readerQuery && <p className="text-xs text-slate-400 font-medium px-1">{displayedReaders.length} lectores registrados</p>}
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
            onStartChat={target => {
              setChatTarget(target)
            }}
          />
        </div>
      )}

      {/* ── User Profile Screen (full screen) ── */}
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

      {/* Create Post Sheet */}
      {showCreatePost && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={()=>setShowCreatePost(false)}/>
          <CreatePostSheet myBooks={books}
            onPublish={({text,book})=>createPost(user.uid,profile,{text,book})}
            onClose={()=>setShowCreatePost(false)}/>
        </>
      )}
    </div>
  )
}
