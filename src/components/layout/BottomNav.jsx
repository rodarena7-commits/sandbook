import { BookOpen, Search, Users, Gift, MessageCircle, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const TABS = [
  { id: 'library',  translationKey: 'nav_library',  icon: BookOpen       },
  { id: 'search',   translationKey: 'nav_search',   icon: Search         },
  { id: 'social',   translationKey: 'nav_social',   icon: Users          },
  { id: 'bookfree', translationKey: 'nav_bookfree', icon: Gift           },
  { id: 'messages', translationKey: 'nav_messages', icon: MessageCircle  },
  { id: 'profile',  translationKey: 'nav_profile',  icon: User           },
]

export default function BottomNav({ active, onChange, badges = {} }) {
  const { t } = useAuth()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50">
      <div className="flex items-center justify-around w-full max-w-4xl mx-auto">
        {TABS.map(({ id, translationKey, icon: Icon }) => {
          const isActive = active === id
          const badge = badges[id] || 0
          return (
            <button key={id} onClick={() => onChange(id)}
              className="flex flex-col items-center justify-center flex-1 py-2 gap-0.5 transition-all">
              <div className="relative">
                <Icon size={21} strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? 'text-amber-500' : 'text-slate-400'} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-semibold tracking-wide ${isActive ? 'text-amber-500' : 'text-slate-400'}`}>
                {t(translationKey)}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
