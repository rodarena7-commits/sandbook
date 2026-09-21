import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react'

function formatElapsed(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function PeerAvatar({ peer }) {
  const initial = (peer?.displayName || '?')[0].toUpperCase()
  if (peer?.photoURL) {
    return <img src={peer.photoURL} alt="" referrerPolicy="no-referrer"
      className="w-28 h-28 rounded-full object-cover border-2 border-white/20" />
  }
  return (
    <div className="w-28 h-28 rounded-full bg-amber-500/20 border-2 border-white/20 flex items-center justify-center text-4xl font-bold text-amber-300">
      {initial}
    </div>
  )
}

function ControlButton({ onClick, active = false, label, children }) {
  return (
    <button onClick={onClick} aria-label={label}
      className={`w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-all ${
        active ? 'bg-white text-slate-900' : 'bg-white/15 text-white'
      }`}>
      {children}
    </button>
  )
}

export default function CallScreen({
  call, localStream, remoteStream, connectedAt, muted, cameraOff,
  onToggleMute, onToggleCamera, onHangup,
}) {
  const remoteRef = useRef(null)
  const localRef  = useRef(null)
  const [now, setNow] = useState(Date.now())
  const [remoteHasVideo, setRemoteHasVideo] = useState(false)

  useEffect(() => { if (remoteRef.current) remoteRef.current.srcObject = remoteStream || null }, [remoteStream])
  // El <video> local se desmonta al apagar la cámara, así que hay que reasignar el stream al volver
  useEffect(() => { if (localRef.current)  localRef.current.srcObject  = localStream  || null }, [localStream, cameraOff])

  // El video remoto sólo se muestra cuando realmente llegan cuadros (si el otro apaga la cámara, vuelve el avatar)
  useEffect(() => {
    const el = remoteRef.current
    if (!el) return
    const update = () => setRemoteHasVideo(
      !!remoteStream && remoteStream.getVideoTracks().some(t => t.readyState === 'live' && !t.muted)
    )
    update()
    const tracks = remoteStream?.getVideoTracks() || []
    tracks.forEach(t => { t.onmute = update; t.onunmute = update; t.onended = update })
    el.addEventListener('playing', update)
    return () => {
      tracks.forEach(t => { t.onmute = null; t.onunmute = null; t.onended = null })
      el.removeEventListener('playing', update)
    }
  }, [remoteStream])

  useEffect(() => {
    if (!connectedAt) return
    const i = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(i)
  }, [connectedAt])

  const ended = call.phase === 'ended'
  const status =
    ended ? call.reason
    : call.phase === 'calling' ? 'Llamando…'
    : call.phase === 'connecting' ? 'Conectando…'
    : call.phase === 'reconnecting' ? 'Reconectando…'
    : connectedAt ? formatElapsed(now - connectedAt) : ''

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col">
      <video ref={remoteRef} autoPlay playsInline
        className={`absolute inset-0 w-full h-full object-cover ${remoteHasVideo ? '' : 'invisible'}`} />

      {!remoteHasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <PeerAvatar peer={call.peer} />
        </div>
      )}

      <div className="relative pt-12 px-6 text-center bg-gradient-to-b from-black/50 to-transparent pb-8">
        <p className="text-white font-semibold text-lg drop-shadow">{call.peer?.displayName || 'Lector'}</p>
        <p className="text-white/80 text-sm mt-0.5 tabular-nums drop-shadow">{status}</p>
      </div>

      {localStream && !cameraOff && (
        <video ref={localRef} autoPlay playsInline muted
          className="absolute top-28 right-4 w-24 h-32 rounded-2xl object-cover border-2 border-white/30 shadow-lg -scale-x-100 bg-slate-800" />
      )}

      <div className="mt-auto relative pb-10 pt-8 flex items-center justify-center gap-5 bg-gradient-to-t from-black/60 to-transparent">
        {!ended && (
          <>
            <ControlButton onClick={onToggleMute} active={muted} label={muted ? 'Activar micrófono' : 'Silenciar'}>
              {muted ? <MicOff size={22} /> : <Mic size={22} />}
            </ControlButton>
            <button onClick={onHangup} aria-label="Cortar"
              className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg">
              <PhoneOff size={26} />
            </button>
            <ControlButton onClick={onToggleCamera} active={cameraOff} label={cameraOff ? 'Activar cámara' : 'Apagar cámara'}>
              {cameraOff ? <VideoOff size={22} /> : <Video size={22} />}
            </ControlButton>
          </>
        )}
      </div>
    </div>
  )
}
