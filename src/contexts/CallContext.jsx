import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  addDoc, collection, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { ICE_SERVERS, getCallMedia } from '../utils/webrtc'
import CallScreen from '../components/chat/CallScreen'
import IncomingCallOverlay from '../components/chat/IncomingCallOverlay'

const CallContext = createContext(null)

const RING_TIMEOUT_MS = 45000   // el que llama corta solo si nadie atiende
const STALE_MS        = 60000   // ignoramos llamadas "ringing" más viejas (quedaron colgadas)

// Videollamadas 1 a 1 con WebRTC. Firestore sólo sirve de señalización:
//   calls/{id}                      { callerUid, calleeUid, status, offer, answer, ... }
//   calls/{id}/callerCandidates/*   candidatos ICE del que llama
//   calls/{id}/calleeCandidates/*   candidatos ICE del que atiende
// El video/audio viaja directo entre los teléfonos (o por el relay TURN).
export function CallProvider({ user, profile, children }) {
  const [call, setCall]         = useState(null)   // { id, role, peer, phase, reason }
  const [incoming, setIncoming] = useState(null)
  const [localStream, setLocalStream]   = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [connectedAt, setConnectedAt]   = useState(null)
  const [muted, setMuted]         = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [notice, setNotice]       = useState('')

  const pcRef        = useRef(null)
  const streamRef    = useRef(null)
  const callIdRef    = useRef(null)
  const unsubsRef    = useRef([])
  const pendingRef   = useRef([])
  const timeoutRef   = useRef(null)
  const answeredRef  = useRef(false)
  const closeTimerRef = useRef(null)

  function showNotice(msg) {
    setNotice(msg)
    setTimeout(() => setNotice(''), 4000)
  }

  function releaseResources() {
    clearTimeout(timeoutRef.current)
    unsubsRef.current.forEach(u => u())
    unsubsRef.current = []
    pendingRef.current = []
    const pc = pcRef.current
    if (pc) { pc.ontrack = null; pc.onicecandidate = null; pc.onconnectionstatechange = null; pc.close() }
    pcRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    callIdRef.current = null
    answeredRef.current = false
    setLocalStream(null)
    setRemoteStream(null)
    setConnectedAt(null)
    setMuted(false)
    setCameraOff(false)
  }

  // reason: texto a mostrar un momento ("Rechazó la llamada"); sin reason se cierra directo.
  function finish(reason) {
    if (!callIdRef.current) return
    releaseResources()
    clearTimeout(closeTimerRef.current)
    if (reason) {
      setCall(c => (c ? { ...c, phase: 'ended', reason } : c))
      closeTimerRef.current = setTimeout(() => setCall(null), 1800)
    } else {
      setCall(null)
    }
  }

  function createPeer(callId, role, stream) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pcRef.current = pc
    streamRef.current = stream
    setLocalStream(stream)
    setCameraOff(stream.getVideoTracks().length === 0)
    stream.getTracks().forEach(t => pc.addTrack(t, stream))

    pc.ontrack = e => { if (e.streams[0]) setRemoteStream(e.streams[0]) }
    pc.onicecandidate = e => {
      if (!e.candidate) return
      addDoc(collection(db, 'calls', callId, role === 'caller' ? 'callerCandidates' : 'calleeCandidates'), e.candidate.toJSON())
        .catch(err => console.error('call candidate error:', err))
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        clearTimeout(timeoutRef.current)
        setConnectedAt(t => t || Date.now())
        setCall(c => (c ? { ...c, phase: 'connected' } : c))
      } else if (pc.connectionState === 'disconnected') {
        setCall(c => (c && c.phase === 'connected' ? { ...c, phase: 'reconnecting' } : c))
      } else if (pc.connectionState === 'failed') {
        updateDoc(doc(db, 'calls', callId), { status: 'ended' }).catch(() => {})
        finish('No se pudo conectar')
      }
    }
    return pc
  }

  async function addRemoteCandidate(c) {
    const pc = pcRef.current
    if (!pc) return
    if (!pc.remoteDescription) { pendingRef.current.push(c); return }
    try { await pc.addIceCandidate(c) } catch (err) { console.warn('addIceCandidate:', err) }
  }

  async function flushPending() {
    const list = pendingRef.current
    pendingRef.current = []
    for (const c of list) await addRemoteCandidate(c)
  }

  function listenCandidates(callId, sub) {
    return onSnapshot(collection(db, 'calls', callId, sub), snap => {
      snap.docChanges().forEach(ch => { if (ch.type === 'added') addRemoteCandidate(ch.doc.data()) })
    })
  }

  async function startCall(peer) {
    if (!user || callIdRef.current) return
    let stream
    try {
      stream = await getCallMedia()
    } catch (e) {
      console.error('startCall media error:', e)
      showNotice('Permití el acceso a la cámara y al micrófono para hacer videollamadas.')
      return
    }

    const callDoc = doc(collection(db, 'calls'))
    const callId = callDoc.id
    callIdRef.current = callId
    setCall({ id: callId, role: 'caller', peer, phase: 'calling' })

    try {
      const pc = createPeer(callId, 'caller', stream)
      const offer = await pc.createOffer()
      // El doc se crea antes del setLocalDescription: ahí empiezan a salir los candidatos ICE
      await setDoc(callDoc, {
        callerUid: user.uid,
        calleeUid: peer.uid,
        callerName: profile?.displayName || 'Lector',
        callerPhoto: profile?.photoURL || null,
        status: 'ringing',
        offer: { type: offer.type, sdp: offer.sdp },
        createdAt: serverTimestamp(),
      })
      await pc.setLocalDescription(offer)

      unsubsRef.current.push(onSnapshot(callDoc, async snap => {
        const d = snap.data()
        if (!d || !pcRef.current) return
        if (d.answer && !answeredRef.current) {
          answeredRef.current = true
          clearTimeout(timeoutRef.current)
          await pcRef.current.setRemoteDescription(d.answer)
          await flushPending()
          setCall(c => (c && c.phase === 'calling' ? { ...c, phase: 'connecting' } : c))
        }
        if (d.status === 'declined') finish('Rechazó la llamada')
        else if (d.status === 'ended') finish('Llamada finalizada')
      }))
      unsubsRef.current.push(listenCandidates(callId, 'calleeCandidates'))

      timeoutRef.current = setTimeout(() => {
        if (answeredRef.current) return
        updateDoc(callDoc, { status: 'missed' }).catch(() => {})
        finish('No contestó')
      }, RING_TIMEOUT_MS)
    } catch (e) {
      console.error('startCall error:', e)
      finish(null)
      showNotice('No se pudo iniciar la videollamada.')
    }
  }

  async function acceptCall() {
    const inc = incoming
    if (!inc || callIdRef.current) return
    setIncoming(null)
    const callDoc = doc(db, 'calls', inc.id)
    const peer = { uid: inc.callerUid, displayName: inc.callerName, photoURL: inc.callerPhoto }

    // Puede que el que llamaba ya haya cortado
    try {
      const snap = await getDoc(callDoc)
      if (!snap.exists() || snap.data().status !== 'ringing') { showNotice('La llamada ya terminó.'); return }
    } catch { return }

    let stream
    try {
      stream = await getCallMedia()
    } catch (e) {
      console.error('acceptCall media error:', e)
      updateDoc(callDoc, { status: 'declined' }).catch(() => {})
      showNotice('Permití el acceso a la cámara y al micrófono para atender.')
      return
    }

    callIdRef.current = inc.id
    answeredRef.current = true
    setCall({ id: inc.id, role: 'callee', peer, phase: 'connecting' })

    try {
      const pc = createPeer(inc.id, 'callee', stream)
      await pc.setRemoteDescription(inc.offer)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await updateDoc(callDoc, { answer: { type: answer.type, sdp: answer.sdp }, status: 'accepted' })

      unsubsRef.current.push(listenCandidates(inc.id, 'callerCandidates'))
      unsubsRef.current.push(onSnapshot(callDoc, snap => {
        if (snap.data()?.status === 'ended') finish('Llamada finalizada')
      }))
      await flushPending()
      // Si nunca llega a conectar, no dejamos la pantalla colgada
      timeoutRef.current = setTimeout(() => {
        updateDoc(callDoc, { status: 'ended' }).catch(() => {})
        finish('No se pudo conectar')
      }, RING_TIMEOUT_MS)
    } catch (e) {
      console.error('acceptCall error:', e)
      updateDoc(callDoc, { status: 'ended' }).catch(() => {})
      finish(null)
      showNotice('No se pudo atender la videollamada.')
    }
  }

  function declineCall() {
    const inc = incoming
    setIncoming(null)
    if (inc) updateDoc(doc(db, 'calls', inc.id), { status: 'declined' }).catch(() => {})
  }

  function hangup() {
    const id = callIdRef.current
    if (id) updateDoc(doc(db, 'calls', id), { status: 'ended' }).catch(() => {})
    finish(null)
  }

  function toggleMute() {
    const next = !muted
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !next })
    setMuted(next)
  }

  function toggleCamera() {
    const tracks = streamRef.current?.getVideoTracks() || []
    if (!tracks.length) return
    const next = !cameraOff
    tracks.forEach(t => { t.enabled = !next })
    setCameraOff(next)
  }

  // Llamadas entrantes: las "ringing" dirigidas a mí
  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'calls'), where('calleeUid', '==', user.uid), where('status', '==', 'ringing'))
    return onSnapshot(q, snap => {
      const now = Date.now()
      const ringing = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => { const t = c.createdAt?.toMillis?.(); return !t || now - t < STALE_MS })
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      const next = ringing[0] || null
      if (next && callIdRef.current) {
        // Ya estoy en otra llamada: rechazo automáticamente
        updateDoc(doc(db, 'calls', next.id), { status: 'declined' }).catch(() => {})
        return
      }
      setIncoming(next)
    }, err => console.error('incoming calls error:', err))
  }, [user?.uid])

  // Al cerrar sesión o desmontar, soltamos cámara y micrófono
  useEffect(() => () => { clearTimeout(closeTimerRef.current); releaseResources() }, [])

  const value = { startCall, active: !!call || !!incoming }

  return (
    <CallContext.Provider value={value}>
      {children}
      {notice && (
        <div className="fixed top-4 left-4 right-4 z-[500] max-w-md mx-auto bg-slate-900 text-white text-xs font-medium text-center rounded-2xl px-4 py-3 shadow-lg">
          {notice}
        </div>
      )}
      {incoming && !call && (
        <IncomingCallOverlay
          callerName={incoming.callerName}
          callerPhoto={incoming.callerPhoto}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}
      {call && (
        <CallScreen
          call={call}
          localStream={localStream}
          remoteStream={remoteStream}
          connectedAt={connectedAt}
          muted={muted}
          cameraOff={cameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onHangup={hangup}
        />
      )}
    </CallContext.Provider>
  )
}

export function useCall() {
  return useContext(CallContext) || { startCall: async () => {}, active: false }
}
