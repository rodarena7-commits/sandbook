import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useBookThread } from '../../hooks/useBookThread'
import { useAuth } from '../../contexts/AuthContext'

import { timeAgo } from '../../utils/timeAgo'

function Avatar({ photoURL, displayName }) {
  const init = (displayName || '?')[0].toUpperCase()
  if (photoURL) return <img src={photoURL} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
  return (
    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold flex-shrink-0">
      {init}
    </div>
  )
}

export default function BookThread({ ownerUid, bookId, myUid, myProfile, count = 0 }) {
  const { t, language } = useAuth()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const { messages, loading, postMessage } = useBookThread(ownerUid, bookId, open)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, open])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    await postMessage(myUid, myProfile?.displayName, myProfile?.photoURL, text)
    setText('')
    setSending(false)
  }

  const totalCount = open ? messages.length : (count || 0)

  return (
    <div className="border-t border-slate-100">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-slate-50 transition-all"
      >
        <MessageCircle size={13} className={open ? 'text-amber-500' : 'text-slate-400'} />
        <span className={`text-xs font-medium ${open ? 'text-amber-600' : 'text-slate-500'}`}>
          {open
            ? messages.length > 0 ? t(messages.length === 1 ? 'bt_comments_one' : 'bt_comments_many', { n: messages.length }) : t('bt_no_comments')
            : totalCount > 0 ? t(totalCount === 1 ? 'bt_comments_one' : 'bt_comments_many', { n: totalCount }) : t('bt_comment')}
        </span>
        <span className="ml-auto">
          {open ? <ChevronUp size={13} className="text-slate-400"/> : <ChevronDown size={13} className="text-slate-400"/>}
        </span>
      </button>

      {/* Thread content */}
      {open && (
        <div className="bg-slate-50 px-3 pb-3">
          {loading && (
            <div className="flex justify-center py-3">
              <Loader2 size={16} className="animate-spin text-amber-400" />
            </div>
          )}

          {/* Messages */}
          {!loading && messages.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">
              {t('bt_be_first')}
            </p>
          )}

          <div className="flex flex-col gap-2.5 mb-2.5">
            {messages.map(msg => (
              <div key={msg.id} className="flex gap-2 items-start">
                <Avatar photoURL={msg.fromPhoto} displayName={msg.fromName} />
                <div className="flex-1 min-w-0 bg-white rounded-2xl rounded-tl-md px-3 py-2 shadow-sm border border-slate-100">
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <p className="text-[11px] font-semibold text-slate-700">{msg.fromName}</p>
                    <p className="text-[9px] text-slate-400">{timeAgo(msg.createdAt, t, language)}</p>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {myUid && (
            <form onSubmit={handleSend} className="flex gap-2">
              <Avatar photoURL={myProfile?.photoURL} displayName={myProfile?.displayName} />
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={t('mk_comment_placeholder')}
                maxLength={300}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button type="submit" disabled={!text.trim() || sending}
                className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0 active:scale-90 transition-all">
                {sending ? <Loader2 size={11} className="animate-spin"/> : <Send size={11}/>}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
