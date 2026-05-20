// MercadoLibre API requiere OAuth token — no accesible desde el browser sin auth.
// El hook devuelve solo la URL de búsqueda correcta para ML Argentina.
export function useMercadoLibrePrice(book) {
  const q = book.isbn13 || book.isbn10
    || `${book.title} ${book.authors?.[0] || ''}`.trim()

  // Formato correcto: listado.mercadolibre.com.ar/TERMINO-CON-GUIONES
  const mlUrl = `https://listado.mercadolibre.com.ar/${
    q.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  }`

  return { mlPrice: null, mlLoading: false, mlUrl }
}
