import { useCallback, useEffect, useRef, useState } from 'react'

export const MAX_VOICE_SECONDS = 60

const PREFERRED_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

// Graba audio con MediaRecorder y lo devuelve como data URL (base64). Opus a 24 kbps:
// 60 s ≈ 180 KB, muy por debajo del límite de 1 MB por documento de Firestore.
export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds]     = useState(0)
  const [error, setError]         = useState('')

  const recorderRef  = useRef(null)
  const streamRef    = useRef(null)
  const chunksRef    = useRef([])
  const timerRef     = useRef(null)
  const startedAtRef = useRef(0)
  const cancelledRef = useRef(false)

  const release = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    recorderRef.current = null
    setRecording(false)
  }, [])

  useEffect(() => () => {
    const rec = recorderRef.current
    if (rec && rec.state !== 'inactive') { rec.onstop = null; rec.stop() }
    release()
  }, [release])

  const start = useCallback(async () => {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Tu dispositivo no permite grabar audio.')
      return false
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = PREFERRED_TYPES.find(t => MediaRecorder.isTypeSupported(t))
      const rec = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 24000 })
      chunksRef.current = []
      cancelledRef.current = false
      rec.ondataavailable = e => { if (e.data?.size) chunksRef.current.push(e.data) }
      rec.start()
      recorderRef.current = rec
      startedAtRef.current = Date.now()
      setSeconds(0)
      setRecording(true)
      timerRef.current = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000))
      }, 250)
      return true
    } catch (e) {
      console.error('useVoiceRecorder start error:', e)
      release()
      setError(e?.name === 'NotAllowedError'
        ? 'Permití el acceso al micrófono para grabar.'
        : 'No se pudo iniciar la grabación.')
      return false
    }
  }, [release])

  // Resuelve { audio, duration } o null si se canceló / no hay nada grabado.
  const stop = useCallback(() => new Promise(resolve => {
    const rec = recorderRef.current
    if (!rec || rec.state === 'inactive') { release(); return resolve(null) }
    rec.onstop = async () => {
      const duration = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
      const cancelled = cancelledRef.current
      release()
      if (cancelled || blob.size === 0) return resolve(null)
      try {
        resolve({ audio: await blobToDataUrl(blob), duration })
      } catch {
        resolve(null)
      }
    }
    rec.stop()
  }), [release])

  const cancel = useCallback(() => {
    cancelledRef.current = true
    return stop()
  }, [stop])

  return { recording, seconds, error, start, stop, cancel }
}
