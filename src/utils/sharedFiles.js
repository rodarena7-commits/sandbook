// Subida de ebooks locales para compartirlos con un seguidor dentro de la app.
// No usamos Firebase Storage (no está habilitado en este proyecto) — el archivo
// se sube al mismo servidor Express que ya sirve la web (server.js), a un disco
// efímero: alcanza para "te mando este PDF" pero no es almacenamiento permanente.
const API_BASE = 'https://sandbook-api.onrender.com'

const EXT_BY_TYPE = { pdf: 'pdf', docx: 'docx', image: 'jpg' }

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export async function uploadSharedFile(blob, { type = 'pdf', mimeType } = {}) {
  const ext = EXT_BY_TYPE[type] || 'bin'
  const filename = `${generateId()}.${ext}`
  const url = `${API_BASE}/api/shared-files/${filename}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType || blob.type || 'application/octet-stream' },
    body: blob,
  })
  if (!res.ok) throw new Error('No se pudo subir el archivo')
  return url
}
