import { useState, useRef } from 'react'
import {
  Plus, X, BookOpen, ShoppingBag, Send, Trash2,
  MessageCircle, Loader2, Tag, ChevronDown, Check,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  useMarketplace, useListingComments,
  createListing, deleteListing, markAsSold, addComment, deleteComment,
} from '../hooks/useMarketplace'
import { useConversations } from '../hooks/useConversations'

// ── Helpers ────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts?.seconds) return ''
  const m = Math.floor((Date.now() - ts.seconds * 1000) / 60000)
  if (m < 1)  return 'ahora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function Avatar({ photoURL, name, size = 8 }) {
  const init = (name || '?')[0].toUpperCase()
  if (photoURL) return <img src={photoURL} alt="" className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />
  return (
    <div className={`w-${size} h-${size} rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs flex-shrink-0`}>
      {init}
    </div>
  )
}

// ── Detalle de un listado ──────────────────────────────────
function ListingDetail({ listing, myUid, myProfile, onClose, onMessage }) {
  const { comments, loading } = useListingComments(listing.id)
  const [text, setText]     = useState('')
  const [sending, setSend]  = useState(false)
  const endRef = useRef(null)

  async function handleComment(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSend(true)
    await addComment(listing.id, myUid, myProfile, text)
    setText('')
    setSend(false)
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const isOwner = listing.uid === myUid

  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow-sm flex items-center gap-3 px-4 pt-12 pb-3 flex-shrink-0">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <X size={16} />
        </button>
        <p className="font-bold text-slate-800 flex-1 line-clamp-1">{listing.bookTitle}</p>
        {listing.status === 'sold' && (
          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Vendido</span>
        )}
      </div>

      <div className="overflow-y-auto flex-1 px-4 py-4">
        {/* Imagen del libro */}
        {listing.bookImage ? (
          <img src={listing.bookImage} alt="" className="w-full max-h-56 object-contain rounded-2xl mb-4 bg-slate-100" />
        ) : (
          <div className="w-full h-40 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen size={32} className="text-slate-300" />
          </div>
        )}

        {/* Info del libro */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
          <p className="font-bold text-slate-800 text-base">{listing.bookTitle}</p>
          {listing.bookAuthor && <p className="text-sm text-slate-500 mt-0.5">{listing.bookAuthor}</p>}
          {listing.description && (
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{listing.description}</p>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <div>
              <p className="text-xl font-bold text-amber-600">
                {listing.currency === 'USD' ? 'USD ' : '$ '}
                {Number(listing.price).toLocaleString('es-AR')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Avatar photoURL={listing.photoURL} name={listing.displayName} size={6} />
              <p className="text-xs text-slate-500">{listing.displayName}</p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 mb-4">
          {!isOwner && (
            <button
              onClick={() => onMessage(listing)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 text-white rounded-2xl text-sm font-semibold shadow-sm active:scale-95 transition-all"
            >
              <MessageCircle size={15} /> Contactar vendedor
            </button>
          )}
          {isOwner && listing.status === 'active' && (
            <button
              onClick={() => markAsSold(listing.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-2xl text-sm font-semibold active:scale-95 transition-all"
            >
              <Check size={15} /> Marcar como vendido
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => { deleteListing(listing.id); onClose() }}
              className="w-12 flex items-center justify-center py-3 bg-red-50 text-red-400 rounded-2xl active:scale-95 transition-all"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {/* Comentarios */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
            Comentarios ({comments.length})
          </p>
          {loading && <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-amber-400" /></div>}
          {!loading && comments.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">Sin comentarios aún. ¡Sé el primero!</p>
          )}
          <div className="flex flex-col gap-3 mb-4">
            {comments.map(c => (
              <div key={c.id} className="flex gap-2 items-start">
                <Avatar photoURL={c.photoURL} name={c.displayName} size={7} />
                <div className="flex-1 bg-white rounded-2xl px-3 py-2 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-xs font-semibold text-slate-700">{c.displayName}</p>
                    <p className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</p>
                    {(c.uid === myUid || listing.uid === myUid) && (
                      <button onClick={() => deleteComment(listing.id, c.id)} className="ml-auto text-slate-200 hover:text-red-400">
                        <X size={11} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{c.text}</p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </div>
      </div>

      {/* Input comentario */}
      <form onSubmit={handleComment} className="bg-white border-t border-slate-100 px-4 py-3 flex gap-2 flex-shrink-0">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Escribí un comentario…"
          className="flex-1 px-4 py-2.5 bg-slate-100 rounded-full text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button type="submit" disabled={!text.trim() || sending}
          className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 active:scale-90 transition-all flex-shrink-0">
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </form>
    </div>
  )
}

// ── Formulario para publicar ───────────────────────────────
function CreateListingSheet({ onSave, onClose }) {
  const [bookTitle,   setTitle]   = useState('')
  const [bookAuthor,  setAuthor]  = useState('')
  const [description, setDesc]    = useState('')
  const [price,       setPrice]   = useState('')
  const [currency,    setCurrency] = useState('ARS')
  const [bookImage,   setImage]   = useState(null)
  const [saving,      setSaving]  = useState(false)
  const fileRef = useRef(null)

  function handleImage(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const img = new window.Image()
    const url = URL.createObjectURL(f)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, 800 / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      setImage(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.src = url
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!bookTitle.trim() || !price) return
    setSaving(true)
    await onSave({ bookTitle: bookTitle.trim(), bookAuthor: bookAuthor.trim(), description: description.trim(), price, currency, bookImage })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-5xl mx-auto bg-white rounded-t-3xl shadow-2xl p-5 pb-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-amber-500" />
            <h3 className="font-bold text-slate-800">Publicar libro</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Imagen */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Foto del libro</label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            {bookImage ? (
              <div className="relative">
                <img src={bookImage} alt="" className="w-full h-40 object-contain bg-slate-50 rounded-2xl" />
                <button type="button" onClick={() => setImage(null)}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full h-28 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-all">
                <BookOpen size={22} />
                <span className="text-xs">Tocá para agregar foto</span>
              </button>
            )}
          </div>

          {/* Título */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Título del libro *</label>
            <input value={bookTitle} onChange={e => setTitle(e.target.value)} required
              placeholder="ej: El nombre del viento"
              className="w-full px-4 py-3 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400" />
          </div>

          {/* Autor */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Autor</label>
            <input value={bookAuthor} onChange={e => setAuthor(e.target.value)}
              placeholder="ej: Patrick Rothfuss"
              className="w-full px-4 py-3 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400" />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Descripción</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)}
              rows={3} maxLength={300}
              placeholder="Estado del libro, edición, por qué lo vendés…"
              className="w-full px-4 py-3 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
          </div>

          {/* Precio */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Precio *</label>
            <div className="flex gap-2">
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="px-3 py-3 bg-slate-100 rounded-2xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400">
                <option value="ARS">$ ARS</option>
                <option value="USD">USD</option>
              </select>
              <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} required
                placeholder="0"
                className="flex-1 px-4 py-3 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          </div>

          <button type="submit" disabled={!bookTitle.trim() || !price || saving}
            className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Publicando…</> : <><Tag size={15} /> Publicar</>}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Tarjeta de listado ─────────────────────────────────────
function ListingCard({ listing, onOpen }) {
  return (
    <button onClick={() => onOpen(listing)}
      className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-left active:bg-slate-50 transition-all w-full">
      {listing.bookImage ? (
        <img src={listing.bookImage} alt="" className="w-16 h-20 object-cover rounded-xl flex-shrink-0 shadow-sm" />
      ) : (
        <div className="w-16 h-20 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <BookOpen size={18} className="text-slate-300" />
        </div>
      )}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-start justify-between gap-1">
          <p className="font-semibold text-slate-800 text-sm line-clamp-2 leading-tight">{listing.bookTitle}</p>
          {listing.status === 'sold' && (
            <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">Vendido</span>
          )}
        </div>
        {listing.bookAuthor && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{listing.bookAuthor}</p>}
        {listing.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{listing.description}</p>}
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm font-bold text-amber-600">
            {listing.currency === 'USD' ? 'USD ' : '$ '}
            {Number(listing.price).toLocaleString('es-AR')}
          </p>
          <div className="flex items-center gap-1">
            <Avatar photoURL={listing.photoURL} name={listing.displayName} size={5} />
            <p className="text-[10px] text-slate-400 line-clamp-1">{listing.displayName}</p>
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Página principal del Marketplace ──────────────────────
export default function MarketplacePage({ onStartChat }) {
  const { user, profile } = useAuth()
  const { listings, loading } = useMarketplace()
  const { sendMessage } = useConversations(user?.uid)
  const [showCreate,  setShowCreate]  = useState(false)
  const [selected,    setSelected]    = useState(null)
  const [filterOwn,   setFilterOwn]   = useState(false)

  const visible = filterOwn
    ? listings.filter(l => l.uid === user?.uid)
    : listings

  async function handleSave(data) {
    await createListing(user.uid, profile, data)
  }

  async function handleMessage(listing) {
    if (!user || listing.uid === user.uid) return
    const sellerProfile = { displayName: listing.displayName, photoURL: listing.photoURL }
    await sendMessage(user.uid, profile, listing.uid, sellerProfile,
      `Hola! Vi tu publicación de "${listing.bookTitle}" en el Marketplace de Sandbook. ¿Está disponible?`)
    onStartChat?.({ uid: listing.uid, displayName: listing.displayName, photoURL: listing.photoURL })
    setSelected(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingBag size={16} className="text-amber-500" />
          <p className="font-bold text-slate-800 text-sm">Marketplace</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOwn(v => !v)}
            className={`text-[11px] px-3 py-1 rounded-full font-medium transition-all ${filterOwn ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}
          >
            Mis publicaciones
          </button>
          {user && (
            <button onClick={() => setShowCreate(true)}
              className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all">
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-y-auto flex-1 px-4 py-3">
        {loading && <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-400" /></div>}

        {!loading && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <ShoppingBag size={44} className="mb-4 text-slate-200" />
            <p className="font-semibold text-slate-500">
              {filterOwn ? 'No publicaste ningún libro aún' : 'El Marketplace está vacío'}
            </p>
            <p className="text-xs mt-1">
              {filterOwn ? 'Tocá + para publicar un libro' : 'Sé el primero en publicar un libro'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {visible.map(l => (
            <ListingCard key={l.id} listing={l} onOpen={setSelected} />
          ))}
        </div>
      </div>

      {/* Detalle del listado */}
      {selected && (
        <ListingDetail
          listing={selected}
          myUid={user?.uid}
          myProfile={profile}
          onClose={() => setSelected(null)}
          onMessage={handleMessage}
        />
      )}

      {/* Formulario crear */}
      {showCreate && (
        <CreateListingSheet
          onSave={handleSave}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
