import { useEffect } from 'react'
import { Phone, PhoneOff } from 'lucide-react'

// Tono simple con WebAudio. Si el navegador bloquea el audio (sin interacción previa) no pasa nada:
// igual se vibra y se ve la pantalla.
function useRingtone() {
  useEffect(() => {
    let ctx
    let interval
    const beep = () => {
      try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = 440
        gain.gain.setValueAtTime(0.0001, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9)
        osc.connect(gain).connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 1)
      } catch {}
      try { navigator.vibrate?.([400, 200, 400]) } catch {}
    }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)()
      ctx.resume?.().catch(() => {})
    } catch {}
    beep()
    interval = setInterval(beep, 2200)
    return () => {
      clearInterval(interval)
      try { navigator.vibrate?.(0) } catch {}
      try { ctx?.close() } catch {}
    }
  }, [])
}

export default function IncomingCallOverlay({ callerName, callerPhoto, onAccept, onDecline }) {
  useRingtone()
  const initial = (callerName || '?')[0].toUpperCase()

  return (
    <div className="fixed inset-0 z-[400] bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-between py-20 px-6">
      <div className="flex flex-col items-center gap-3 mt-10">
        {callerPhoto ? (
          <img src={callerPhoto} alt="" referrerPolicy="no-referrer"
            className="w-28 h-28 rounded-full object-cover border-2 border-white/20 animate-pulse" />
        ) : (
          <div className="w-28 h-28 rounded-full bg-amber-500/20 border-2 border-white/20 flex items-center justify-center text-4xl font-bold text-amber-300 animate-pulse">
            {initial}
          </div>
        )}
        <p className="text-white text-xl font-semibold mt-2">{callerName || 'Lector'}</p>
        <p className="text-white/60 text-sm">Videollamada entrante…</p>
      </div>

      <div className="flex items-center gap-16">
        <div className="flex flex-col items-center gap-2">
          <button onClick={onDecline} aria-label="Rechazar"
            className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg">
            <PhoneOff size={26} />
          </button>
          <span className="text-white/70 text-xs">Rechazar</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button onClick={onAccept} aria-label="Atender"
            className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg animate-bounce">
            <Phone size={26} />
          </button>
          <span className="text-white/70 text-xs">Atender</span>
        </div>
      </div>
    </div>
  )
}
