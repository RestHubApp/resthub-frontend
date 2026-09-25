// Formatos de dinero y tiempo de los pedidos.
//
// El API manda los montos como texto decimal ("28.00") para no perder
// centimos en un `float`. Las sumas del carrito se hacen en centimos enteros
// por la misma razon, y solo se formatean al mostrarlas.

const MONEY = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })
const HOUR = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' })
const DATE_TIME = new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' })
const CENTS = 100
const MS_PER_MINUTE = 60_000
const MINUTES_PER_HOUR = 60

/** `S/ 28.00`, con el formato del Peru. */
export function formatMoney(value: string | number): string {
  return MONEY.format(Number(value))
}

export function toCents(value: string | number): number {
  return Math.round(Number(value) * CENTS)
}

export function formatCents(cents: number): string {
  return formatMoney(cents / CENTS)
}

/** El monto en el formato que espera el API: "100.00". */
export function centsToApi(cents: number): string {
  return (cents / CENTS).toFixed(2)
}

export function formatHour(iso: string): string {
  return HOUR.format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso))
}

export function minutesSince(iso: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / MS_PER_MINUTE))
}

/** "3 min", "1 h 05 min". */
export function formatMinutes(minutes: number): string {
  if (minutes < MINUTES_PER_HOUR) {
    return `${String(minutes)} min`
  }
  const rest = String(minutes % MINUTES_PER_HOUR).padStart(2, '0')
  return `${String(Math.floor(minutes / MINUTES_PER_HOUR))} h ${rest} min`
}

/** El dia de hoy en la hora del navegador, como `AAAA-MM-DD`. */
export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${String(now.getFullYear())}-${month}-${day}`
}

/** "platos" o "plato", segun la cantidad. */
export function dishCount(count: number): string {
  return `${String(count)} ${count === 1 ? 'plato' : 'platos'}`
}
