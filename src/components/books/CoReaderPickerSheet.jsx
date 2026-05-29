import { useState } from 'react'
import { X, Search, User } from 'lucide-react'
import { useAllUsers } from '../../hooks/useAllUsers'

export default function CoReaderPickerSheet({ myUid, existingUids = [], onSelect, onClose }) {
  const { users, loading } = useAllUsers(myUid)
  const [search, setSearch] = useState('')

  const filtered = users.filter(u => {
    if (existingUids.includes(u.uid)) return false
    const q = search.toLowerCase()
    return !q || (u.displayName || '').toLowerCase().includes(q)
  })

  return (
    <div className="fixed inset-0 z-[70] flex items-end">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-bold text-slate-800">Leer con…</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar usuario…"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3">
          {loading && <p className="text-xs text-slate-400 text-center py-6">Cargando usuarios…</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">Sin resultados</p>
          )}
          <div className="flex flex-col gap-1">
            {filtered.map(u => (
              <button
                key={u.uid}
                onClick={() => onSelect({ uid: u.uid, displayName: u.displayName || 'Usuario', photoURL: u.photoURL || null })}
                className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 hover:bg-amber-50 rounded-2xl transition-all text-left active:scale-95"
              >
                {u.photoURL ? (
                  <img src={u.photoURL} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-slate-200" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-slate-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{u.displayName || 'Usuario'}</p>
                  {u.online && <p className="text-[10px] text-green-500">● En línea</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
