import { useState } from 'react'
import { X, Check, ChevronRight, User, Eye, EyeOff, MessageCircle, Bell, BellOff } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'

const MESSAGING_OPTIONS = [
  { key: 'everyone',  label: 'Todos',                  desc: 'Cualquier usuario puede escribirte' },
  { key: 'followers', label: 'Solo seguidores',         desc: 'Quienes te siguen pueden escribirte' },
  { key: 'following', label: 'Solo usuarios que sigo',  desc: 'Solo quienes vos seguís' },
  { key: 'nobody',    label: 'Nadie',                   desc: 'Nadie puede enviarte mensajes' },
]

function Toggle({ value, onChange, label, description, icon: Icon }) {
  return (
    <button onClick={() => onChange(!value)}
      className="flex items-center gap-3 w-full py-3 text-left">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${value ? 'bg-amber-100' : 'bg-slate-100'}`}>
        <Icon size={18} className={value ? 'text-amber-600' : 'text-slate-400'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-amber-500' : 'bg-slate-200'}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow-sm mt-0.5 transition-all ${value ? 'ml-5.5' : 'ml-0.5'}`}
          style={{ marginLeft: value ? '22px' : '2px' }} />
      </div>
    </button>
  )
}

export default function SettingsSheet({ profile, uid, onUpdate, onClose }) {
  const [displayName, setDisplayName]     = useState(profile?.displayName || '')
  const [savingName, setSavingName]       = useState(false)
  const [nameSaved, setNameSaved]         = useState(false)

  const [showLibrary, setShowLibrary]     = useState(profile?.showLibrary !== false)
  const [notifsEnabled, setNotifsEnabled] = useState(profile?.notificationsEnabled !== false)
  const [msgPrivacy, setMsgPrivacy]       = useState(profile?.messagingPrivacy || 'everyone')

  async function save(field, value) {
    await updateDoc(doc(db, 'users', uid), { [field]: value })
    onUpdate({ [field]: value })
  }

  async function saveName() {
    if (!displayName.trim() || displayName === profile?.displayName) return
    setSavingName(true)
    await save('displayName', displayName.trim())
    setSavingName(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  async function handleToggle(field, value, setter) {
    setter(value)
    await save(field, value)
  }

  async function handleMsgPrivacy(key) {
    setMsgPrivacy(key)
    await save('messagingPrivacy', key)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-bold text-slate-800">Configuración</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-10">

          {/* Username */}
          <div className="py-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Nombre de usuario</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  value={displayName}
                  onChange={e => { setDisplayName(e.target.value); setNameSaved(false) }}
                  maxLength={40}
                  placeholder="Tu nombre"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <button
                onClick={saveName}
                disabled={!displayName.trim() || displayName === profile?.displayName || savingName}
                className={`px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center gap-1.5 ${nameSaved ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}
              >
                {nameSaved ? <><Check size={14} /> Guardado</> : 'Guardar'}
              </button>
            </div>
          </div>

          {/* Privacy */}
          <div className="py-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Privacidad</p>
            <Toggle
              value={showLibrary}
              onChange={v => handleToggle('showLibrary', v, setShowLibrary)}
              label="Mostrar libros leídos"
              description="Otros usuarios pueden ver tu biblioteca"
              icon={showLibrary ? Eye : EyeOff}
            />
            <Toggle
              value={notifsEnabled}
              onChange={v => handleToggle('notificationsEnabled', v, setNotifsEnabled)}
              label="Notificaciones"
              description="Recibir recomendaciones y mensajes"
              icon={notifsEnabled ? Bell : BellOff}
            />
          </div>

          {/* Messaging privacy */}
          <div className="py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              <span className="flex items-center gap-1.5"><MessageCircle size={11} /> ¿Quién puede enviarte mensajes?</span>
            </p>
            <div className="flex flex-col gap-1.5">
              {MESSAGING_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => handleMsgPrivacy(opt.key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                    msgPrivacy === opt.key ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                  }`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${msgPrivacy === opt.key ? 'border-amber-500' : 'border-slate-300'}`}>
                    {msgPrivacy === opt.key && <div className="w-2 h-2 bg-amber-500 rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${msgPrivacy === opt.key ? 'text-amber-700' : 'text-slate-700'}`}>{opt.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
