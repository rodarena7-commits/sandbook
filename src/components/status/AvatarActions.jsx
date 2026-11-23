import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleDot, Image as ImageIcon, Plus } from 'lucide-react'
import { useStatuses } from '../../contexts/StatusContext'
import PhotoViewer from '../ui/PhotoViewer'
import { useAuth } from '../../contexts/AuthContext'

// Foto de perfil tocable: si la persona tiene estado, pregunta si ver el estado o la foto.
// En el perfil propio también ofrece agregar un estado.
export default function AvatarActions({ uid, photoURL, name, isMe = false, children }) {
  const { t } = useAuth()
  const { hasStatus, openStatuses, openCreate } = useStatuses()
  const [menu, setMenu]       = useState(false)
  const [showPhoto, setPhoto] = useState(false)

  const withStatus = hasStatus(uid)
  const options = [
    withStatus && { key: 'status', label: isMe ? t('st_view_mine') : t('st_view'), icon: CircleDot, run: () => openStatuses(uid) },
    photoURL   && { key: 'photo',  label: t('st_view_photo'), icon: ImageIcon, run: () => setPhoto(true) },
    isMe       && { key: 'add',    label: t('st_add'), icon: Plus, run: () => openCreate() },
  ].filter(Boolean)

  function handleTap() {
    if (options.length === 0) return
    if (options.length === 1) options[0].run()
    else setMenu(true)
  }

  return (
    <>
      <button type="button" onClick={handleTap} aria-label={t('st_profile_photo')} className="block rounded-full">
        {children}
      </button>

      {/* Portal: la foto puede estar dentro de un contenedor con transform, que rompe position:fixed */}
      {menu && createPortal(
        <div className="fixed inset-0 z-[290] flex items-end bg-black/40" onClick={() => setMenu(false)}>
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-3xl p-4 pb-8" onClick={e => e.stopPropagation()}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center mb-3">{name || t('nav_profile')}</p>
            <div className="flex flex-col gap-1.5">
              {options.map(o => (
                <button key={o.key} onClick={() => { setMenu(false); o.run() }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 active:bg-slate-100 text-left">
                  <o.icon size={18} className="text-amber-500" />
                  <span className="text-sm font-semibold text-slate-700">{o.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setMenu(false)} className="w-full mt-3 py-2.5 text-sm text-slate-400">{t('common_cancel')}</button>
          </div>
        </div>,
        document.body
      )}

      {showPhoto && createPortal(
        <PhotoViewer uid={uid} currentUrl={photoURL} name={name} canDelete={isMe} onClose={() => setPhoto(false)} />,
        document.body
      )}
    </>
  )
}
