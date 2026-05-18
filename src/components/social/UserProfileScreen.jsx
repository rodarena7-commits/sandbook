import { useState, useEffect } from 'react'
import {
  ArrowLeft, UserPlus, UserMinus, MessageCircle,
  BookOpen, Send, Loader2, Star, X, ThumbsUp, ThumbsDown,
} from 'lucide-react'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import BookCoverUpload from '../books/BookCoverUpload'
import BookDetailSheet from '../books/BookDetailSheet'
import { useBooks } from '../../hooks/useBooks'
import { createReadingPlan } from '../../hooks/useReadingPlan'
import { usePublicReviews } from '../../hooks/usePublicReviews'
import { useFavoriteAuthors } from '../../hooks/useFavoriteAuthors'
import { sendLoanRequest } from '../../hooks/useLoanRequests'
import { isBibleBook, countCompleted, TOTAL_CHAPTERS } from '../../hooks/useBibleProgress'
import BiblePlanView from '../books/BiblePlanView'
import BookThread from './BookThread'

const STATUS_LABELS = { reading:'Leyendo', read:'Leído', pending:'Pendiente', library:'Biblioteca' }

function Avatar({ photoURL, displayName, size = 'lg' }) {
  const init = (displayName||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const sz = { sm:'w-9 h-9 text-xs', md:'w-12 h-12 text-sm', lg:'w-20 h-20 text-2xl' }[size]
  if (photoURL) return <img src={photoURL} alt="" className={`${sz} rounded-full object-cover border-3 border-white shadow-md flex-shrink-0`} style={{border:'3px solid white'}} />
  return <div className={`${sz} rounded-full bg-amber-100 border-white flex items-center justify-center font-bold text-amber-600 flex-shrink-0 shadow-md`} style={{border:'3px solid white'}}>{init}</div>
}

function LoanModal({ book, onSend, onClose }) {
  const [msg, setMsg]     = useState('')
  const [busy, setBusy]   = useState(false)
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-6 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5" onClick={e=>e.stopPropagation()}>
        <p className="font-bold text-slate-800 mb-1">Pedir prestado</p>
        <p className="text-xs text-slate-500 mb-3 line-clamp-1">"{book.title}"</p>
        <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={3} maxLength={200}
          placeholder="Mensaje opcional…"
          className="w-full px-3 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400 resize-none mb-3"/>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-medium">Cancelar</button>
          <button disabled={busy} onClick={async()=>{setBusy(true);await onSend(msg);onClose()}}
            className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-sm font-semibold disabled:opacity-40">
            {busy?'Enviando…':'Solicitar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UserProfileScreen({ targetUser, isFollowing, onFollow, onUnfollow, onMessage, onBack, getUserBooks }) {
  const { user: me, profile } = useAuth()
  const { reviews, loading: reviewsLoading } = usePublicReviews(targetUser.uid)
  const { authors: favAuthors, loading: authorsLoading } = useFavoriteAuthors(targetUser.uid)

  const [books, setBooks]         = useState(null)
  const [tab, setTab]             = useState('library')
  const [bookTab, setBookTab]     = useState('all')
  const [acting, setActing]       = useState(false)
  const [recMsg, setRecMsg]       = useState('')
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [loanBook, setLoanBook]   = useState(null)
  const [viewBible, setViewBible] = useState(null)
  const [fullUser, setFullUser]   = useState(targetUser)
  const [viewBook, setViewBook]   = useState(null)

  // My own library to check if a book is already saved
  const { books: myBooks, addBook: addToMyLibrary } = useBooks(me?.uid)
  const myBooksMap = Object.fromEntries((myBooks || []).map(b => [b.bookId, b]))

  // Load full user profile if needed
  useEffect(() => {
    getDoc(doc(db, 'users', targetUser.uid)).then(snap => {
      if (snap.exists()) setFullUser({ uid: targetUser.uid, ...snap.data() })
    })
    getUserBooks(targetUser.uid).then(setBooks)
  }, [targetUser.uid])

  const showLibrary = fullUser.showLibrary !== false
  const favorites   = books?.filter(b => b.isFavorite) || []
  const liked       = books?.filter(b => b.myReaction === 'like') || []
  const disliked    = books?.filter(b => b.myReaction === 'dislike') || []
  const reading     = books?.filter(b => b.status === 'reading') || []

  async function handleFollow() {
    setActing(true)
    if (isFollowing) await onUnfollow(fullUser.uid)
    else await onFollow(fullUser.uid)
    setActing(false)
  }

  async function sendRec() {
    if (!recMsg.trim()) return
    setSending(true)
    const snap = await getDoc(doc(db, 'users', fullUser.uid))
    if (!snap.exists() || snap.data().notificationsEnabled !== false) {
      await setDoc(doc(db, 'users', fullUser.uid, 'notifications', `rec_${me.uid}_${Date.now()}`), {
        type:'recommendation', fromUid:me.uid,
        fromName:profile?.displayName||'Alguien', fromPhoto:profile?.photoURL||null,
        message:recMsg.trim(), createdAt:serverTimestamp(), read:false,
      })
    }
    setRecMsg(''); setSending(false); setSent(true)
    setTimeout(()=>setSent(false), 2500)
  }

  const allBooks = books || []

  const BOOK_TABS = [
    { key:'all',      label:'Todos',  list: allBooks },
    { key:'fav',      label:'⭐',     list: favorites },
    { key:'liked',    label:'👍',     list: liked },
    { key:'disliked', label:'👎',     list: disliked },
    { key:'reading',  label:'📖',    list: reading },
  ]

  const activeBookList = BOOK_TABS.find(t=>t.key===bookTab)?.list || []

  return (
    <div className="fixed inset-0 z-[55] bg-slate-50 flex flex-col w-full max-w-5xl mx-auto overflow-y-auto">

      {/* Cover + avatar (avatar absolute sobre la portada) */}
      <div className="relative flex-shrink-0">

        {/* Banner */}
        <div className="h-36 bg-gradient-to-br from-amber-400 to-orange-300">
          {fullUser.coverURL && (
            <img src={fullUser.coverURL} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Back button encima de la portada */}
        <button onClick={onBack}
          className="absolute top-12 left-4 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-20">
          <ArrowLeft size={18} />
        </button>

        {/* Avatar — absolute, solapando la portada por abajo */}
        <div className="absolute bottom-0 translate-y-1/2 left-4 z-20">
          <Avatar photoURL={fullUser.photoURL} displayName={fullUser.displayName} size="lg" />
        </div>
      </div>

      {/* Info blanca debajo — pt-12 para dejar espacio al avatar */}
      <div className="bg-white px-4 pt-12 pb-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-end mb-2">
          <div className="flex gap-2">
            <button onClick={handleFollow} disabled={acting}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 ${isFollowing?'bg-slate-100 text-slate-600':'bg-amber-500 text-white shadow-sm'} disabled:opacity-50`}>
              {isFollowing ? <><UserMinus size={12}/> Siguiendo</> : <><UserPlus size={12}/> Seguir</>}
            </button>
            {onMessage && (
              <button onClick={()=>onMessage(fullUser)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 active:scale-95">
                <MessageCircle size={12}/> Mensaje
              </button>
            )}
          </div>
        </div>

        <h2 className="text-lg font-bold text-slate-800">{fullUser.displayName||'Lector'}</h2>
        {fullUser.email && <p className="text-xs text-slate-400">{fullUser.email}</p>}
        {fullUser.bio && <p className="text-sm text-slate-600 italic mt-1">"{fullUser.bio}"</p>}

        <div className="flex gap-4 mt-2 text-xs text-slate-500">
          <span><b className="text-slate-800">{(fullUser.following||[]).length}</b> siguiendo</span>
          <span><b className="text-slate-800">{(fullUser.followers||[]).length}</b> seguidores</span>
          {books && <span><b className="text-green-500">{books.filter(b=>b.status==='read').length}</b> leídos</span>}
        </div>

        {/* Recommendation input */}
        <div className="flex gap-2 mt-3">
          <input value={recMsg} onChange={e=>setRecMsg(e.target.value)} maxLength={120}
            placeholder="Recomendarle un libro…"
            className="flex-1 px-3 py-2 bg-slate-100 rounded-full text-xs text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"/>
          <button onClick={sendRec} disabled={!recMsg.trim()||sending}
            className="w-9 h-9 bg-amber-500 text-white rounded-full flex items-center justify-center disabled:opacity-40 flex-shrink-0">
            {sent ? '✓' : <Send size={13}/>}
          </button>
        </div>
      </div>

      {/* Main tabs */}
      <div className="bg-white flex border-b border-slate-100 flex-shrink-0 sticky top-0 z-10">
        {[
          { key:'library', label:'Biblioteca' },
          { key:'read',    label:`Leídos${books?.filter(b=>b.status==='read').length>0?` (${books.filter(b=>b.status==='read').length})`:''}`},
          { key:'reviews', label:`Reseñas${reviews.length>0?` (${reviews.length})`:''}` },
          { key:'authors', label:`Escritores${favAuthors.length>0?` (${favAuthors.length})`:''}` },
          { key:'bible',   label:'📖 Biblia' },
        ].map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-all ${tab===t.key?'text-amber-500 border-b-2 border-amber-500':'text-slate-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4">

        {/* ── BIBLIOTECA ── */}
        {tab==='library' && (
          <>
            {!showLibrary ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                <p className="text-4xl mb-3">🔒</p>
                <p className="font-semibold text-slate-500">Biblioteca privada</p>
                <p className="text-xs mt-1">Este usuario eligió no mostrar sus libros</p>
              </div>
            ) : books===null ? (
              <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-amber-400"/></div>
            ) : (
              <>
                <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none">
                  {BOOK_TABS.map(t => (
                    <button key={t.key} onClick={()=>setBookTab(t.key)}
                      className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${bookTab===t.key?'bg-amber-500 text-white':'bg-slate-100 text-slate-500'}`}>
                      {t.label} <span className={bookTab===t.key?'text-white/70':'text-slate-400'}>({t.list.length})</span>
                    </button>
                  ))}
                </div>
                {activeBookList.length===0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">Sin libros en esta sección</p>
                ) : (
                  <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                    {activeBookList.map(b => (
                      <div key={b.id} className="flex flex-col cursor-pointer" onClick={() => setViewBook(b)}>
                        <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-sm">
                          <BookCoverUpload
                            bookId={b.bookId}
                            src={b.customThumbnail || b.thumbnail}
                            title={b.title}
                            className="rounded-2xl"
                          />
                        </div>
                        <p className="text-[10px] font-semibold text-slate-700 line-clamp-2 mt-1.5 leading-tight">{b.title}</p>
                        {b.authors?.[0] && <p className="text-[9px] text-slate-400 line-clamp-1">{b.authors[0]}</p>}
                        {b.rating>0 && <p className="text-[9px] text-amber-500">{'★'.repeat(b.rating)}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── LEÍDOS con hilo de comentarios ── */}
        {tab==='read' && (() => {
          const readBooks = books?.filter(b => b.status === 'read') || []
          if (!books) return <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-amber-400"/></div>
          if (!showLibrary) return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
              <p className="text-4xl mb-3">🔒</p>
              <p className="font-semibold text-slate-500">Biblioteca privada</p>
            </div>
          )
          if (readBooks.length === 0) return (
            <p className="text-xs text-slate-400 text-center py-12">Este usuario no tiene libros leídos todavía</p>
          )
          return (
            <div className="flex flex-col gap-3">
              {readBooks.map(b => (
                <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  {/* Book info */}
                  <div className="flex gap-3 p-3">
                    <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                      <BookCoverUpload
                        bookId={b.bookId}
                        src={b.customThumbnail || b.thumbnail}
                        title={b.title}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-2">{b.title}</p>
                      {b.authors?.[0] && <p className="text-xs text-slate-400 mt-0.5">{b.authors[0]}</p>}
                      {b.rating > 0 && (
                        <p className="text-xs text-amber-500 mt-1">
                          {'★'.repeat(b.rating)}{'☆'.repeat(5 - b.rating)}
                        </p>
                      )}
                      {b.review && (
                        <p className="text-xs text-slate-500 italic mt-1 line-clamp-2">"{b.review}"</p>
                      )}
                    </div>
                    <button onClick={() => setLoanBook(b)}
                      className="self-start flex-shrink-0 px-2 py-1 bg-slate-100 rounded-full text-[9px] text-slate-500 font-medium hover:bg-amber-50 hover:text-amber-600 transition-all">
                      Pedir
                    </button>
                  </div>

                  {/* Comment thread */}
                  <BookThread
                    ownerUid={targetUser.uid}
                    bookId={b.bookId}
                    myUid={me?.uid}
                    myProfile={profile}
                  />
                </div>
              ))}
            </div>
          )
        })()}

        {/* ── ESCRITORES FAVORITOS ── */}
        {tab==='authors' && (
          <>
            {authorsLoading && <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-amber-400"/></div>}
            {!authorsLoading && favAuthors.length===0 && (
              <p className="text-xs text-slate-400 text-center py-12">No tiene escritores favoritos todavía</p>
            )}
            <div className="flex flex-col gap-3">
              {favAuthors.map(a => (
                <div key={a.id} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex gap-3 items-center">
                  {a.photoUrl ? (
                    <img src={a.photoUrl} alt={a.name}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm"
                      onError={e => e.target.style.display='none'} />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={16} className="text-slate-300"/>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{a.name}</p>
                    {a.topWork && <p className="text-xs text-slate-400 italic line-clamp-1">"{a.topWork}"</p>}
                    {a.workCount>0 && <p className="text-[10px] text-slate-300 mt-0.5">{a.workCount} obras</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── RESEÑAS ── */}
        {tab==='reviews' && (
          <>
            {reviewsLoading && <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-amber-400"/></div>}
            {!reviewsLoading && reviews.length===0 && (
              <p className="text-xs text-slate-400 text-center py-12">No ha publicado reseñas todavía</p>
            )}
            <div className="flex flex-col gap-3">
              {reviews.map(r => (
                <div key={r.id} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
                  <div className="flex gap-2.5 items-center mb-2">
                    {r.bookThumbnail
                      ? <img src={r.bookThumbnail} alt="" className="w-9 h-12 object-cover rounded-xl flex-shrink-0 shadow-sm"/>
                      : <div className="w-9 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0"><BookOpen size={11} className="text-slate-300"/></div>
                    }
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1">{r.bookTitle}</p>
                      {r.bookAuthors?.[0] && <p className="text-[10px] text-slate-400">{r.bookAuthors[0]}</p>}
                      {r.rating>0 && (
                        <p className="text-[11px] text-amber-500 mt-0.5">
                          {'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}
                          <span className="text-slate-400 text-[10px] ml-1">
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

        {/* ── BIBLIA ── */}
        {tab==='bible' && (() => {
          const bibleBook = books?.find(b => isBibleBook(b) && b.biblePlan)
          if (!books) return <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-amber-400"/></div>
          if (!bibleBook) return (
            <p className="text-xs text-slate-400 text-center py-12">Este lector no tiene plan bíblico activo</p>
          )
          const pct = Math.round((countCompleted(bibleBook.bibleProgress||{}) / TOTAL_CHAPTERS) * 100)
          return (
            <div className="flex flex-col gap-3">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-amber-800">Santa Biblia</p>
                  <p className="text-sm font-bold text-amber-500">{pct}%</p>
                </div>
                <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-amber-500 rounded-full" style={{width:`${pct}%`}}/>
                </div>
                <p className="text-xs text-amber-600">
                  {countCompleted(bibleBook.bibleProgress||{})} de {TOTAL_CHAPTERS} capítulos leídos
                </p>
                {bibleBook.currentVerse && (
                  <p className="text-xs text-slate-500 mt-1.5">📖 Leyendo: {bibleBook.currentVerse}</p>
                )}
                {bibleBook.planNote && (
                  <p className="text-xs text-slate-500 italic mt-1">"{bibleBook.planNote}"</p>
                )}
                <button onClick={() => setViewBible(bibleBook)}
                  className="mt-3 w-full py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold active:scale-95 transition-all">
                  Ver plan completo
                </button>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Book detail — abre al tocar un libro del perfil */}
      {viewBook && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[64]" onClick={() => setViewBook(null)} />
          <BookDetailSheet
            book={{ ...viewBook, ...(myBooksMap[viewBook.bookId] || {}) }}
            onClose={() => setViewBook(null)}
            onAdd={!myBooksMap[viewBook.bookId]
              ? (book, status) => addToMyLibrary(me.uid, book.bookId, {
                  title: book.title, authors: book.authors,
                  thumbnail: book.thumbnail, description: book.description,
                  pageCount: book.pageCount, publishedDate: book.publishedDate,
                  categories: book.categories, status, isFavorite: false, inLibrary: true,
                })
              : undefined
            }
            onCreatePlan={!myBooksMap[viewBook.bookId]
              ? async (pages, days) => {
                  await addToMyLibrary(me.uid, viewBook.bookId, {
                    title: viewBook.title, authors: viewBook.authors,
                    thumbnail: viewBook.thumbnail, description: viewBook.description,
                    pageCount: viewBook.pageCount || pages, publishedDate: viewBook.publishedDate,
                    categories: viewBook.categories, status: 'library', isFavorite: false, inLibrary: true,
                  })
                  await createReadingPlan(me.uid, viewBook.bookId, pages, days)
                }
              : undefined
            }
          />
        </>
      )}

      {/* Bible plan view (readonly) */}
      {viewBible && (
        <BiblePlanView
          book={viewBible}
          uid={null}
          onClose={() => setViewBible(null)}
          readonly={true}
        />
      )}

      {/* Loan modal */}
      {loanBook && (
        <LoanModal
          book={loanBook}
          onSend={msg => sendLoanRequest(me.uid, profile, fullUser.uid, loanBook, msg)}
          onClose={() => setLoanBook(null)}
        />
      )}
    </div>
  )
}
