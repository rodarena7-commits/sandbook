import { useState, useEffect } from 'react'
import { X, User, Loader2, CalendarDays } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'

export default function PeopleListSheet({ title, uids, onClose, emptyText, onSelectUser, onStartPlan }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const results = await Promise.all(
        (uids || []).slice(0, 50).map(async uid => {
          try {
            const snap = await getDoc(doc(db, 'users', uid))
            return snap.exists() ? { uid, ...snap.data() } : { uid, displayName: 'Lector' }
          } catch { return { uid, displayName: 'Lector' } }
        })
      )
      if (!cancelled) { setProfiles(results); setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [uids])

  return (
    <div className="fixed inset-0 z-[210] flex items-end" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-sm mx-auto bg-white rounded-t-3xl shadow-2xl p-5 pb-8 max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={22} className="animate-spin text-slate-300" />
            </div>
          ) : profiles.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">{emptyText}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {profiles.map(p => (
                <button
                  key={p.uid}
                  onClick={() => onSelectUser?.(p)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 text-left transition-colors"
                >
                  {p.photoURL
                    ? <img src={p.photoURL} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-slate-300" />
                      </div>}
                  <span className="text-sm font-medium text-slate-700 line-clamp-1">{p.displayName || 'Lector'}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {onStartPlan && (
          <button
            onClick={onStartPlan}
            className="mt-3 flex-shrink-0 flex items-center justify-center gap-2 w-full py-3 bg-amber-500 text-white rounded-2xl text-sm font-semibold shadow-sm active:scale-95 transition-all"
          >
            <CalendarDays size={15} /> Crear mi plan de lectura
          </button>
        )}
      </div>
    </div>
  )
}
