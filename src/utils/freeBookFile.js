import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

// Los CDN de Internet Archive/Gutenberg no mandan CORS en el archivo en sí,
// así que todo pasa por nuestro proxy (server.js → /api/free-book-file),
// que sí agrega Access-Control-Allow-Origin y permite forzar la descarga.
export function proxiedFileUrl(originalUrl, { download = false, filename } = {}) {
  const params = new URLSearchParams({ url: originalUrl })
  if (download) params.set('download', '1')
  if (filename) params.set('filename', filename)
  return `/api/free-book-file?${params.toString()}`
}

// Internet Archive no da el nombre exacto del PDF en la búsqueda, sólo que
// existe un formato "Text PDF"/"Grayscale PDF". Se resuelve al vuelo con la
// API de metadata (sí tiene CORS habilitado, a diferencia del archivo en sí).
export async function resolveArchivePdfUrl(identifier) {
  const res = await fetch(`https://archive.org/metadata/${identifier}`)
  if (!res.ok) return null
  const data = await res.json()
  const files = data?.files || []
  const pdfFile =
    files.find(f => /text pdf/i.test(f.format || '')) ||
    files.find(f => /pdf/i.test(f.format || ''))
  if (!pdfFile) return null
  return `https://archive.org/download/${identifier}/${pdfFile.name}`
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function downloadPdf(originalUrl, filename) {
  const url = proxiedFileUrl(originalUrl, { download: true, filename })

  if (Capacitor.isNativePlatform()) {
    const res = await fetch(url)
    if (!res.ok) throw new Error('No se pudo descargar el archivo')
    const blob = await res.blob()
    const base64 = await blobToBase64(blob)
    const written = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
    })
    await Share.share({ title: filename, url: written.uri })
    return
  }

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
