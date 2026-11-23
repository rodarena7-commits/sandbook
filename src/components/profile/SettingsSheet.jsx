import { useState } from 'react'
import { X, Check, ChevronRight, User, Eye, EyeOff, MessageCircle, Bell, BellOff, HelpCircle, Globe } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { resetSectionTours } from '../ui/SectionTour'
import { useAuth } from '../../contexts/AuthContext'
import { LANGUAGES } from '../../utils/languages'

// Textos: set_msg_<key> y set_msg_<key>_d
const MESSAGING_OPTIONS = ['everyone', 'followers', 'following', 'nobody'].map(key => ({ key }))

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
  const [toursReset, setToursReset]       = useState(false)
  const { language, changeLanguage, t }   = useAuth()

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
      <div className="w-full max-w-5xl mx-auto bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-bold text-slate-800">{t('set_title')}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-10">

          {/* Username */}
          <div className="py-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{t('set_username')}</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  value={displayName}
                  onChange={e => { setDisplayName(e.target.value); setNameSaved(false) }}
                  maxLength={40}
                  placeholder={t('set_your_name')}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <button
                onClick={saveName}
                disabled={!displayName.trim() || displayName === profile?.displayName || savingName}
                className={`px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center gap-1.5 ${nameSaved ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}
              >
                {nameSaved ? <><Check size={14} /> {t('set_saved')}</> : t('common_save')}
              </button>
            </div>
          </div>

          {/* Privacy */}
          <div className="py-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{t('set_privacy')}</p>
            <Toggle
              value={showLibrary}
              onChange={v => handleToggle('showLibrary', v, setShowLibrary)}
              label={t('set_show_library')}
              description={t('set_show_library_d')}
              icon={showLibrary ? Eye : EyeOff}
            />
            <Toggle
              value={notifsEnabled}
              onChange={v => handleToggle('notificationsEnabled', v, setNotifsEnabled)}
              label={t('set_notifications')}
              description={t('set_notifications_d')}
              icon={notifsEnabled ? Bell : BellOff}
            />
          </div>

          {/* Idioma */}
          <div className="py-4 border-b border-slate-100" data-tour="set-language">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Globe size={11} /> {t('set_language')}
            </p>
            <p className="text-[11px] text-slate-400 mb-3">{t('set_language_desc')}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => changeLanguage(l.code)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-left transition-all ${
                    language === l.code ? 'bg-amber-50 border border-amber-300' : 'bg-slate-50 border border-transparent'
                  }`}>
                  <span className="text-lg leading-none">{l.flag}</span>
                  <span className={`flex-1 text-sm ${language === l.code ? 'font-bold text-amber-700' : 'text-slate-700'}`}>{l.name}</span>
                  {language === l.code && <Check size={14} className="text-amber-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Guías */}
          <div className="py-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{t('set_guides')}</p>
            <button
              onClick={() => { resetSectionTours(); setToursReset(true) }}
              disabled={toursReset}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-slate-50 text-left disabled:opacity-80"
            >
              <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                {toursReset ? <Check size={16} className="text-green-600" /> : <HelpCircle size={16} className="text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{toursReset ? t('common_done') : t('set_guides_again')}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {toursReset ? t('set_guides_done_d') : t('set_guides_again_d')}
                </p>
              </div>
            </button>
          </div>

          {/* Messaging privacy */}
          <div className="py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              <span className="flex items-center gap-1.5"><MessageCircle size={11} /> {t('set_who_messages')}</span>
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
                    <p className={`text-sm font-medium ${msgPrivacy === opt.key ? 'text-amber-700' : 'text-slate-700'}`}>{t(`set_msg_${opt.key}`)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t(`set_msg_${opt.key}_d`)}</p>
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
