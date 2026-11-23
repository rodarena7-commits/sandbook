import { dateLocale } from './locale'

// "hace 5 min", "hace 3 h", "hace 2 d" (o la fecha si pasó una semana), en el idioma de la app.
// t: función de traducción de useAuth(); language: idioma actual.
export function timeAgo(ts, t, language) {
  const ms = ts?.toMillis?.() ?? (ts?.seconds != null ? ts.seconds * 1000 : null)
  if (!ms) return ''
  const m = Math.floor((Date.now() - ms) / 60000)
  if (m < 1) return t('common_now')
  if (m < 60) return t('common_min_ago', { n: m })
  const h = Math.floor(m / 60)
  if (h < 24) return t('common_h_ago', { n: h })
  const d = Math.floor(h / 24)
  if (d < 7) return t('common_d_ago', { n: d })
  return new Date(ms).toLocaleDateString(dateLocale(language), { day: 'numeric', month: 'short' })
}
