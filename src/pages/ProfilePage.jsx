import { useState, useMemo, useEffect } from 'react'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { BookOpen, Star, LogOut, Pencil, Check, X, Bell, BellOff, Camera, Settings, Loader2, ChevronRight, ArrowLeft, Upload, CalendarDays, Share2 } from 'lucide-react'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useBooks } from '../hooks/useBooks'
import { useNotifications } from '../hooks/useNotifications'
import ImagePickerSheet from '../components/ui/ImagePickerSheet'
import SettingsSheet from '../components/profile/SettingsSheet'
import { respondToLoan } from '../hooks/useLoanRequests'
import { cleanThumbnail } from '../utils/cleanThumbnail'
import { useFavoriteAuthors } from '../hooks/useFavoriteAuthors'
import { getGlobalAuthorPhoto, saveGlobalAuthorPhoto } from '../hooks/useGlobalMedia'
import UserProfileScreen from '../components/social/UserProfileScreen'
import { useUsers } from '../hooks/useUsers'

const GBOOKS_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || ''

// ── Sheet de detalle de autor: bio + carrusel de libros ───────────────
function AuthorDetailSheet({ author, uid, onPhotoSaved, onClose }) {
  const [photo,       setPhoto]       = useState(author.photoUrl || null)
  const [bio,         setBio]         = useState(null)
  const [books,       setBooks]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showPicker,  setShowPicker]  = useState(false)

  useEffect(() => {
    getGlobalAuthorPhoto(author.name).then(url => { if (url) setPhoto(url) })

    async function load() {
      // Bio desde OpenLibrary
      if (author.olid) {
        try {
          const res  = await fetch(`https://openlibrary.org/authors/${author.olid}.json`)
          const data = await res.json()
          const raw  = typeof data.bio === 'string' ? data.bio
                     : typeof data.bio?.value === 'string' ? data.bio.value : ''
          setBio(raw.replace(/\n+/g, ' ').slice(0, 500) || null)
          // Foto de OpenLibrary si no hay una guardada
          if (!photo) {
            const coverUrl = `https://covers.openlibrary.org/a/olid/${author.olid}-M.jpg`
            const img = new Image()
            img.onload = () => setPhoto(coverUrl)
            img.src = coverUrl
          }
        } catch {}
      }
      // Libros desde Google Books
      try {
        const url  = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${encodeURIComponent('"' + author.name + '"')}&maxResults=12${GBOOKS_KEY ? `&key=${GBOOKS_KEY}` : ''}`
        const res  = await fetch(url)
        const data = await res.json()
        setBooks((data.items || []).map(item => ({
          bookId:       item.id,
          title:        item.volumeInfo.title,
          thumbnail:    item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
          publishedDate: item.volumeInfo.publishedDate || '',
        })))
      } catch {}
      setLoading(false)
    }
    load()
  }, [author.olid, author.name])

  async function handlePhotoSave(url) {
    setPhoto(url)
    if (uid) await saveGlobalAuthorPhoto(author.name, url, uid)
    onPhotoSaved?.(author.id, url)
    setShowPicker(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-end">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center gap-4 p-5 border-b border-slate-100 flex-shrink-0">
            <div className="relative group flex-shrink-0">
              {photo ? (
                <img src={photo} alt={author.name}
                  className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-slate-100"
                  onError={() => setPhoto(null)} />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <BookOpen size={22} className="text-slate-300" />
                </div>
              )}
              <button onClick={() => setShowPicker(true)}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                <Upload size={9} className="text-white" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 text-base leading-tight">{author.name}</h3>
              {author.topWork && <p className="text-xs text-slate-400 italic mt-0.5 truncate">"{author.topWork}"</p>}
              {author.workCount > 0 && <p className="text-[10px] text-slate-400 mt-0.5">{author.workCount} obras</p>}
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 flex-shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={22} className="animate-spin text-slate-200" />
              </div>
            ) : (
              <>
                {bio && (
                  <div className="mb-5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Biografía</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{bio}</p>
                  </div>
                )}
                {books.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Libros</p>
                    <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
                      {books.map(b => (
                        <div key={b.bookId} className="flex-shrink-0 w-20">
                          {b.thumbnail ? (
                            <img src={b.thumbnail} alt={b.title}
                              className="w-20 h-[112px] object-cover rounded-xl shadow-sm" />
                          ) : (
                            <div className="w-20 h-[112px] bg-slate-100 rounded-xl flex items-center justify-center">
                              <BookOpen size={16} className="text-slate-300" />
                            </div>
                          )}
                          <p className="text-[9px] text-slate-500 mt-1.5 line-clamp-2 text-center leading-tight">{b.title}</p>
                          {b.publishedDate && (
                            <p className="text-[8px] text-slate-300 text-center">{b.publishedDate.slice(0, 4)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!bio && books.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8">Sin información disponible</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showPicker && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[85]" onClick={() => setShowPicker(false)} />
          <div className="fixed inset-0 z-[86] flex items-end">
            <ImagePickerSheet
              title={`Foto de ${author.name}`}
              onSave={handlePhotoSave}
              onClose={() => setShowPicker(false)}
            />
          </div>
        </>
      )}
    </>
  )
}

// ── Avatar de autor favorito — toca para abrir detalle ────────────────
function FavAuthorAvatar({ author, uid, onPhotoSaved }) {
  const [photo,      setPhoto]      = useState(author.photoUrl || null)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    getGlobalAuthorPhoto(author.name).then(url => { if (url) setPhoto(url) })
  }, [author.name])

  return (
    <>
      <button
        onClick={() => setShowDetail(true)}
        className="flex flex-col items-center w-16 active:scale-95 transition-all"
      >
        {photo ? (
          <img
            src={photo}
            alt={author.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-amber-200 shadow-sm"
            onError={() => setPhoto(null)}
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-amber-200 flex flex-col items-center justify-center gap-0.5">
            <BookOpen size={14} className="text-slate-300"/>
            <span className="text-[7px] text-slate-400">+ foto</span>
          </div>
        )}
        <p className="text-[9px] text-slate-600 text-center leading-tight mt-1.5 line-clamp-2">{author.name}</p>
      </button>

      {showDetail && (
        <AuthorDetailSheet
          author={author}
          uid={uid}
          onPhotoSaved={(id, url) => { setPhoto(url); onPhotoSaved?.(id, url) }}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  )
}

// ── User List Screen (full screen) ────────────────────────
function UserListScreen({ title, uids, myFollowing = [], myUid, myProfile, setMyProfile, onClose }) {
  const [users, setUsers]       = useState(null)
  const [selected, setSelected] = useState(null)
  const mutualSet = new Set(myFollowing)

  const { getUserBooks, followUser, unfollowUser } = useUsers(myUid, myProfile, setMyProfile)

  useMemo(async () => {
    const profiles = await Promise.all(
      uids.map(async uid => {
        const snap = await getDoc(doc(db, 'users', uid))
        return snap.exists() ? { uid, ...snap.data() } : null
      })
    )
    setUsers(profiles.filter(Boolean))
  }, [uids.join(',')])

  function Av({ photoURL, displayName, size = 11 }) {
    const init = (displayName||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
    if (photoURL) return <img src={photoURL} alt="" className={`w-${size} h-${size} rounded-full object-cover border-2 border-amber-200 flex-shrink-0`} />
    return <div className={`w-${size} h-${size} rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center font-bold text-amber-600 text-sm flex-shrink-0`}>{init}</div>
  }

  // Abre el perfil completo con UserProfileScreen
  if (selected) {
    return (
      <UserProfileScreen
        targetUser={selected}
        isFollowing={(myProfile?.following || []).includes(selected.uid)}
        onFollow={async uid => { await followUser(uid) }}
        onUnfollow={async uid => { await unfollowUser(uid); setSelected(null) }}
        onMessage={null}
        onBack={() => setSelected(null)}
        getUserBooks={getUserBooks}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[61] bg-slate-50 flex flex-col w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow-sm flex items-center gap-3 px-4 pt-12 pb-4 flex-shrink-0">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-500 hover:text-amber-500 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
        {users && <span className="text-sm text-slate-400 ml-auto">({users.length})</span>}
      </div>

      <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-2">
        {users === null && (
          <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-400" /></div>
        )}
        {users?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-semibold text-slate-500 text-sm">Nadie aquí todavía</p>
          </div>
        )}
        {users?.map(u => (
          <button key={u.uid} onClick={() => setSelected(u)}
            className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 text-left active:bg-slate-50 transition-all">
            <Av photoURL={u.photoURL} displayName={u.displayName} size={12} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 line-clamp-1">{u.displayName || 'Lector'}</p>
              <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                <span>{(u.followers||[]).length} seguidores</span>
                {mutualSet.has(u.uid) && <span className="text-amber-500 font-medium">· Mutuo</span>}
              </div>
              {u.bio && <p className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">"{u.bio}"</p>}
            </div>
            <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Bio Editor ─────────────────────────────────────────────
function BioEditor({ bio, uid, onSave }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(bio || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await updateDoc(doc(db, 'users', uid), { bio: value.trim() })
    onSave(value.trim())
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="w-full">
        <textarea autoFocus value={value} onChange={e => setValue(e.target.value)}
          maxLength={150} rows={3}
          className="w-full px-3 py-2 text-sm text-slate-700 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          placeholder="Contá algo sobre vos como lector…" />
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[10px] text-slate-300">{value.length}/150</span>
          <div className="flex gap-2">
            <button onClick={() => { setValue(bio || ''); setEditing(false) }} className="p-1.5 rounded-full text-slate-400"><X size={14} /></button>
            <button onClick={save} disabled={saving} className="p-1.5 rounded-full bg-amber-500 text-white disabled:opacity-50"><Check size={14} /></button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button onClick={() => setEditing(true)} className="w-full text-left group flex items-start gap-2">
      <p className={`text-sm flex-1 leading-relaxed ${bio ? 'text-slate-600' : 'text-slate-300 italic'}`}>
        {bio || 'Agregá una bio…'}
      </p>
      <Pencil size={12} className="text-slate-300 group-hover:text-amber-400 flex-shrink-0 mt-0.5 transition-colors" />
    </button>
  )
}

// ── Notification Item ──────────────────────────────────────
function NotificationItem({ notif, uid, onRead }) {
  function timeAgo(ts) {
    if (!ts?.seconds) return ''
    const diff = Date.now() - ts.seconds * 1000
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'ahora'
    if (m < 60) return `hace ${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `hace ${h}h`
    return `hace ${Math.floor(h / 24)}d`
  }
  const icon = notif.type === 'recommendation' ? '📖'
    : notif.type === 'loan_request' ? '📚'
    : notif.type === 'new_follower' ? '👤' : '🔔'

  if (notif.type === 'loan_request') {
    return (
      <div className={`flex gap-3 items-start px-3 py-3 rounded-2xl ${notif.read ? 'bg-slate-50' : 'bg-amber-50 border border-amber-100'}`}>
        <span className="text-xl flex-shrink-0">📚</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-700 leading-relaxed mb-2">
            <span className="font-semibold">{notif.fromName}</span> quiere pedir prestado{' '}
            <span className="font-semibold">"{notif.bookTitle}"</span>
            {notif.message && <span className="text-slate-500"> — "{notif.message}"</span>}
          </p>
          <div className="flex gap-2">
            <button onClick={async () => { await respondToLoan(uid, notif.loanRequestId, true); onRead(notif.id) }}
              className="px-3 py-1.5 bg-green-500 text-white rounded-full text-[10px] font-semibold active:scale-95">
              Aceptar
            </button>
            <button onClick={async () => { await respondToLoan(uid, notif.loanRequestId, false); onRead(notif.id) }}
              className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-semibold active:scale-95">
              Rechazar
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">{timeAgo(notif.createdAt)}</p>
        </div>
        {!notif.read && <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1" />}
      </div>
    )
  }

  return (
    <button onClick={() => !notif.read && onRead(notif.id)}
      className={`w-full flex gap-3 items-start text-left px-3 py-3 rounded-2xl transition-all ${notif.read ? 'bg-slate-50' : 'bg-amber-50 border border-amber-100'}`}>
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-700 leading-relaxed">
          <span className="font-semibold">{notif.fromName}</span>{' '}
          {notif.type === 'recommendation' ? 'te recomendó: ' : 'te sigue'}
          {notif.message && <span className="text-slate-600">"{notif.message}"</span>}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(notif.createdAt)}</p>
      </div>
      {!notif.read && <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1" />}
    </button>
  )
}

// ── Book Row ───────────────────────────────────────────────
function BookRow({ book }) {
  return (
    <div className="flex gap-3 items-center bg-slate-50 rounded-2xl px-3 py-2.5">
      {cleanThumbnail(book.customThumbnail || book.thumbnail) ? (
        <img src={cleanThumbnail(book.customThumbnail || book.thumbnail)} alt="" className="w-9 h-12 object-cover rounded-lg shadow-sm flex-shrink-0" />
      ) : (
        <div className="w-9 h-12 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen size={14} className="text-slate-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 line-clamp-1">{book.title}</p>
        {book.authors?.length > 0 && <p className="text-[10px] text-slate-400 line-clamp-1">{book.authors[0]}</p>}
        {book.rating > 0 && (
          <div className="flex gap-0.5 mt-1">
            {[1,2,3,4,5].map(n => (
              <Star key={n} size={8} className={n <= book.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function ProfilePage() {
  const { user, profile, setProfile, logout } = useAuth()
  const { books } = useBooks(user?.uid)
  const { authors: favAuthors, updateAuthorPhoto } = useFavoriteAuthors(user?.uid)
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(user?.uid)

  const [showNotifs, setShowNotifs]     = useState(false)
  const [pickerTarget, setPickerTarget] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [userListMode, setUserListMode] = useState(null) // 'following' | 'followers' | 'mutual'

  const stats = useMemo(() => ({
    total:     books.length,
    reading:   books.filter(b => b.status === 'reading').length,
    read:      books.filter(b => b.status === 'read').length,
    fav:       books.filter(b => b.isFavorite).length,
  }), [books])

  const reading = useMemo(() => books.filter(b => b.status === 'reading').slice(0, 3), [books])
  const recents = useMemo(() => books.filter(b => b.status === 'read').slice(0, 3), [books])

  const memberSince = profile?.createdAt?.seconds
    ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    : null

  const notifsEnabled  = profile?.notificationsEnabled !== false
  const followingCount = (profile?.following || []).length
  const followersCount = (profile?.followers || []).length

  async function toggleNotifications() {
    const next = !notifsEnabled
    await updateDoc(doc(db, 'users', user.uid), { notificationsEnabled: next })
    setProfile(p => ({ ...p, notificationsEnabled: next }))
  }

  async function saveAvatar(url) {
    await updateDoc(doc(db, 'users', user.uid), { photoURL: url })
    setProfile(p => ({ ...p, photoURL: url }))
  }

  async function saveCover(url) {
    await updateDoc(doc(db, 'users', user.uid), { coverURL: url })
    setProfile(p => ({ ...p, coverURL: url }))
  }

  const coverUrl  = profile?.coverURL  || null
  const avatarUrl = profile?.photoURL  || null
  const avatarInitials = (profile?.displayName || 'L').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50 pb-6">

      {/* Cover + Avatar header */}
      <div className="bg-white shadow-sm">

        {/* Cover image */}
        <div className="relative h-32 bg-gradient-to-br from-amber-400 to-orange-300">
          {coverUrl && <img src={coverUrl} alt="" className="w-full h-full object-cover" />}
          <button onClick={() => setPickerTarget('cover')}
            className="absolute bottom-2 right-2 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all">
            <Camera size={14} />
          </button>
        </div>

        {/* Avatar row */}
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-10 mb-3">
            {/* Avatar */}
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-white shadow-md flex items-center justify-center text-amber-600 font-bold text-2xl">
                  {avatarInitials}
                </div>
              )}
              <button onClick={() => setPickerTarget('avatar')}
                className="absolute bottom-0 right-0 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white">
                <Camera size={11} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => { setShowNotifs(v => !v); if (!showNotifs && unreadCount > 0) markAllRead() }}
                className="relative w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
                {notifsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button onClick={() => setShowSettings(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Settings size={16} />
              </button>
              <button onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                <LogOut size={12} /> Salir
              </button>
            </div>
          </div>

          {/* Name + info */}
          <h2 className="text-lg font-bold text-slate-800">{profile?.displayName || 'Lector'}</h2>
          {memberSince && <p className="text-[10px] text-slate-300 mt-0.5">Miembro desde {memberSince}</p>}

          {/* Followers / Following — clickeables */}
          <div className="flex gap-4 mt-2 mb-3">
            <button onClick={() => setUserListMode('following')} className="text-xs text-slate-500 hover:text-amber-600 transition-colors">
              <span className="font-bold text-slate-800">{followingCount}</span> siguiendo
            </button>
            <button onClick={() => setUserListMode('followers')} className="text-xs text-slate-500 hover:text-amber-600 transition-colors">
              <span className="font-bold text-slate-800">{followersCount}</span> seguidores
            </button>
            {followingCount > 0 && followersCount > 0 && (
              <button onClick={() => setUserListMode('mutual')} className="text-xs text-slate-500 hover:text-amber-600 transition-colors">
                <span className="font-bold text-slate-800">
                  {(profile?.following||[]).filter(uid => (profile?.followers||[]).includes(uid)).length}
                </span> mutuos
              </button>
            )}
          </div>

          <BioEditor bio={profile?.bio} uid={user?.uid} onSave={bio => setProfile(p => ({ ...p, bio }))} />
        </div>
      </div>

      {/* Notifications panel */}
      {showNotifs && (
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Notificaciones</p>
            <div className="flex items-center gap-2">
              <button onClick={toggleNotifications}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${notifsEnabled ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                {notifsEnabled ? <><Bell size={10} /> Activas</> : <><BellOff size={10} /> Desactivadas</>}
              </button>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-amber-500 font-medium">Marcar leídas</button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1 p-2">
            {notifications.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No tenés notificaciones</p>
            )}
            {notifications.map(n => <NotificationItem key={n.id} notif={n} uid={user?.uid} onRead={markRead} />)}
          </div>
        </div>
      )}

      {/* Botones de acción rápida */}
      <div className="mx-4 mt-4 flex gap-3">
        <button
          onClick={() => {
            const url = window.location.href
            const msg = `¡Unite a Sandbook! Leé y compartí libros con amigos: ${url}`
            if (navigator.share) { navigator.share({ title: 'Sandbook', text: msg, url }).catch(() => {}) }
            else window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500 text-white text-sm font-semibold shadow-sm active:scale-95 transition-all"
        >
          <Share2 size={16}/> Invitar
        </button>
        <button
          onClick={() => document.getElementById('reading-plan-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 text-white text-sm font-semibold shadow-sm active:scale-95 transition-all"
        >
          <CalendarDays size={16}/> En plan
        </button>
      </div>

      {/* Stats */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex divide-x divide-slate-100">
          <div className="flex flex-col items-center gap-0.5 flex-1">
            <span className="text-2xl font-bold text-slate-800">{stats.total}</span>
            <span className="text-[10px] text-slate-400">Total</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 flex-1">
            <span className="text-2xl font-bold text-amber-500">{stats.reading}</span>
            <span className="text-[10px] text-slate-400">Leyendo</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 flex-1">
            <span className="text-2xl font-bold text-green-500">{stats.read}</span>
            <span className="text-[10px] text-slate-400">Leídos</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 flex-1">
            <span className="text-2xl font-bold text-pink-400">{stats.fav}</span>
            <span className="text-[10px] text-slate-400">Favoritos</span>
          </div>
        </div>
      </div>

      {reading.length > 0 && (
        <div id="reading-plan-section" className="mx-4 mt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">Leyendo ahora</p>
          <div className="flex flex-col gap-2">{reading.map(b => <BookRow key={b.id} book={b} />)}</div>
        </div>
      )}

      {recents.length > 0 && (
        <div className="mx-4 mt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">Últimos leídos</p>
          <div className="flex flex-col gap-2">{recents.map(b => <BookRow key={b.id} book={b} />)}</div>
        </div>
      )}

      {/* Favorite authors */}
      {favAuthors.length > 0 && (
        <div className="mx-4 mt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">Escritores favoritos</p>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
            {favAuthors.map(a => (
              <div key={a.id} className="flex-shrink-0">
                <FavAuthorAvatar
                  author={a}
                  uid={user?.uid}
                  onPhotoSaved={(id, url) => updateAuthorPhoto(id, url)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {books.length === 0 && !showNotifs && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 px-4 text-center">
          <BookOpen size={36} className="mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500">Tu biblioteca está vacía</p>
          <p className="text-xs mt-1">Buscá libros en la pestaña Buscar para empezar</p>
        </div>
      )}

      {/* User list modal */}
      {userListMode && (() => {
        const following = profile?.following || []
        const followers = profile?.followers || []
        const mutual    = following.filter(uid => followers.includes(uid))
        const uids = userListMode === 'following' ? following
          : userListMode === 'followers' ? followers
          : mutual
        const title = userListMode === 'following' ? 'Siguiendo'
          : userListMode === 'followers' ? 'Seguidores'
          : 'Seguidores mutuos'
        return (
          <>
            <UserListScreen
              title={title}
              uids={uids}
              myFollowing={following}
              myUid={user?.uid}
              myProfile={profile}
              setMyProfile={setProfile}
              onClose={() => setUserListMode(null)}
            />
          </>
        )
      })()}

      {/* Settings sheet */}
      {showSettings && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[55]" onClick={() => setShowSettings(false)} />
          <SettingsSheet
            profile={profile}
            uid={user?.uid}
            onUpdate={updates => setProfile(p => ({ ...p, ...updates }))}
            onClose={() => setShowSettings(false)}
          />
        </>
      )}

      {/* Image pickers */}
      {pickerTarget && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[65]" onClick={() => setPickerTarget(null)} />
          <ImagePickerSheet
            title={pickerTarget === 'avatar' ? 'Foto de perfil' : 'Imagen de portada'}
            storagePath={`users/${user.uid}/${pickerTarget}`}
            onSave={pickerTarget === 'avatar' ? saveAvatar : saveCover}
            onClose={() => setPickerTarget(null)}
          />
        </>
      )}
    </div>
  )
}
