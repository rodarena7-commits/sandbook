import { useState, useEffect, useRef, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Loader2, ExternalLink } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { proxiedFileUrl, downloadPdf } from '../../utils/freeBookFile'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

export default function PdfViewerSheet({ url, title, onClose }) {
  const canvasRef = useRef(null)
  const pdfRef    = useRef(null)
  const renderTaskRef = useRef(null)

  const [numPages, setNumPages] = useState(0)
  const [pageNum,  setPageNum]  = useState(1)
  const [scale,    setScale]    = useState(1.1)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [downloading, setDownloading] = useState(false)

  // Carga el documento
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const loadingTask = pdfjsLib.getDocument(proxiedFileUrl(url))
    loadingTask.promise.then(pdf => {
      if (cancelled) return
      pdfRef.current = pdf
      setNumPages(pdf.numPages)
      setPageNum(1)
      setLoading(false)
    }).catch(err => {
      if (cancelled) return
      console.error('PdfViewerSheet load error:', err)
      setError('No se pudo abrir el PDF. Probá verlo en la fuente original.')
      setLoading(false)
    })
    return () => {
      cancelled = true
      loadingTask.destroy?.()
    }
  }, [url])

  const renderPage = useCallback(async (num, currentScale) => {
    const pdf = pdfRef.current
    if (!pdf) return
    renderTaskRef.current?.cancel()
    const page = await pdf.getPage(num)
    const viewport = page.getViewport({ scale: currentScale })
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = viewport.width
    canvas.height = viewport.height
    const task = page.render({ canvasContext: canvas.getContext('2d'), viewport })
    renderTaskRef.current = task
    try { await task.promise } catch { /* cancelado por cambio de página, ignorar */ }
  }, [])

  useEffect(() => {
    if (!loading && !error) renderPage(pageNum, scale)
  }, [pageNum, scale, loading, error, renderPage])

  function prevPage() { setPageNum(p => Math.max(1, p - 1)) }
  function nextPage() { setPageNum(p => Math.min(numPages, p + 1)) }
  function zoomIn()  { setScale(s => Math.min(2.5, +(s + 0.2).toFixed(2))) }
  function zoomOut() { setScale(s => Math.max(0.5, +(s - 0.2).toFixed(2))) }

  async function handleDownload() {
    setDownloading(true)
    try {
      const filename = `${(title || 'libro').replace(/[^\w\s.-]/g, '').slice(0, 60)}.pdf`
      await downloadPdf(url, filename)
    } catch (e) {
      console.error('Download error:', e)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-900 flex-shrink-0">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white flex-shrink-0">
          <X size={16} />
        </button>
        <p className="flex-1 text-white text-xs font-semibold line-clamp-1 min-w-0">{title}</p>
        <button
          onClick={handleDownload}
          disabled={downloading || loading || !!error}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500 text-white rounded-full text-[11px] font-semibold disabled:opacity-40 flex-shrink-0"
        >
          {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto flex items-start justify-center py-4 px-2">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full text-white/80 pt-20">
            <Loader2 size={32} className="animate-spin mb-3" />
            <p className="text-sm">Abriendo PDF…</p>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center h-full text-center text-white/80 pt-20 px-6">
            <p className="text-sm mb-4">{error}</p>
            <a
              href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 rounded-2xl text-sm font-semibold"
            >
              <ExternalLink size={14} /> Abrir en el navegador
            </a>
          </div>
        )}
        {!loading && !error && (
          <canvas ref={canvasRef} className="shadow-2xl bg-white rounded-sm max-w-full" />
        )}
      </div>

      {/* Controles */}
      {!loading && !error && (
        <div className="flex items-center justify-center gap-3 px-3 py-3 bg-slate-900 flex-shrink-0">
          <button onClick={zoomOut} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white">
            <ZoomOut size={14} />
          </button>
          <button onClick={zoomIn} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white">
            <ZoomIn size={14} />
          </button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <button onClick={prevPage} disabled={pageNum <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <span className="text-white text-xs font-semibold min-w-[60px] text-center">
            {pageNum} / {numPages}
          </span>
          <button onClick={nextPage} disabled={pageNum >= numPages}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
