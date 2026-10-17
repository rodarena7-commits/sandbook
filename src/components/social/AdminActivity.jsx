import { useEffect, useMemo, useState } from 'react'
import { Loader2, X, LogIn, Search, MousePointerClick, Monitor, BookPlus, MessageCircle, Smartphone, Globe } from 'lucide-react'
import { collection, onSnapshot, orderBy, query, where, limit } from 'firebase/firestore'
import { db } from '../../firebase'

const MAX_EVENTS = 400

const SCREEN_NAMES = {
  library: 'Biblioteca', search: 'Buscar', social: 'Comunidad', bookfree: 'Bookfree',
  messages: 'Mensajes', profile: 'Perfil',
}
const SEARCH_SOURCES = { libros: 'libros', bookfree: 'Bookfree', autores: 'autores' }
const MESSAGE_KINDS = { text: 'un mensaje', voice: 'un mensaje de voz', call: 'una videollamada', ebook: 'un ebook' }

const FILTERS = [
  { key: 'all',     label: 'Todo' },
  { key: 'session', label: 'Entradas' },
  { key: 'search',  label: 'Búsquedas' },
  { key: 'screen',  label: 'Pantallas' },
  { key: 'tap',     label: 'Toques' },
  { key: 'action',  label: 'Acciones' },
]

function millis(ts) {
  return ts?.toMillis?.() || (ts?.seconds || 0) * 1000
}

function timeLabel(ts) {
  const ms = millis(ts)
  if (!ms) return ''
  const d = new Date(ms)
  const today = new Date().toDateString() === d.toDateString()
  return today
    ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function describe(e) {
  const where = SCREEN_NAMES[e.screen] || e.screen
  switch (e.type) {
    case 'session':      return { icon: LogIn, text: 'entró a la app' }
    case 'screen':       return { icon: Monitor, text: `abrió ${where}` }
    case 'search':       return { icon: Search, text: <>buscó <b>«{e.query}»</b> en {SEARCH_SOURCES[e.source] || e.source}</> }
    case 'tap':          return { icon: MousePointerClick, text: <>tocó <b>«{e.label}»</b>{where ? ` en ${where}` : ''}</> }
    case 'book_add':     return { icon: BookPlus, text: <>agregó <b>«{e.title}»</b> a su biblioteca</> }
    case 'message_sent': return { icon: MessageCircle, text: `envió ${MESSAGE_KINDS[e.kind] || 'un mensaje'}` }
    default:             return { icon: MousePointerClick, text: e.type }
  }
}

function matchesFilter(e, filter) {
  if (filter === 'all') return true
  if (filter === 'action') return e.type === 'book_add' || e.type === 'message_sent'
  return e.type === filter
}

export default function AdminActivity({ users }) {
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [filter, setFilter]   = useState('all')
  const [selected, setSelected] = useState(null)   // { uid, displayName }
  const [showAllUsers, setShowAllUsers] = useState(false)

  // Últimos eventos de todos, o de un usuario puntual (ordenados en el cliente: no requiere índice)
  useEffect(() => {
    setLoading(true)
    setError(false)
    const q = selected
      ? query(collection(db, 'activity'), where('uid', '==', selected.uid), limit(MAX_EVENTS))
      : query(collection(db, 'activity'), orderBy('ts', 'desc'), limit(MAX_EVENTS))
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => millis(b.ts) - millis(a.ts))
      setEvents(list)
      setLoading(false)
    }, err => {
      console.error('AdminActivity error:', err)
      setError(true)
      setLoading(false)
    })
  }, [selected?.uid])

  const ranking = useMemo(() =>
    [...users]
      .filter(u => u.sessionCount > 0)
      .sort((a, b) => (b.sessionCount || 0) - (a.sessionCount || 0))
  , [users])

  const topSearches = useMemo(() => {
    const counts = {}
    events.filter(e => e.type === 'search' && e.query).forEach(e => {
      const k = e.query.toLowerCase()
      counts[k] = (counts[k] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [events])

  const visible = events.filter(e => matchesFilter(e, filter))
  const shownRanking = showAllUsers ? ranking : ranking.slice(0, 10)

  return (
    <div className="flex flex-col gap-3">

      {/* Entradas por usuario */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-xs font-bold text-slate-800 mb-1 uppercase tracking-wide">Entradas por usuario</h3>
        <p className="text-[11px] text-slate-400 mb-3">Cuántas veces abrió la app cada uno. Tocá un usuario para ver solo su actividad.</p>
        {ranking.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Todavía no hay entradas registradas. Se empiezan a contar desde esta versión.</p>
        ) : (
          <div className="flex flex-col">
            {shownRanking.map((u, i) => (
              <button key={u.uid} onClick={() => setSelected({ uid: u.uid, displayName: u.displayName })}
                className={`flex items-center gap-3 py-2 px-2 rounded-xl text-left ${selected?.uid === u.uid ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                <span className="w-5 text-[11px] font-bold text-slate-300 tabular-nums">{i + 1}</span>
                <span className="flex-1 min-w-0 text-sm text-slate-700 truncate">{u.displayName || 'Lector'}</span>
                <span className="text-[10px] text-slate-400">{timeLabel(u.lastSessionAt)}</span>
                <span className="text-sm font-bold text-amber-600 tabular-nums w-10 text-right">{u.sessionCount}</span>
              </button>
            ))}
            {ranking.length > 10 && (
              <button onClick={() => setShowAllUsers(v => !v)} className="text-xs text-amber-600 font-semibold mt-2">
                {showAllUsers ? 'Ver menos' : `Ver los ${ranking.length}`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Más buscado */}
      {topSearches.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">
            Más buscado {selected ? `por ${selected.displayName || 'este usuario'}` : 'últimamente'}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {topSearches.map(([q, n]) => (
              <span key={q} className="px-2.5 py-1 bg-slate-100 rounded-full text-[11px] text-slate-600">
                {q} <b className="text-amber-600">{n}</b>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actividad reciente */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Actividad reciente</h3>
          {selected && (
            <button onClick={() => setSelected(null)}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-[11px] font-semibold">
              {selected.displayName || 'Usuario'} <X size={11} />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-3">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-medium ${filter === f.key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-amber-400" /></div>}
        {error && <p className="text-xs text-red-400 text-center py-4">No se pudo cargar la actividad.</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6">Sin actividad para mostrar todavía.</p>
        )}

        <div className="flex flex-col divide-y divide-slate-50">
          {visible.map(e => {
            const { icon: Icon, text } = describe(e)
            const PlatformIcon = e.platform === 'android' ? Smartphone : Globe
            return (
              <div key={e.id} className="flex items-start gap-2.5 py-2">
                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={13} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 leading-snug">
                    {!selected && (
                      <button onClick={() => setSelected({ uid: e.uid, displayName: e.name })}
                        className="font-semibold text-slate-800 hover:text-amber-600 mr-1">
                        {e.name || 'Lector'}
                      </button>
                    )}
                    {text}
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5 flex items-center gap-1">
                    <PlatformIcon size={9} /> {e.platform === 'android' ? 'App' : 'Web'} · {timeLabel(e.ts)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        {events.length >= MAX_EVENTS && (
          <p className="text-[10px] text-slate-300 text-center mt-2">Se muestran los últimos {MAX_EVENTS} eventos.</p>
        )}
      </div>
    </div>
  )
}
