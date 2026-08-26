import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { Capacitor } from '@capacitor/core'

const DISMISSED_KEY = 'sandbook_install_banner_dismissed'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=sandbook.myapp'

function isAndroidBrowser() {
  return /Android/i.test(navigator.userAgent)
}

// Banner compacto para usuarios que entran por el navegador (antes de loguearse):
// enlaza directo a la ficha de Play Store, mucho más confiable que esperar el
// evento "beforeinstallprompt" del navegador (que no dispara en todos los casos).
export default function InstallAppBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem(DISMISSED_KEY)) return
    if (!isAndroidBrowser()) return
    setVisible(true)
  }, [])

  function dismiss() {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  if (!visible) return null

  return (
    <div className="w-full max-w-xs bg-white border border-amber-200 rounded-2xl px-3.5 py-3 mb-5 flex items-center gap-3 shadow-sm">
      <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
        <Download size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800">Instalá la app</p>
        <p className="text-[10px] text-slate-500 leading-tight">Sandbook en Google Play, sin el navegador</p>
      </div>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={dismiss}
        className="px-3 py-1.5 bg-amber-500 text-white rounded-full text-[11px] font-semibold flex-shrink-0 active:scale-95 transition-all"
      >
        Instalar
      </a>
      <button onClick={dismiss} className="text-slate-300 flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}
