import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send, Lock, Loader2 } from 'lucide-react'
import { useMessages } from '../../hooks/useMessages'
import { getConvId } from '../../hooks/useConversations'

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
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

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
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="bg-white border-t border-slate-100 px-4 py-3 flex gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={!canSend}
          placeholder={canSend ? 'Escribí un mensaje…' : 'No acepta mensajes'}
          className="flex-1 px-4 py-2.5 bg-slate-100 rounded-full text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending || !canSend}
          className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 active:scale-90 transition-all shadow-sm flex-shrink-0"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
        </button>
      </form>
    </div>
  )
}
