import { useEffect, useState } from 'react'
import { X, Loader2, Check, Send, Users } from 'lucide-react'
import { uploadSharedFile } from '../../utils/sharedFiles'

function Avatar({ photoURL, displayName }) {
  const initials = (displayName || '?')[0].toUpperCase()
  if (photoURL) return <img src={photoURL} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-amber-200" />
  return (
    <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center font-bold text-amber-600 flex-shrink-0">
      {initials}
    </div>
  )
}

// Envía un ebook local a un seguidor: sube el archivo al servidor propio
// (no usamos Firebase Storage) y manda un mensaje con el link como adjunto.
export default function ShareEbookSheet({ ebook, myUid, myProfile, followers, followersLoading, onLoadFollowers, sendMessage, canMessage, onClose }) {
  const [sendingTo, setSendingTo] = useState(null)
  const [sentTo, setSentTo]       = useState(new Set())
  const [blockedTo, setBlockedTo] = useState(new Set())
  const [error, setError]         = useState('')
  const [uploadedUrl, setUploadedUrl] = useState(null)

  useEffect(() => { onLoadFollowers() }, [])

  async function handlePick(follower) {
    if (sendingTo || sentTo.has(follower.uid)) return
    setError('')
    setSendingTo(follower.uid)
    try {
      const allowed = await canMessage(myUid, follower.uid, myProfile)
      if (!allowed) {
        setBlockedTo(prev => new Set(prev).add(follower.uid))
        return
      }
      let url = uploadedUrl
      if (!url) {
        url = await uploadSharedFile(ebook.fileBlob, { type: ebook.type, mimeType: ebook.fileBlob.type })
        setUploadedUrl(url)
      }
      await sendMessage(myUid, myProfile, follower.uid, follower, '', {
        kind: 'ebook',
        title: ebook.title,
        url,
        fileType: ebook.type,
      })
      setSentTo(prev => new Set(prev).add(follower.uid))
    } catch (e) {
      console.error('ShareEbookSheet error:', e)
      setError('No se pudo enviar el archivo. Probá de nuevo.')
    } finally {
      setSendingTo(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end">
      <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl p-5 pb-8 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Send size={16} className="text-amber-500" /> Enviar a un seguidor
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <X size={16} />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mb-4 truncate">{ebook.title}</p>

        {error && <p className="text-xs text-red-400 text-center mb-3">{error}</p>}

        <div className="overflow-y-auto flex-1 flex flex-col gap-1.5">
          {followersLoading && (
            <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-amber-400" /></div>
          )}

          {!followersLoading && followers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <Users size={32} className="mb-2 text-slate-200" />
              <p className="text-sm font-medium">Todavía no tenés seguidores</p>
              <p className="text-xs mt-1">Cuando alguien te siga vas a poder enviarle tus ebooks acá.</p>
            </div>
          )}

          {followers.map(f => {
            const isSending = sendingTo === f.uid
            const isSent    = sentTo.has(f.uid)
            const isBlocked = blockedTo.has(f.uid)
            return (
              <button
                key={f.uid}
                onClick={() => handlePick(f)}
                disabled={isSending || isSent}
                className="flex items-center gap-3 px-2 py-2.5 rounded-2xl text-left hover:bg-slate-50 active:bg-slate-100 disabled:opacity-70"
              >
                <Avatar photoURL={f.photoURL} displayName={f.displayName} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{f.displayName || 'Lector'}</p>
                  {isBlocked && <p className="text-[10px] text-red-400">No acepta mensajes tuyos</p>}
                </div>
                {isSending && <Loader2 size={16} className="animate-spin text-amber-500 flex-shrink-0" />}
                {isSent && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-green-600 flex-shrink-0">
                    <Check size={13} /> Enviado
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <button onClick={onClose} className="w-full mt-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-sm font-semibold transition-all">
          Listo
        </button>
      </div>
    </div>
  )
}
