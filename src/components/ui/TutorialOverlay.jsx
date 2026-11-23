import { useState } from 'react'
import { X, ChevronRight, BookOpen, Search, Users, MessageCircle, User, CalendarDays, ShoppingBag, Camera, Plus, Globe, Check } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { LANGUAGES } from '../../utils/languages'

const SEEN_KEY = 'sandbook_tutorial_v1'

// Textos en translations.js (tut_<id>_title / tut_<id>_desc), así se ve en el idioma del usuario.
// El paso "lang" muestra los idiomas para cambiarlo ahí mismo.
const STEPS = [
  { id: 'welcome',   icon: BookOpen,      color: 'bg-amber-500',  img: '📚' },
  { id: 'lang',      icon: Globe,         color: 'bg-cyan-600',   img: '🌍' },
  { id: 'search',    icon: Search,        color: 'bg-blue-500',   img: '🔍' },
  { id: 'scan',      icon: Camera,        color: 'bg-sky-500',    img: '📷' },
  { id: 'save',      icon: Plus,          color: 'bg-orange-500', img: '➕' },
  { id: 'authors',   icon: User,          color: 'bg-pink-500',   img: '✍️' },
  { id: 'library',   icon: BookOpen,      color: 'bg-green-500',  img: '📖' },
  { id: 'plans',     icon: CalendarDays,  color: 'bg-purple-500', img: '🗓️' },
  { id: 'community', icon: Users,         color: 'bg-rose-500',   img: '👥' },
  { id: 'messages',  icon: MessageCircle, color: 'bg-indigo-500', img: '💬' },
  { id: 'market',    icon: ShoppingBag,   color: 'bg-teal-500',   img: '🛒' },
]

export default function TutorialOverlay({ onDone }) {
  const { t, language, changeLanguage } = useAuth()
  const [step,    setStep]    = useState(0)
  const [visible, setVisible] = useState(() => !localStorage.getItem(SEEN_KEY))

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  function finish() {
    localStorage.setItem(SEEN_KEY, '1')
    setVisible(false)
    onDone?.()
  }

  if (!visible) return null

  const s = STEPS[step]
  const Icon = s.icon
  const isLang = s.id === 'lang'

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center px-4 bg-black/60">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header coloreado */}
        <div className={`${s.color} px-6 ${isLang ? 'pt-6 pb-6' : 'pt-8 pb-10'} flex flex-col items-center text-center relative flex-shrink-0`}>
          <button onClick={finish} aria-label={t('tut_skip')} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 text-white">
            <X size={13} />
          </button>
          <div className={`${isLang ? 'text-4xl' : 'text-5xl'} mb-2`}>{s.img}</div>
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
            <Icon size={20} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-white leading-tight">{t(`tut_${s.id}_title`)}</h2>
        </div>

        {/* Descripción */}
        <div className="px-6 pt-5 pb-4 overflow-y-auto">
          <p className="text-sm text-slate-600 text-center leading-relaxed">{t(`tut_${s.id}_desc`)}</p>

          {isLang && (
            <div className="grid grid-cols-2 gap-1.5 mt-4">
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => changeLanguage(l.code)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all ${
                    language === l.code ? 'bg-cyan-50 border border-cyan-400' : 'bg-slate-50 border border-transparent'
                  }`}>
                  <span className="text-base leading-none">{l.flag}</span>
                  <span className={`flex-1 text-[13px] ${language === l.code ? 'font-bold text-cyan-700' : 'text-slate-700'}`}>{l.name}</span>
                  {language === l.code && <Check size={13} className="text-cyan-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dots indicadores */}
        <div className="flex justify-center gap-1.5 pb-4 flex-shrink-0">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-amber-500' : 'w-1.5 bg-slate-200'}`} />
          ))}
        </div>

        {/* Botones */}
        <div className="flex gap-2 px-6 pb-6 flex-shrink-0">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-medium">
              {t('tut_back')}
            </button>
          )}
          {step === 0 && (
            <button onClick={finish}
              className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-2xl text-sm font-medium">
              {t('tut_skip')}
            </button>
          )}
          <button onClick={next}
            className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-sm font-semibold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1">
            {step === STEPS.length - 1 ? t('tut_start') : t('tut_next')}
            {step < STEPS.length - 1 && <ChevronRight size={15} className="rtl:rotate-180" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook para re-abrir el tutorial desde Settings
export function useTutorial() {
  function resetTutorial() { localStorage.removeItem(SEEN_KEY) }
  function hasSeenTutorial() { return !!localStorage.getItem(SEEN_KEY) }
  return { resetTutorial, hasSeenTutorial }
}
