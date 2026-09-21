// Servidores ICE para las videollamadas. STUN (Google) alcanza cuando ambos están en redes
// "abiertas"; el TURN hace de relay cuando no (datos móviles, wifi con NAT estricto).
// Las credenciales de openrelay son públicas y compartidas: sirven para arrancar, pero para
// uso real conviene una cuenta propia (gratis) en metered.ca y definir VITE_ICE_SERVERS
// con un JSON, por ejemplo: [{"urls":"stun:..."},{"urls":"turn:...","username":"...","credential":"..."}]
const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp',
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
]

function fromEnv() {
  try {
    const raw = import.meta.env.VITE_ICE_SERVERS
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) && parsed.length ? parsed : null
  } catch {
    return null
  }
}

export const ICE_SERVERS = fromEnv() || DEFAULT_ICE_SERVERS

// Cámara + micrófono; si no hay cámara o se rechaza, cae a solo audio.
export async function getCallMedia() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    })
  } catch (e) {
    if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') throw e
    return navigator.mediaDevices.getUserMedia({ audio: true })
  }
}
