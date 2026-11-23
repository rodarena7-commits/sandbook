import { useEffect, useRef, useState } from 'react'

const MIN_SCALE = 1
const MAX_SCALE = 5
const DOUBLE_TAP_SCALE = 2.5

// Imagen con zoom: pellizcar con dos dedos, doble toque (o doble clic) para acercar/alejar,
// arrastrar para moverse cuando está ampliada y rueda del mouse en la computadora.
// onZoomChange(true/false) avisa si está ampliada (para no cambiar de foto al deslizar).
export default function ZoomableImage({ src, onZoomChange }) {
  const [t, setT] = useState({ scale: 1, x: 0, y: 0 })
  const tRef = useRef(t)
  const pointers = useRef(new Map())
  const gesture = useRef(null)
  const lastTap = useRef(0)
  const boxRef = useRef(null)

  function apply(next) {
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.scale))
    // Que la imagen no se escape del cuadro
    const box = boxRef.current?.getBoundingClientRect()
    const maxX = box ? (box.width * (scale - 1)) / 2 : 0
    const maxY = box ? (box.height * (scale - 1)) / 2 : 0
    const v = scale === 1
      ? { scale: 1, x: 0, y: 0 }
      : { scale, x: Math.min(maxX, Math.max(-maxX, next.x)), y: Math.min(maxY, Math.max(-maxY, next.y)) }
    tRef.current = v
    setT(v)
  }

  // Al cambiar de foto vuelve al tamaño normal
  useEffect(() => { apply({ scale: 1, x: 0, y: 0 }) }, [src])
  useEffect(() => { onZoomChange?.(t.scale > 1.01) }, [t.scale > 1.01])

  // Zoom hacia el punto (cx, cy) de la pantalla
  function zoomAt(newScale, cx, cy) {
    const box = boxRef.current.getBoundingClientRect()
    const cur = tRef.current
    const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale))
    const px = cx - (box.left + box.width / 2)
    const py = cy - (box.top + box.height / 2)
    const k = s / cur.scale
    apply({ scale: s, x: px - (px - cur.x) * k, y: py - (py - cur.y) * k })
  }

  function onPointerDown(e) {
    // Capturar el dedo es una mejora (seguir el gesto aunque salga del cuadro); si falla, el gesto sigue igual
    try { e.currentTarget.setPointerCapture?.(e.pointerId) } catch {}
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = [...pointers.current.values()]
    if (pts.length === 2) {
      const [a, b] = pts
      gesture.current = {
        type: 'pinch',
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        start: { ...tRef.current },
        cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2,
      }
    } else if (pts.length === 1) {
      gesture.current = { type: 'pan', x: e.clientX, y: e.clientY, start: { ...tRef.current } }
    }
  }

  function onPointerMove(e) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (!g) return
    if (g.type === 'pinch' && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      tRef.current = g.start
      zoomAt(g.start.scale * (dist / g.dist), g.cx, g.cy)
    } else if (g.type === 'pan' && tRef.current.scale > 1) {
      apply({ ...tRef.current, x: g.start.x + (e.clientX - g.x), y: g.start.y + (e.clientY - g.y) })
    }
  }

  function onPointerUp(e) {
    pointers.current.delete(e.pointerId)
    const g = gesture.current
    if (pointers.current.size === 0) {
      // Doble toque: acercar o volver al tamaño normal
      const moved = g?.type === 'pan' && Math.hypot(e.clientX - g.x, e.clientY - g.y) > 10
      if (!moved && g?.type !== 'pinch') {
        const now = Date.now()
        if (now - lastTap.current < 300) {
          if (tRef.current.scale > 1.01) apply({ scale: 1, x: 0, y: 0 })
          else zoomAt(DOUBLE_TAP_SCALE, e.clientX, e.clientY)
          lastTap.current = 0
        } else {
          lastTap.current = now
        }
      }
      gesture.current = null
    } else if (pointers.current.size === 1) {
      // Queda un dedo después de pellizcar: sigue arrastrando desde ahí
      const [p] = [...pointers.current.values()]
      gesture.current = { type: 'pan', x: p.x, y: p.y, start: { ...tRef.current } }
    }
  }

  function onWheel(e) {
    zoomAt(tRef.current.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY)
  }

  return (
    <div
      ref={boxRef}
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        draggable={false}
        className="max-w-full max-h-full object-contain select-none"
        style={{
          transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
          transition: gesture.current ? 'none' : 'transform 0.15s ease-out',
        }}
      />
    </div>
  )
}
