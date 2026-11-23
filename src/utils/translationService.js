import { languageFromCountry, languageFromDevice } from './languages'

// Idioma inicial según el lugar donde se instala la app: primero el país (por IP);
// si el país no tiene un idioma propio en la lista (por ej. EE.UU.), el idioma del teléfono;
// y si tampoco, inglés.
export async function detectUserLocation() {
  let countryCode = null
  try {
    const res = await fetch('https://freeipapi.com/api/json')
    if (res.ok) {
      const data = await res.json()
      countryCode = data.countryCode || null
    }
  } catch (err) {
    console.error('Error detecting location by IP:', err)
  }
  const language = languageFromCountry(countryCode) || languageFromDevice() || 'en'
  return { countryCode, language }
}

export function getLanguageFromCountry(countryCode) {
  return languageFromCountry(countryCode) || 'en'
}
