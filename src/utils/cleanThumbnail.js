/** Devuelve null si la URL es inválida o de placeholder */
export function cleanThumbnail(url) {
  if (!url) return null
  if (url.includes('placeholder')) return null
  if (url.includes('via.placeholder')) return null
  if (url.includes('text=NO')) return null
  return url
}
