import { useState } from 'react'
import { MessageCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useConversations } from '../hooks/useConversations'
import ChatWindow from '../components/chat/ChatWindow'

function timeAgo(ts) {
  if (!ts?.seconds) return ''
  const diff = Date.now() - ts.seconds * 1000
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function Avatar({ photoURL, displayName }) {
  const initials = (displayName || '?')[0].toUpperCase()
  if (photoURL) return <img src={photoURL} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-amber-200" />
  return (
    <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center font-bold text-amber-600 flex-shrink-0">
      {initials}
    </div>
  )
}

export default function MessagesPage() {
  const { user, profile } = useAuth()
  const { convs, loading, canMessage, sendMessage, markRead } = useConversations(user?.uid)
  const [openChat, setOpenChat] = useState(null)
  const [canSendCache, setCanSendCache] = useState({})

  async function openConversation(conv) {
    const otherId = conv.participants.find(p => p !== user.uid)
    const otherUser = {
      uid:         otherId,
      displayName: conv.names?.[otherId] || 'Lector',
      photoURL:    conv.photos?.[otherId] || null,
    }

    let allowed = canSendCache[otherId]
    if (allowed === undefined) {
      allowed = await canMessage(user.uid, otherId, profile)
      setCanSendCache(c => ({ ...c, [otherId]: allowed }))
    }

    await markRead(conv.id, user.uid)
    setOpenChat({ conv, otherUser, canSend: allowed })
  }

  async function handleSend(text) {
    const { otherUser } = openChat
    await sendMessage(user.uid, profile, otherUser.uid, otherUser, text)
  }

  if (openChat) {
    return (
      <ChatWindow
        myUid={user.uid}
        myProfile={profile}
        otherUser={openChat.otherUser}
        canSend={openChat.canSend}
        onSend={handleSend}
        onBack={() => setOpenChat(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">Mensajes</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-2">
        {loading && (
          <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-amber-400" /></div>
        )}

        {!loading && convs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
            <MessageCircle size={44} className="mb-4 text-slate-200" />
            <p className="font-semibold text-slate-500">Sin mensajes aún</p>
            <p className="text-xs mt-1">Enviá un mensaje desde el perfil de otro lector</p>
          </div>
        )}

        {convs.map(conv => {
          const otherId   = conv.participants.find(p => p !== user.uid)
          const otherName = conv.names?.[otherId]  || 'Lector'
          const otherPhoto = conv.photos?.[otherId] || null
          const unread    = conv.unread?.[user.uid] || 0

          return (
            <button key={conv.id} onClick={() => openConversation(conv)}
              className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 text-left active:bg-slate-50">
              <Avatar photoURL={otherPhoto} displayName={otherName} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={`text-sm ${unread > 0 ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'}`}>
                    {otherName}
                  </p>
                  <span className="text-[10px] text-slate-400">{timeAgo(conv.lastAt)}</span>
                </div>
                <p className={`text-xs line-clamp-1 ${unread > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                  {conv.lastMessage || '…'}
                </p>
              </div>
              {unread > 0 && (
                <span className="min-w-[20px] h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 flex-shrink-0">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
