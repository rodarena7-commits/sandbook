// Locale para fechas y números según el idioma de la app (español rioplatense por defecto)
export function dateLocale(language) {
  return !language || language === 'es' ? 'es-AR' : language
}
