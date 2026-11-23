import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Timer, Pause, Play, BellRing, Plus } from 'lucide-react'
import { addTimeSession } from '../hooks/useReadingPlan'
import { useAuth } from './AuthContext'

// Temporizador del "Plan por tiempo". Es global (no depende de la pantalla del plan):
// sigue corriendo si el usuario navega por la app y sobrevive a que se cierre, porque
// el estado se guarda en el teléfono. Al terminar suena una alarma y se pide la página.
//
// timer = { bookId, title, totalPages, startPage, startedAt,
//           durationSec, doneSec, endAt (corriendo) | remainingMs (pausado), status }
// doneSec: segundos de tramos anteriores ya cumplidos (al sumar minutos extra).

const STORAGE_KEY      = 'sandbook_reading_timer'
const NOTIFICATION_ID  = 4242
const CHANNEL_ID       = 'reading-timer'
const EXTRA_MINUTES    = 5

const ReadingTimerContext = createContext(null)
const isNative = Capacitor.isNativePlatform()

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null } catch { return null }
}
function persist(timer) {
  try {
    if (timer) localStorage.setItem(STORAGE_KEY, JSON.stringify(timer))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export function remainingMsOf(timer, now = Date.now()) {
  if (!timer) return 0
  if (timer.status === 'running') return Math.max(0, timer.endAt - now)
  if (timer.status === 'paused') return timer.remainingMs
  return 0
}

export function elapsedSecOf(timer, now = Date.now()) {
  if (!timer) return 0
  return timer.doneSec + (timer.durationSec - remainingMsOf(timer, now) / 1000)
}

export function formatClock(ms) {
  const total = Math.ceil(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(h ? 2 : 1, '0')
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

export function formatDuration(totalSec) {
  const sec = Math.round(totalSec || 0)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h && m) return `${h} h ${m} min`
  if (h) return `${h} h`
  if (m) return `${m} min`
  return sec ? `${sec} s` : '0 min'
}

// ── Pantalla encendida mientras corre ─────────────────────
let webWakeLock = null
async function keepScreenOn(on) {
  try {
    if (isNative) {
      const plugin = Capacitor.Plugins.KeepAwake
      if (plugin) await (on ? plugin.keepAwake() : plugin.allowSleep())
      return
    }
    if (on && navigator.wakeLock && !webWakeLock) {
      webWakeLock = await navigator.wakeLock.request('screen')
      webWakeLock.addEventListener?.('release', () => { webWakeLock = null })
    } else if (!on && webWakeLock) {
      await webWakeLock.release()
      webWakeLock = null
    }
  } catch {}
}

// ── Notificación de respaldo (si la app queda en segundo plano) ──
let channelReady = false
async function scheduleNotification(timer, texts) {
  if (!isNative) return
  try {
    let perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') return
    if (!channelReady) {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID, name: texts.channel,
        description: texts.channel,
        importance: 5, vibration: true, visibility: 1,
      })
      channelReady = true
    }
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] })
    await LocalNotifications.schedule({
      notifications: [{
        id: NOTIFICATION_ID,
        title: texts.title,
        body: texts.body,
        channelId: CHANNEL_ID,
        // No exacta: Google Play reserva las alarmas exactas para despertadores.
        // Mientras la app está abierta suena la alarma propia, que sí es puntual.
        isExactNotification: false,
        schedule: { at: new Date(timer.endAt), allowWhileIdle: true },
      }],
    })
  } catch (e) {
    console.warn('reading timer notification error:', e)
  }
}
async function cancelNotification() {
  if (!isNative) return
  try { await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] }) } catch {}
}

// ── Alarma ────────────────────────────────────────────────
function useAlarm(active) {
  useEffect(() => {
    if (!active) return
    let ctx
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)()
      ctx.resume?.().catch(() => {})
    } catch {}
    const ring = () => {
      try {
        // Tres pitidos cortos, tipo despertador
        ;[0, 0.25, 0.5].forEach(offset => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          const t0 = ctx.currentTime + offset
          osc.type = 'square'
          osc.frequency.value = 880
          gain.gain.setValueAtTime(0.0001, t0)
          gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18)
          osc.connect(gain).connect(ctx.destination)
          osc.start(t0)
          osc.stop(t0 + 0.2)
        })
      } catch {}
      try { navigator.vibrate?.([300, 150, 300, 150, 300]) } catch {}
    }
    ring()
    const interval = setInterval(ring, 1600)
    return () => {
      clearInterval(interval)
      try { navigator.vibrate?.(0) } catch {}
      try { ctx?.close() } catch {}
    }
  }, [active])
}

export function ReadingTimerProvider({ user, children }) {
  const { t } = useAuth()
  const notifTexts = timer => ({
    channel: t('tp_channel'),
    title: t('tp_notif_title'),
    body: t('tp_notif_body', { title: timer.title }),
  })
  const [timer, setTimerState] = useState(load)
  const [now, setNow] = useState(Date.now())
  const timerRef = useRef(timer)

  function setTimer(next) {
    timerRef.current = next
    setTimerState(next)
    persist(next)
  }

  // Reloj y detección de fin
  useEffect(() => {
    if (timer?.status !== 'running') return
    const tick = () => {
      const t = Date.now()
      setNow(t)
      const cur = timerRef.current
      if (cur?.status === 'running' && t >= cur.endAt) {
        setTimer({ ...cur, status: 'done' })
      }
    }
    tick()
    const i = setInterval(tick, 500)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(i); document.removeEventListener('visibilitychange', tick) }
  }, [timer?.status, timer?.endAt])

  // Pantalla encendida sólo mientras corre
  useEffect(() => {
    keepScreenOn(timer?.status === 'running')
    const reacquire = () => { if (!document.hidden && timerRef.current?.status === 'running') keepScreenOn(true) }
    document.addEventListener('visibilitychange', reacquire)
    return () => document.removeEventListener('visibilitychange', reacquire)
  }, [timer?.status])

  // Si terminó con la app abierta, la notificación ya no hace falta
  useEffect(() => { if (timer?.status === 'done') cancelNotification() }, [timer?.status])

  useAlarm(timer?.status === 'done')

  function start(book, minutes) {
    const durationSec = Math.max(1, Math.round(Number(minutes) * 60))
    const next = {
      bookId: book.bookId,
      title: book.title || t('tp_your_book'),
      totalPages: book.timePlan?.totalPages || book.pageCount || 0,
      startPage: Number(book.currentPage) || 0,
      startedAt: new Date().toISOString(),
      durationSec,
      doneSec: 0,
      endAt: Date.now() + durationSec * 1000,
      remainingMs: null,
      status: 'running',
    }
    setTimer(next)
    scheduleNotification(next, notifTexts(next))
  }

  function pause() {
    const cur = timerRef.current
    if (cur?.status !== 'running') return
    setTimer({ ...cur, status: 'paused', remainingMs: Math.max(0, cur.endAt - Date.now()), endAt: null })
    cancelNotification()
  }

  function resume() {
    const cur = timerRef.current
    if (cur?.status !== 'paused') return
    const next = { ...cur, status: 'running', endAt: Date.now() + cur.remainingMs, remainingMs: null }
    setTimer(next)
    scheduleNotification(next, notifTexts(next))
  }

  // Terminar antes de tiempo: se guarda lo que se leyó hasta ahora
  function finishEarly() {
    const cur = timerRef.current
    if (!cur || cur.status === 'done') return
    const elapsed = elapsedSecOf(cur)
    setTimer({ ...cur, status: 'done', early: true, doneSec: elapsed, durationSec: 0, endAt: null, remainingMs: null })
    cancelNotification()
  }

  function addExtraMinutes() {
    const cur = timerRef.current
    if (cur?.status !== 'done') return
    const extraSec = EXTRA_MINUTES * 60
    const next = {
      ...cur,
      status: 'running',
      early: false,
      doneSec: cur.doneSec + cur.durationSec,
      durationSec: extraSec,
      endAt: Date.now() + extraSec * 1000,
      remainingMs: null,
    }
    setTimer(next)
    scheduleNotification(next, notifTexts(next))
  }

  function discard() {
    setTimer(null)
    cancelNotification()
  }

  async function saveSession(endPage) {
    const cur = timerRef.current
    if (!cur || !user?.uid) return
    const seconds = cur.doneSec + cur.durationSec
    await addTimeSession(user.uid, cur.bookId, {
      startedAt: cur.startedAt,
      seconds,
      startPage: cur.startPage,
      endPage,
    })
    setTimer(null)
  }

  const remainingMs = remainingMsOf(timer, now)
  const value = { timer, remainingMs, start, pause, resume, finishEarly, discard }

  return (
    <ReadingTimerContext.Provider value={value}>
      {children}
      {timer && timer.status !== 'done' && (
        <MiniTimer timer={timer} remainingMs={remainingMs} onPause={pause} onResume={resume} t={t} />
      )}
      {timer?.status === 'done' && (
        <FinishSessionModal
          t={t}
          timer={timer}
          onSave={saveSession}
          onExtra={addExtraMinutes}
          onDiscard={discard}
        />
      )}
    </ReadingTimerContext.Provider>
  )
}

export function useReadingTimer() {
  return useContext(ReadingTimerContext)
}

// Pastilla flotante con el tiempo restante, visible en toda la app
function MiniTimer({ timer, remainingMs, onPause, onResume, t }) {
  const running = timer.status === 'running'
  return (
    <div className="fixed top-3 right-3 z-[70] flex items-center gap-2 bg-slate-900/90 backdrop-blur text-white rounded-full pl-3 pr-1 py-1 shadow-lg max-w-[60vw]">
      <Timer size={13} className={running ? 'text-amber-400 animate-pulse' : 'text-slate-400'} />
      <span className="text-xs font-bold tabular-nums">{formatClock(remainingMs)}</span>
      <span className="text-[10px] text-slate-300 truncate hidden sm:inline">{timer.title}</span>
      <button onClick={running ? onPause : onResume} aria-label={running ? t('tp_pause_timer') : t('tp_resume_timer')}
        className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
        {running ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
      </button>
    </div>
  )
}

function FinishSessionModal({ timer, onSave, onExtra, onDiscard, t }) {
  const [page, setPage]     = useState(String(timer.startPage || ''))
  const [saving, setSaving] = useState(false)
  const seconds = timer.doneSec + timer.durationSec
  const pageNum = Number(page)
  const valid = page !== '' && pageNum >= 0 && (!timer.totalPages || pageNum <= timer.totalPages)

  async function handleSave() {
    if (!valid || saving) return
    setSaving(true)
    try { await onSave(pageNum) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[450] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-5">
        <div className="flex flex-col items-center text-center mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${timer.early ? 'bg-violet-100' : 'bg-violet-500 animate-bounce'}`}>
            <BellRing size={26} className={timer.early ? 'text-violet-500' : 'text-white'} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{timer.early ? t('tp_session_done') : t('tp_time_up')}</h3>
          <p className="text-sm text-slate-500 mt-1">
            {t('tp_you_read', { time: formatDuration(seconds), title: timer.title })}
          </p>
        </div>

        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">
          {t('plan_where_left')}
        </label>
        <div className="relative mb-1">
          <input
            type="number" min="0" inputMode="numeric" autoFocus
            value={page}
            onChange={e => setPage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
            className="w-full px-4 py-3 pr-20 bg-slate-100 rounded-2xl text-lg font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-violet-400"
          />
          {timer.totalPages > 0 && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">/ {timer.totalPages}</span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mb-4">{t('tp_started_at', { n: timer.startPage || 0 })}</p>

        <button onClick={handleSave} disabled={!valid || saving}
          className="w-full py-3 bg-violet-500 text-white rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-95 transition-all shadow-sm">
          {saving ? t('common_saving') : t('tp_save_session')}
        </button>
        <div className="flex gap-2 mt-2">
          <button onClick={onExtra}
            className="flex-1 py-2.5 bg-violet-50 text-violet-600 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1">
            <Plus size={13} /> {t('tp_extra', { n: EXTRA_MINUTES })}
          </button>
          <button onClick={() => { if (window.confirm(t('tp_discard_confirm'))) onDiscard() }}
            className="flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-2xl text-xs font-semibold">
            {t('common_discard')}
          </button>
        </div>
      </div>
    </div>
  )
}
