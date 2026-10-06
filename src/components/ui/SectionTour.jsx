import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { X, ChevronRight } from 'lucide-react'

const KEY_PREFIX = 'sandbook_tour_v1_'
// El recorrido por secciones espera a que terminen el tutorial general y el onboarding
const PREREQ_KEYS = ['sandbook_tutorial_v1', 'sandbook_onboarding_v1']

const PAD = 6          // aire alrededor del elemento resaltado
const TIP_W = 320      // ancho máximo del globo

function safeGet(key) {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSet(key) {
  try { localStorage.setItem(key, '1') } catch {}
}

export function resetSectionTours() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(KEY_PREFIX))
      .forEach(k => localStorage.removeItem(k))
  } catch {}
}

function prereqsDone() {
  return PREREQ_KEYS.every(k => safeGet(k))
}

// Recorrido guiado de una sección: oscurece la pantalla, resalta cada botón real (data-tour="...")
// y explica para qué sirve. Se muestra una sola vez por sección.
// steps: [{ target?: '[data-tour="x"]', title, desc }]  — sin target es una tarjeta centrada.
export default function SectionTour({ id, steps }) {
  const seenKey = KEY_PREFIX + id
  const [list, setList]     = useState(null)   // pasos que se van a mostrar; null = inactivo
  const [index, setIndex]   = useState(0)
  const [rect, setRect]     = useState(null)
  const tipRef = useRef(null)
  const [tipH, setTipH]     = useState(150)

  // Espera a que no haya otros overlays pendientes y a que la pantalla haya renderizado
  useEffect(() => {
    if (safeGet(seenKey)) return
    let cancelled = false
    let timer
    function tryStart() {
      if (cancelled) return
      if (!prereqsDone()) { timer = setTimeout(tryStart, 1000); return }
      timer = setTimeout(() => {
        if (cancelled) return
        const available = steps.filter(s => !s.target || document.querySelector(s.target))
        if (available.length) { setList(available); setIndex(0) }
      }, 700)
    }
    tryStart()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [seenKey])

  const step = list?.[index]

  function measure() {
    if (!step?.target) { setRect(null); return }
    const el = document.querySelector(step.target)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }

  // Al cambiar de paso: traer el elemento a la vista y medirlo
  useEffect(() => {
    if (!step) return
    const el = step.target ? document.querySelector(step.target) : null
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    measure()
    const t = setTimeout(measure, 250)   // después del scroll suave / animaciones
    return () => clearTimeout(t)
  }, [step])

  useEffect(() => {
    if (!step) return
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step])

  useLayoutEffect(() => {
    if (tipRef.current) setTipH(tipRef.current.offsetHeight)
  }, [index, list])

  function finish() {
    safeSet(seenKey)
    setList(null)
  }

  if (!step) return null

  const last = index === list.length - 1
  const vw = window.innerWidth
  const vh = window.innerHeight
  const tipW = Math.min(TIP_W, vw - 24)

  // Posición del globo: debajo del elemento si entra, si no arriba; centrado si no hay elemento
  let tipStyle
  if (rect) {
    const below = rect.top + rect.height + PAD + 12 + tipH <= vh - 8
    const top = below
      ? rect.top + rect.height + PAD + 12
      : Math.max(8, rect.top - PAD - 12 - tipH)
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - tipW / 2), vw - tipW - 12)
    tipStyle = { top, left, width: tipW }
  } else {
    tipStyle = { top: Math.max(12, vh / 2 - tipH / 2), left: (vw - tipW) / 2, width: tipW }
  }

  return (
    <div className="fixed inset-0 z-[250]" role="dialog" aria-label="Guía de la sección">
      {/* Bloquea toques en la app mientras dura la guía */}
      <div className="absolute inset-0" onClick={e => e.stopPropagation()} />

      {rect ? (
        <div
          className="absolute rounded-2xl pointer-events-none transition-all duration-300 ring-2 ring-amber-400"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.72)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/70" />
      )}

      <div
        ref={tipRef}
        className="absolute bg-white rounded-2xl shadow-2xl p-4 transition-all duration-300"
        style={tipStyle}
      >
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h3 className="font-bold text-slate-800 text-sm leading-tight">{step.title}</h3>
          <button onClick={finish} aria-label="Cerrar guía"
            className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <X size={12} />
          </button>
        </div>
        <p className="text-[13px] text-slate-600 leading-relaxed">{step.desc}</p>

        <div className="flex items-center justify-between mt-4">
          <span className="text-[11px] font-medium text-slate-400 tabular-nums">{index + 1} / {list.length}</span>
          <div className="flex items-center gap-2">
            {index > 0 ? (
              <button onClick={() => setIndex(i => i - 1)}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                Atrás
              </button>
            ) : (
              <button onClick={finish} className="px-3 py-1.5 text-slate-400 rounded-full text-xs font-medium">
                Saltar
              </button>
            )}
            <button onClick={() => (last ? finish() : setIndex(i => i + 1))}
              className="px-4 py-1.5 bg-amber-500 text-white rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1">
              {last ? '¡Entendido!' : 'Siguiente'}
              {!last && <ChevronRight size={13} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
