import { routePatterns } from '@/services/paths'

/**
 * La búsqueda de la paleta: sin importar tildes ni mayúsculas, y con palabras
 * sueltas («caja abrir» encuentra «Abrir caja»).
 */

/** El texto en minúsculas y sin tildes: «Menú» y «menu» se vuelven iguales. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/**
 * Otras palabras con las que alguien busca una pantalla o una acción, por
 * ejemplo «cuenta» para cobrar. Van sin tildes; la clave es la ruta de la
 * pantalla o el id de la acción.
 */
export const QUICK_SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  [routePatterns.orders]: ['comanda', 'orden', 'mesa', 'tomar pedido'],
  [routePatterns.board]: ['cocina', 'comandas'],
  [routePatterns.kitchen]: ['comandas', 'preparar'],
  [routePatterns.cash]: ['cobrar', 'cobro', 'efectivo', 'turno', 'cierre'],
  [routePatterns.reservations]: ['reservacion', 'reservar'],
  [routePatterns.customers]: ['comensales', 'contactos'],
  [routePatterns.menu]: ['carta', 'platos', 'platillos', 'precios'],
  [routePatterns.inventory]: ['stock', 'insumos', 'existencias', 'almacen', 'compras', 'merma'],
  [routePatterns.tables]: ['salon', 'plano', 'sillas'],
  [routePatterns.staff]: ['empleados', 'meseros', 'trabajadores', 'equipo'],
  [routePatterns.billing]: ['boleta', 'factura', 'sunat', 'ruc'],
  [routePatterns.insights]: ['ventas', 'resumen', 'reportes', 'estadisticas'],
  'abrir-caja': ['turno', 'iniciar', 'efectivo'],
  'nuevo-plato': ['carta', 'agregar plato', 'platillo'],
  'nueva-categoria': ['carta', 'agregar categoria'],
  'nueva-mesa': ['salon', 'agregar mesa'],
  'reglas-de-stock': ['minimos', 'alertas', 'existencias'],
  'datos-fiscales': ['ruc', 'razon social', 'sunat', 'boleta', 'factura'],
}

/**
 * Qué tan bien coincide una opción con lo escrito, de 0 (no coincide) a 1.
 *
 * Todas las palabras escritas deben estar en el texto de la opción (su nombre,
 * su descripción y sus sinónimos). Empezar con lo escrito pesa más.
 */
export function matchScore(search: string, keywords: readonly string[]): number {
  const words = normalizeText(search).split(/\s+/u).filter(Boolean)
  if (words.length === 0) {
    return 1
  }
  const haystack = keywords.map(normalizeText)
  const [title = ''] = haystack
  const text = haystack.join(' ')
  if (!words.every((word) => text.includes(word))) {
    return 0
  }
  return words.every((word) => title.startsWith(word) || title.includes(` ${word}`)) ? 1 : 0.5
}
