import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Camera } from 'lucide-react'

export default function BarcodeScanner({ onScan, onClose }) {
  const [error, setError] = useState(null)
  const [started, setStarted] = useState(false)
  const scannerRef = useRef(null)
  const id = 'barcode-scanner-view'

  useEffect(() => {
    const scanner = new Html5Qrcode(id)
    scannerRef.current = scanner
    const didScan = { current: false }

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 120 } },
      async (decoded) => {
        if (didScan.current) return
        const clean = decoded.replace(/[^0-9X]/gi, '')
        if (clean.length === 10 || clean.length === 13) {
          didScan.current = true
          // Esperar a que el scanner se detenga antes de llamar onScan
          // para evitar que el componente se desmonte mientras el scanner sigue activo
          await scanner.stop().catch(() => {})
          onScan(clean)
        }
      },
      () => {}
    )
      .then(() => setStarted(true))
      .catch(() => setError('No se pudo acceder a la cámara. Revisá los permisos.'))

    return () => {
      if (!didScan.current) scanner.stop().catch(() => {})
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4 z-10">
        <p className="text-white font-semibold">Escanear ISBN</p>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Camera view */}
      <div className="w-full max-w-sm px-4">
        <div id={id} className="w-full rounded-2xl overflow-hidden" />
      </div>

      {/* Guide frame */}
      {started && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-amber-400 rounded-2xl" style={{ width: 270, height: 130 }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-0.5 bg-amber-400/60 animate-pulse" />
          </div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-24 px-6 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <p className="absolute bottom-12 text-white/50 text-xs text-center px-8">
        Apuntá la cámara al código de barras del libro
      </p>
    </div>
  )
}
