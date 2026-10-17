import { useEffect, useMemo, useState } from 'react'
import { Megaphone, Loader2, Check, AlertTriangle } from 'lucide-react'
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp, increment } from 'firebase/firestore'
import { db } from '../../firebase'
import { getConvId } from '../../hooks/useConversations'

const DEFAULT_TEXT =
`¡Hola! Soy Rodrigo, creador y CEO de Sandbook 📚

Te doy la bienvenida y te agradezco por ser parte de esta comunidad de lectores. Estamos mejorando la app todo el tiempo para que disfrutes cada lectura.

Si alguna vez la app no te funciona bien, podés usar Sandbook desde el navegador en este link:
https://sandbook-5qfn.onrender.com/

¡Felices lecturas!`

const CONCURRENCY = 5

// Mismo texto → mismo id: si el envío se corta y se repite, no le llega dos veces a nadie
function broadcastIdFor(text) {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return `broadcast_${(h >>> 0).toString(36)}`
}

// Respeta la privacidad de mensajes de cada usuario, igual que el chat
function acceptsFrom(target, myUid, myProfile) {
  const privacy = target.messagingPrivacy || 'everyone'
  if (privacy === 'nobody') return false
  if (privacy === 'followers') return (target.followers || []).includes(myUid)
  if (privacy === 'following') return (myProfile?.following || []).includes(target.uid)
  return true
}

export default function AdminBroadcast({ myUid, myProfile }) {
  const [text, setText]         = useState(DEFAULT_TEXT)
  const [users, setUsers]       = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [progress, setProgress] = useState(null)   // { done, total, sent, skipped, failed }
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    getDocs(collection(db, 'users'))
      .then(snap => setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(u => u.uid !== myUid)))
      .catch(err => { console.error('AdminBroadcast users error:', err); setLoadError(true) })
  }, [myUid])

  const { recipients, blocked } = useMemo(() => {
    if (!users) return { recipients: [], blocked: 0 }
    const recipients = users.filter(u => acceptsFrom(u, myUid, myProfile))
    return { recipients, blocked: users.length - recipients.length }
  }, [users, myUid, myProfile])

  async function sendTo(target, msgId, body) {
    const convId = getConvId(myUid, target.uid)
    const msgRef = doc(db, 'conversations', convId, 'messages', msgId)
    if ((await getDoc(msgRef)).exists()) return 'skipped'
    await setDoc(msgRef, { fromUid: myUid, text: body, createdAt: serverTimestamp(), broadcast: true })
    await setDoc(doc(db, 'conversations', convId), {
      participants: [myUid, target.uid],
      names: {
        [myUid]: myProfile?.displayName || 'Sandbook',
        [target.uid]: target.displayName || 'Lector',
      },
      photos: {
        [myUid]: myProfile?.photoURL || null,
        [target.uid]: target.photoURL || null,
      },
      lastMessage: body.slice(0, 60),
      lastAt: serverTimestamp(),
      unread: { [target.uid]: increment(1) },
    }, { merge: true })
    return 'sent'
  }

  async function handleSend() {
    const body = text.trim()
    if (!body || !recipients.length || (progress && !finished)) return
    if (!window.confirm(`Se va a enviar este mensaje a ${recipients.length} usuarios desde tu cuenta. ¿Confirmás?`)) return

    const msgId = broadcastIdFor(body)
    const stats = { done: 0, total: recipients.length, sent: 0, skipped: 0, failed: 0 }
    setFinished(false)
    setProgress({ ...stats })

    const pending = [...recipients]
    async function worker() {
      while (pending.length) {
        const target = pending.shift()
        try {
          stats[await sendTo(target, msgId, body)]++
        } catch (err) {
          console.error('broadcast error', target.uid, err)
          stats.failed++
        }
        stats.done++
        setProgress({ ...stats })
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker))
    setFinished(true)
  }

  const sending = progress && !finished

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-2">
      <h3 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-2 uppercase tracking-wide">
        <Megaphone size={13} className="text-amber-500" /> Mensaje a todos
      </h3>
      <p className="text-[11px] text-slate-400 mb-3">
        Llega como mensaje privado desde tu cuenta a cada usuario.
      </p>

      <textarea
        value={text}
        onChange={e => { setText(e.target.value); if (finished) { setProgress(null); setFinished(false) } }}
        disabled={sending}
        rows={9}
        className="w-full px-3 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-400 resize-y disabled:opacity-60"
      />

      <div className="mt-2 text-[11px] text-slate-500">
        {loadError ? (
          <span className="text-red-400">No se pudieron cargar los usuarios.</span>
        ) : !users ? (
          <span className="flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" /> Contando usuarios…</span>
        ) : (
          <>
            Le llega a <b className="text-slate-700">{recipients.length}</b> usuarios.
            {blocked > 0 && <> {blocked} no se incluyen porque su privacidad no acepta mensajes tuyos.</>}
          </>
        )}
      </div>

      {progress && (
        <div className="mt-3">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
            {finished ? <Check size={12} className="text-green-600" /> : <Loader2 size={11} className="animate-spin" />}
            {finished ? 'Listo: ' : `Enviando ${progress.done} de ${progress.total}… `}
            {progress.sent} enviados
            {progress.skipped > 0 && `, ${progress.skipped} ya lo tenían`}
            {progress.failed > 0 && <span className="text-red-500 flex items-center gap-1">, <AlertTriangle size={11} /> {progress.failed} fallaron (tocá Enviar de nuevo para reintentar)</span>}
          </p>
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={!users || !recipients.length || !text.trim() || sending || (finished && !progress?.failed)}
        className="w-full mt-3 py-2.5 bg-amber-500 text-white rounded-2xl text-sm font-semibold shadow-sm disabled:opacity-40 active:scale-95 transition-all"
      >
        {sending ? 'Enviando…' : finished && !progress?.failed ? 'Enviado' : `Enviar a ${recipients.length} usuarios`}
      </button>
    </div>
  )
}
