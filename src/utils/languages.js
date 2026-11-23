// Idiomas disponibles. name: cómo se llama el idioma en ese mismo idioma.
export const LANGUAGES = [
  { code: 'es', name: 'Español',   flag: '🇪🇸' },
  { code: 'en', name: 'English',   flag: '🇬🇧' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'Français',  flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch',   flag: '🇩🇪' },
  { code: 'it', name: 'Italiano',  flag: '🇮🇹' },
  { code: 'ru', name: 'Русский',   flag: '🇷🇺' },
  { code: 'zh', name: '中文',       flag: '🇨🇳' },
  { code: 'ja', name: '日本語',     flag: '🇯🇵' },
  { code: 'hi', name: 'हिन्दी',      flag: '🇮🇳' },
  { code: 'ar', name: 'العربية',    flag: '🇸🇦', rtl: true },
]

export const SUPPORTED = LANGUAGES.map(l => l.code)

export function isRtl(code) {
  return !!LANGUAGES.find(l => l.code === code)?.rtl
}

// Ajusta <html lang> y la dirección de escritura (árabe: derecha a izquierda)
export function applyDocumentLanguage(code) {
  try {
    document.documentElement.lang = code
    document.documentElement.dir = isRtl(code) ? 'rtl' : 'ltr'
  } catch {}
}

// Idioma por país (para la detección por ubicación al instalar)
const BY_COUNTRY = {
  es: ['AR', 'ES', 'MX', 'UY', 'CL', 'CO', 'PE', 'PY', 'BO', 'VE', 'EC', 'GT', 'HN', 'SV', 'NI', 'CR', 'PA', 'DO', 'PR', 'GQ', 'CU'],
  pt: ['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL'],
  fr: ['FR', 'MC', 'SN', 'CI', 'ML', 'BF', 'NE', 'GN', 'BJ', 'TG', 'CM', 'GA', 'CG', 'CD', 'MG', 'HT', 'LU'],
  de: ['DE', 'AT', 'LI'],
  it: ['IT', 'SM', 'VA'],
  ru: ['RU', 'BY', 'KZ', 'KG'],
  zh: ['CN', 'TW', 'HK', 'MO', 'SG'],
  ja: ['JP'],
  hi: ['IN'],
  ar: ['SA', 'AE', 'EG', 'MA', 'DZ', 'TN', 'LY', 'IQ', 'JO', 'LB', 'SY', 'KW', 'QA', 'BH', 'OM', 'YE', 'SD', 'PS', 'MR'],
}

export function languageFromCountry(countryCode) {
  if (!countryCode) return null
  const c = countryCode.toUpperCase()
  for (const [code, countries] of Object.entries(BY_COUNTRY)) {
    if (countries.includes(c)) return code
  }
  return null
}

// Idioma del teléfono, si es uno de los disponibles
export function languageFromDevice() {
  try {
    const list = navigator.languages?.length ? navigator.languages : [navigator.language]
    for (const tag of list) {
      const code = (tag || '').slice(0, 2).toLowerCase()
      if (SUPPORTED.includes(code)) return code
    }
  } catch {}
  return null
}
