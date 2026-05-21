import { useState } from 'react'
import { X, ChevronRight, BookOpen, Search, Users, MessageCircle, User, CalendarDays, ShoppingBag } from 'lucide-react'

const SEEN_KEY = 'sandbook_tutorial_v1'

const STEPS = [
  {
    icon: BookOpen,
    color: 'bg-amber-500',
    title: '¡Bienvenido a Sandbook!',
    desc: 'Tu compañero de lectura. Organizá tus libros, seguí tu progreso y conectá con otros lectores.',
    img: '📚',
  },
  {
    icon: Search,
    color: 'bg-blue-500',
    title: 'Buscá libros',
    desc: 'Buscá por título, autor o escaneá el código de barras de un libro con la cámara. También podés ver el precio en MercadoLibre y Amazon.',
    img: '🔍',
  },
  {
    icon: BookOpen,
    color: 'bg-green-500',
    title: 'Tu Biblioteca',
    desc: 'Guardá libros como "Leyendo", "Leído" o "Pendiente". Creá planes de lectura diarios o relajados con historial y notas.',
    img: '📖',
  },
  {
    icon: CalendarDays,
    color: 'bg-purple-500',
    title: 'Planes de lectura',
    desc: 'Elegí entre Plan Relax (marcá tu página y anotá) o Plan con Meta (páginas por día con seguimiento). También disponible para la Biblia.',
    img: '🗓️',
  },
  {
    icon: Users,
    color: 'bg-rose-500',
    title: 'Comunidad',
    desc: 'Seguí lectores, publicá reseñas en el Feed, descubrí autores favoritos y explorá el Marketplace para comprar y vender libros.',
    img: '👥',
  },
  {
    icon: MessageCircle,
    color: 'bg-indigo-500',
    title: 'Mensajes',
    desc: 'Chateá en privado con otros lectores. También podés contactar vendedores del Marketplace directamente.',
    img: '💬',
  },
  {
    icon: ShoppingBag,
    color: 'bg-teal-500',
    title: 'Marketplace',
    desc: 'Publicá libros que ya no usás con precio, imagen y descripción. Compradores pueden comentar y contactarte por mensaje.',
    img: '🛒',
  },
]

export default function TutorialOverlay({ onDone }) {
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

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center px-4 bg-black/60">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header coloreado */}
        <div className={`${s.color} px-6 pt-8 pb-10 flex flex-col items-center text-center relative`}>
          <button onClick={finish} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 text-white">
            <X size={13} />
          </button>
          <div className="text-5xl mb-2">{s.img}</div>
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
            <Icon size={20} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-white leading-tight">{s.title}</h2>
        </div>

        {/* Descripción */}
        <div className="px-6 pt-5 pb-4">
          <p className="text-sm text-slate-600 text-center leading-relaxed">{s.desc}</p>
        </div>

        {/* Dots indicadores */}
        <div className="flex justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-amber-500' : 'w-1.5 bg-slate-200'}`} />
          ))}
        </div>

        {/* Botones */}
        <div className="flex gap-2 px-6 pb-6">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-medium">
              Atrás
            </button>
          )}
          {step === 0 && (
            <button onClick={finish}
              className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-2xl text-sm font-medium">
              Saltar tutorial
            </button>
          )}
          <button onClick={next}
            className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-sm font-semibold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1">
            {step === STEPS.length - 1 ? '¡Empezar!' : 'Siguiente'}
            {step < STEPS.length - 1 && <ChevronRight size={15} />}
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
