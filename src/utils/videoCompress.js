// Recomprime un video en el navegador para guardarlo en Firestore (no usamos Firebase Storage):
// se reproduce en un <video> oculto, se dibuja en un canvas más chico y se graba con MediaRecorder
// a bajo bitrate. Tarda lo mismo que dura el video (se procesa en tiempo real).

export const MAX_VIDEO_SECONDS = 30
const MAX_SIDE      = 640        // lado mayor (≈ 480p)
const VIDEO_BPS     = 600_000
const AUDIO_BPS     = 48_000
const MAX_BYTES     = 4 * 1024 * 1024

const TYPES = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4']

export function canRecordVideo() {
  return typeof MediaRecorder !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream
}

function loadVideo(url) {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video')
    v.preload = 'auto'
    v.playsInline = true
    v.src = url
    v.onloadedmetadata = () => resolve(v)
    v.onerror = () => reject(new Error('No se pudo leer el video'))
  })
}

// Los .webm grabados en el navegador no traen la duración (Infinity) hasta recorrerlos:
// saltar al final obliga al navegador a calcularla.
async function ensureDuration(v) {
  if (isFinite(v.duration)) return
  await new Promise(resolve => {
    const done = () => { v.removeEventListener('durationchange', check); resolve() }
    const check = () => { if (isFinite(v.duration)) done() }
    v.addEventListener('durationchange', check)
    v.currentTime = 1e101
    setTimeout(done, 3000)
  })
  v.currentTime = 0
}

// onProgress(0..1). Devuelve { blob, mime, duration, poster, trimmed }
export async function compressVideo(file, onProgress = () => {}) {
  if (!canRecordVideo()) throw new Error('Este dispositivo no permite procesar videos')
  const url = URL.createObjectURL(file)
  let audioCtx
  try {
    const video = await loadVideo(url)
    await ensureDuration(video)
    const fullDuration = isFinite(video.duration) ? video.duration : MAX_VIDEO_SECONDS
    const duration = Math.min(fullDuration, MAX_VIDEO_SECONDS)

    const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth || MAX_SIDE, video.videoHeight || MAX_SIDE))
    const w = Math.max(2, Math.round((video.videoWidth || MAX_SIDE) * scale / 2) * 2)
    const h = Math.max(2, Math.round((video.videoHeight || MAX_SIDE) * scale / 2) * 2)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    // Audio por WebAudio: se graba sin sonar por los parlantes
    const tracks = [...canvas.captureStream(30).getVideoTracks()]
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const src = audioCtx.createMediaElementSource(video)
      const dest = audioCtx.createMediaStreamDestination()
      src.connect(dest)
      tracks.push(...dest.stream.getAudioTracks())
    } catch { /* sin audio */ }

    const mime = TYPES.find(t => MediaRecorder.isTypeSupported(t)) || ''
    const recorder = new MediaRecorder(new MediaStream(tracks), {
      ...(mime ? { mimeType: mime } : {}),
      videoBitsPerSecond: VIDEO_BPS,
      audioBitsPerSecond: AUDIO_BPS,
    })
    const chunks = []
    recorder.ondataavailable = e => { if (e.data?.size) chunks.push(e.data) }

    // Miniatura del primer cuadro
    video.currentTime = 0
    await new Promise(r => { video.onseeked = r; setTimeout(r, 1500) })
    ctx.drawImage(video, 0, 0, w, h)
    const posterCanvas = document.createElement('canvas')
    const ps = Math.min(1, 240 / Math.max(w, h))
    posterCanvas.width = Math.round(w * ps)
    posterCanvas.height = Math.round(h * ps)
    posterCanvas.getContext('2d').drawImage(canvas, 0, 0, posterCanvas.width, posterCanvas.height)
    const poster = posterCanvas.toDataURL('image/jpeg', 0.6)

    const done = new Promise(resolve => { recorder.onstop = resolve })
    // Reloj propio a 30 cuadros/s (no requestAnimationFrame): sigue dibujando aunque la
    // pantalla no esté refrescando, por ejemplo si el WebView baja la frecuencia.
    let timer
    const draw = () => {
      ctx.drawImage(video, 0, 0, w, h)
      onProgress(Math.min(1, video.currentTime / duration))
      if (video.currentTime >= duration || video.ended) {
        clearInterval(timer)
        if (recorder.state !== 'inactive') recorder.stop()
        video.pause()
      }
    }

    recorder.start(1000)
    await audioCtx?.resume?.().catch(() => {})
    try {
      await video.play()
    } catch {
      // Política de reproducción automática: sin sonido sí deja (el video sale mudo)
      video.muted = true
      await video.play()
    }
    timer = setInterval(draw, 33)
    video.onended = () => { clearInterval(timer); if (recorder.state !== 'inactive') recorder.stop() }
    await done
    clearInterval(timer)
    onProgress(1)
    // Duración real de lo grabado: el resultado también es un .webm sin duración en sus datos
    const recorded = Math.min(duration, video.currentTime || duration)

    const blob = new Blob(chunks, { type: recorder.mimeType || mime || 'video/webm' })
    if (blob.size > MAX_BYTES) throw new Error('El video quedó muy pesado. Probá con uno más corto.')
    return { blob, mime: blob.type, duration: recorded, poster, trimmed: fullDuration > MAX_VIDEO_SECONDS + 0.5 }
  } finally {
    URL.revokeObjectURL(url)
    try { audioCtx?.close() } catch {}
  }
}

// Partes de ~600 KB → en base64 ≈ 800 KB, por debajo del límite de 1 MB por documento
export const CHUNK_BYTES = 600 * 1024

export async function blobToBase64Chunks(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer())
  const parts = []
  for (let i = 0; i < buf.length; i += CHUNK_BYTES) {
    const slice = buf.subarray(i, i + CHUNK_BYTES)
    let bin = ''
    for (let j = 0; j < slice.length; j += 0x8000) bin += String.fromCharCode(...slice.subarray(j, j + 0x8000))
    parts.push(btoa(bin))
  }
  return parts
}

export function base64ChunksToBlob(parts, mime) {
  const arrays = parts.map(b64 => {
    const bin = atob(b64)
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
    return arr
  })
  return new Blob(arrays, { type: mime || 'video/webm' })
}
