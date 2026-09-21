import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { ArrowLeft, Send, Lock, Loader2, FileText, BookOpenText, Mic, Trash2, Play, Pause, Video } from 'lucide-react'
import { useMessages } from '../../hooks/useMessages'
import { getConvId } from '../../hooks/useConversations'
import { useVoiceRecorder, MAX_VOICE_SECONDS } from '../../hooks/useVoiceRecorder'

const PdfViewerSheet = lazy(() => import('../ui/PdfViewerSheet'))

// Sala de Jitsi Meet: gratis y sin servidor propio. El nombre aleatorio hace de "llave".
const JITSI_HOST = 'https://meet.jit.si'

function newCallUrl() {
  return `${JITSI_HOST}/Sandbook-${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
}

function formatDuration(s) {
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

function VoiceBubble({ attachment, isMe }) {
  const audioRef = useRef(null)
  const [playing, setPlaying]   = useState(false)
  const [progress, setProgress] = useState(0)
  const total = attachment.duration || 1

  useEffect(() => () => audioRef.current?.pause(), [])

  function toggle() {
    if (!audioRef.current) {
      const a = new Audio(attachment.audio)
      a.ontimeupdate = () => setProgress(Math.min(1, a.currentTime / total))
      a.onended = () => { setPlaying(false); setProgress(0) }
      audioRef.current = a
    }
    const a = audioRef.current
    if (playing) {
      a.pause()
      setPlaying(false)
    } else {
      a.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl w-56 max-w-[75%] ${
      isMe ? 'bg-amber-500 text-white rounded-br-md' : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-md'
    }`}>
      <button onClick={toggle} aria-label={playing ? 'Pausar' : 'Reproducir'}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-white/25 text-white' : 'bg-amber-50 text-amber-500'}`}>
        {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`h-1.5 rounded-full overflow-hidden ${isMe ? 'bg-white/30' : 'bg-slate-200'}`}>
          <div className={`h-full rounded-full ${isMe ? 'bg-white' : 'bg-amber-500'}`} style={{ width: `${progress * 100}%` }} />
        </div>
        <p className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
          <Mic size={10} /> {formatDuration(playing ? progress * total : total)}
        </p>
      </div>
    </div>
  )
}

function CallCard({ attachment, isMe }) {
  return (
    <button
      onClick={() => window.open(attachment.url, '_blank', 'noopener,noreferrer')}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-left max-w-[75%] ${
        isMe ? 'bg-amber-500 text-white rounded-br-md' : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-md'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-white/20' : 'bg-amber-50'}`}>
        <Video size={16} className={isMe ? 'text-white' : 'text-amber-500'} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold">Videollamada</p>
        <p className={`text-[10px] mt-0.5 ${isMe ? 'text-white/70' : 'text-slate-400'}`}>Tocá para unirte</p>
      </div>
    </button>
  )
}

function AttachmentCard({ attachment, isMe, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-left max-w-[75%] ${
        isMe ? 'bg-amber-500 text-white rounded-br-md' : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-md'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-white/20' : 'bg-amber-50'}`}>
        <FileText size={16} className={isMe ? 'text-white' : 'text-amber-500'} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold line-clamp-2">{attachment.title || 'Archivo compartido'}</p>
        <p className={`text-[10px] flex items-center gap-1 mt-0.5 ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
          <BookOpenText size={10} /> Abrir ebook
        </p>
      </div>
    </button>
  )
}

function timeLabel(ts) {
  if (!ts?.seconds) return ''
  return new Date(ts.seconds * 1000).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function Avatar({ photoURL, displayName, size = 8 }) {
  const initials = (displayName || '?')[0].toUpperCase()
  if (photoURL) return <img src={photoURL} alt="" className={`w-${size} h-${size} rounded-full object-cover flex-shrink-0`} />
  return (
    <div className={`w-${size} h-${size} rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs flex-shrink-0`}>
      {initials}
    </div>
  )
}

export default function ChatWindow({ myUid, myProfile, otherUser, canSend, onSend, onBack }) {
  const convId = getConvId(myUid, otherUser.uid)
  const { messages, loading } = useMessages(convId)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [openAttachment, setOpenAttachment] = useState(null)
  const [sendError, setSendError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const voice = useVoiceRecorder()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || sending || !canSend) return
    setSending(true)
    await onSend(text)
    setText('')
    setSending(false)
    inputRef.current?.focus()
  }

  async function sendAttachment(attachment) {
    setSendError('')
    setSending(true)
    try {
      await onSend('', attachment)
    } catch (err) {
      console.error('ChatWindow sendAttachment error:', err)
      setSendError('No se pudo enviar. Probá de nuevo.')
    } finally {
      setSending(false)
    }
  }

  async function finishRecording() {
    const result = await voice.stop()
    if (result) await sendAttachment({ kind: 'voice', audio: result.audio, duration: result.duration })
  }

  // Al llegar al límite se corta y se envía solo
  useEffect(() => {
    if (voice.recording && voice.seconds >= MAX_VOICE_SECONDS) finishRecording()
  }, [voice.recording, voice.seconds])

  async function startCall() {
    if (!canSend || sending) return
    const url = newCallUrl()
    await sendAttachment({ kind: 'call', title: 'Videollamada', url })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow-sm flex items-center gap-3 px-4 pt-12 pb-3 flex-shrink-0">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <ArrowLeft size={16} />
        </button>
        <Avatar photoURL={otherUser.photoURL} displayName={otherUser.displayName} size={8} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm">{otherUser.displayName || 'Lector'}</p>
          {!canSend && <p className="text-[10px] text-slate-400 flex items-center gap-1"><Lock size={9} /> No acepta mensajes</p>}
        </div>
        <button
          onClick={startCall}
          disabled={!canSend || sending || voice.recording}
          aria-label="Iniciar videollamada"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-amber-50 text-amber-500 disabled:opacity-40 active:scale-90 transition-all"
        >
          <Video size={17} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {loading && <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-amber-400" /></div>}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400 text-center">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-sm font-medium text-slate-500">Empezá la conversación</p>
            {!canSend && <p className="text-xs mt-1 text-slate-400 flex items-center gap-1"><Lock size={10} /> Esta persona no acepta mensajes</p>}
          </div>
        )}

        {messages.map(msg => {
          const isMe = msg.fromUid === myUid
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isMe && <Avatar photoURL={otherUser.photoURL} displayName={otherUser.displayName} size={6} />}
              {msg.attachment?.kind === 'voice' ? (
                <VoiceBubble attachment={msg.attachment} isMe={isMe} />
              ) : msg.attachment?.kind === 'call' ? (
                <CallCard attachment={msg.attachment} isMe={isMe} />
              ) : msg.attachment ? (
                <AttachmentCard attachment={msg.attachment} isMe={isMe} onOpen={() => {
                  if (msg.attachment.fileType === 'pdf') setOpenAttachment(msg.attachment)
                  else window.open(msg.attachment.url, '_blank', 'noopener,noreferrer')
                }} />
              ) : (
                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-amber-500 text-white rounded-br-md'
                    : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-md'
                }`}>
                  <p>{msg.text}</p>
                  <p className={`text-[9px] mt-1 ${isMe ? 'text-white/60 text-right' : 'text-slate-400'}`}>
                    {timeLabel(msg.createdAt)}
                  </p>
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {(voice.error || sendError) && (
        <p className="bg-white text-xs text-red-400 text-center px-4 pt-2 flex-shrink-0">{voice.error || sendError}</p>
      )}
      {voice.recording ? (
        <div className="bg-white border-t border-slate-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => voice.cancel()} aria-label="Cancelar grabación"
            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 active:scale-90 transition-all flex-shrink-0">
            <Trash2 size={16} />
          </button>
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-red-50 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-500 tabular-nums">
              {formatDuration(voice.seconds)} <span className="text-red-300">/ {formatDuration(MAX_VOICE_SECONDS)}</span>
            </span>
          </div>
          <button onClick={finishRecording} aria-label="Enviar mensaje de voz"
            className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white active:scale-90 transition-all shadow-sm flex-shrink-0">
            <Send size={15} />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="bg-white border-t border-slate-100 px-4 py-3 flex gap-2 flex-shrink-0">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={!canSend}
            placeholder={canSend ? 'Escribí un mensaje…' : 'No acepta mensajes'}
            className="flex-1 px-4 py-2.5 bg-slate-100 rounded-full text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
          />
          {text.trim() ? (
            <button
              type="submit"
              disabled={sending || !canSend}
              className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 active:scale-90 transition-all shadow-sm flex-shrink-0"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => voice.start()}
              disabled={sending || !canSend}
              aria-label="Grabar mensaje de voz"
              className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 active:scale-90 transition-all shadow-sm flex-shrink-0"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
            </button>
          )}
        </form>
      )}

      {openAttachment && (
        <Suspense fallback={
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-white" />
          </div>
        }>
          <PdfViewerSheet
            url={openAttachment.url}
            title={openAttachment.title}
            onClose={() => setOpenAttachment(null)}
          />
        </Suspense>
      )}
    </div>
  )
}
