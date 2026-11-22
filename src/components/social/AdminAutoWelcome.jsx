import { useEffect, useState } from 'react'
import { HeartHandshake, Check, Loader2 } from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { DEFAULT_WELCOME_TEXT } from '../../utils/welcome'

// Configura appConfig/settings.autoWelcome: el mensaje que cada usuario nuevo recibe
// desde la cuenta del administrador, y si esa cuenta lo sigue automáticamente.
export default function AdminAutoWelcome({ myUid, appConfig }) {
  const cfg = appConfig?.autoWelcome || {}
  const [enabled, setEnabled] = useState(cfg.enabled !== false)
  const [follow, setFollow]   = useState(cfg.follow !== false)
  const [text, setText]       = useState(cfg.text || DEFAULT_WELCOME_TEXT)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  // Si la config llega después del primer render (snapshot), la tomamos
  useEffect(() => {
    if (!appConfig?.autoWelcome) return
    setEnabled(appConfig.autoWelcome.enabled !== false)
    setFollow(appConfig.autoWelcome.follow !== false)
    setText(appConfig.autoWelcome.text || DEFAULT_WELCOME_TEXT)
  }, [appConfig?.autoWelcome?.text, appConfig?.autoWelcome?.enabled, appConfig?.autoWelcome?.follow])

  async function save(next = {}) {
    setSaving(true)
    setSaved(false)
    try {
      await setDoc(doc(db, 'appConfig', 'settings'), {
        autoWelcome: { enabled, follow, text: text.trim() || DEFAULT_WELCOME_TEXT, fromUid: myUid, ...next },
      }, { merge: true })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  function Toggle({ value, onChange, label }) {
    return (
      <button onClick={() => onChange(!value)} className="flex items-center justify-between w-full py-1.5 text-left">
        <span className="text-sm text-slate-700">{label}</span>
        <span className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-amber-500' : 'bg-slate-200'}`}>
          <span className="block w-5 h-5 bg-white rounded-full shadow-sm mt-0.5 transition-all" style={{ marginLeft: value ? '18px' : '2px' }} />
        </span>
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-2">
      <h3 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-2 uppercase tracking-wide">
        <HeartHandshake size={13} className="text-amber-500" /> Bienvenida automática
      </h3>
      <p className="text-[11px] text-slate-400 mb-3">
        Cada usuario nuevo recibe este mensaje privado desde tu cuenta apenas se registra.
        <b className="text-slate-500"> {'{nombre}'}</b> se reemplaza por su nombre.
      </p>

      <Toggle value={enabled} onChange={v => { setEnabled(v); save({ enabled: v }) }} label="Enviar bienvenida a usuarios nuevos" />
      <Toggle value={follow} onChange={v => { setFollow(v); save({ follow: v }) }} label="Seguirlos automáticamente" />

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={!enabled}
        rows={8}
        className="w-full mt-2 px-3 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-400 resize-y disabled:opacity-50"
      />

      <button
        onClick={() => save()}
        disabled={saving || !enabled}
        className={`w-full mt-2 py-2.5 rounded-2xl text-sm font-semibold shadow-sm disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-1.5 ${saved ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <><Check size={14} /> Guardado</> : 'Guardar texto'}
      </button>
    </div>
  )
}
