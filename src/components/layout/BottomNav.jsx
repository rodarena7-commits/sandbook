import { BookOpen, Search, Users, MessageCircle, User } from 'lucide-react'

const TABS = [
  { id: 'library',  label: 'Biblioteca', icon: BookOpen       },
  { id: 'search',   label: 'Buscar',     icon: Search         },
  { id: 'social',   label: 'Social',     icon: Users          },
  { id: 'messages', label: 'Mensajes',   icon: MessageCircle  },
  { id: 'profile',  label: 'Yo',         icon: User           },
]

export default function BottomNav({ active, onChange, badges = {} }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50">
      <div className="flex items-center justify-around w-full max-w-4xl mx-auto">
        {TABS.map(({ id, label, icon: Icon }) => {
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
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
