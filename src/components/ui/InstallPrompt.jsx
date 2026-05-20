import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

const DISMISSED_KEY = 'sandbook_install_dismissed'

export default function InstallPrompt() {
  const [prompt,  setPrompt]  = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // No mostrar si ya está instalada como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // No mostrar si ya fue descartada
    if (localStorage.getItem(DISMISSED_KEY)) return

    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    dismiss()
  }

  function dismiss() {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-8 bg-black/50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in slide-in-from-bottom">
        {/* Close */}
        <button onClick={dismiss} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <X size={15} />
        </button>

        {/* Logo + título */}
        <div className="flex flex-col items-center text-center mb-5">
          <img src="/logosandbook.png" alt="Sandbook" className="w-20 h-20 rounded-2xl shadow-md mb-3 object-cover" />
          <h2 className="text-lg font-bold text-slate-800">Instalá Sandbook</h2>
          <p className="text-sm text-slate-500 mt-1">
            Agregala a tu pantalla de inicio para acceder más rápido, sin abrir el navegador.
          </p>
        </div>

        {/* Beneficios */}
        <div className="flex flex-col gap-2 mb-5">
          {[
            { icon: Smartphone, text: 'Funciona como una app nativa' },
            { icon: Download,   text: 'Sin conexión: accedé a tu biblioteca offline' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 bg-slate-50 rounded-2xl px-3 py-2.5">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-amber-600" />
              </div>
              <p className="text-xs text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <button onClick={dismiss}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-medium">
            Ahora no
          </button>
          <button onClick={handleInstall}
            className="flex-1 py-3 bg-amber-500 text-white rounded-2xl text-sm font-semibold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2">
            <Download size={15} /> Instalar
          </button>
        </div>
      </div>
    </div>
  )
}
