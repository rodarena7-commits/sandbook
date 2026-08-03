export async function detectUserLocation() {
  try {
    const res = await fetch('https://freeipapi.com/api/json')
    if (res.ok) {
      const data = await res.json()
      const countryCode = data.countryCode || null
      const language = getLanguageFromCountry(countryCode)
      return { countryCode, language }
    }
  } catch (err) {
    console.error('Error detecting location by IP:', err)
  }

  // Respaldo por idioma del dispositivo del usuario
  const navLang = navigator.language || navigator.userLanguage || 'es'
  const language = navLang.startsWith('pt') ? 'pt' : navLang.startsWith('en') ? 'en' : 'es'
  return { countryCode: null, language }
}

export function getLanguageFromCountry(countryCode) {
  if (!countryCode) return 'es'
  const c = countryCode.toUpperCase()

  // Países de habla hispana
  const spanishCountries = [
    'AR', 'ES', 'MX', 'UY', 'CL', 'CO', 'PE', 'PY', 'BO', 'VE',
    'EC', 'GT', 'HN', 'SV', 'NI', 'CR', 'PA', 'DO', 'PR', 'GQ'
  ]
  if (spanishCountries.includes(c)) return 'es'

  // Países de habla portuguesa
  const portugueseCountries = ['BR', 'PT']
  if (portugueseCountries.includes(c)) return 'pt'

  // Idioma universal por defecto para el resto del mundo
  return 'en'
}
