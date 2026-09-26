import type {
  ObsLogLevel,
  ObsLogsParams,
  ObsRequestsParams,
  ObsWindow,
  ObsWindowParams,
} from '../../../api/types'

// Los filtros del panel viven en la dirección (`?ventana=6h&peticion=…`): se
// comparten con un enlace, sobreviven a recargar y el detalle de un log enlaza
// de verdad a las peticiones de su `request_id`. Estos son los topes del
// backend; lo que los pasa se recorta en vez de mandar una petición que va a
// responder 422.

export const MAX_LOG_SEARCH = 120
export const MAX_REQUEST_ID = 128
export const MAX_ROUTE = 255

export interface WindowOption {
  readonly value: ObsWindow
  /** El rótulo corto del selector: `6 h`. */
  readonly label: string
  /** Para una frase: «en las últimas 6 horas». */
  readonly phrase: string
}

export const WINDOWS: readonly WindowOption[] = [
  { value: '1h', label: '1 h', phrase: 'en la última hora' },
  { value: '6h', label: '6 h', phrase: 'en las últimas 6 horas' },
  { value: '24h', label: '24 h', phrase: 'en las últimas 24 horas' },
  { value: '7d', label: '7 d', phrase: 'en los últimos 7 días' },
]

export const DEFAULT_WINDOW: ObsWindow = '24h'

/** Desde qué estado se listan las peticiones: todas, las rechazadas o las que fallaron. */
export const STATUS_MIN_OPTIONS = [
  { value: null, label: 'Todas' },
  { value: 400, label: '4xx y 5xx' },
  { value: 500, label: 'Solo 5xx' },
] as const

export interface ObsFilters {
  readonly window: ObsWindow
  readonly restaurantId: number | null
  readonly logLevel: ObsLogLevel | null
  readonly logSearch: string
  readonly logRequestId: string
  readonly statusMin: number | null
  readonly route: string
  readonly requestId: string
}

/** El nombre de cada filtro en la dirección. */
export const PARAM = {
  window: 'ventana',
  restaurantId: 'restaurante',
  logLevel: 'nivel',
  logSearch: 'buscar',
  logRequestId: 'log_peticion',
  statusMin: 'estado',
  route: 'ruta',
  requestId: 'peticion',
} as const satisfies Record<keyof ObsFilters, string>

const LEVELS: readonly ObsLogLevel[] = ['warning', 'error']
const MIN_STATUS = 100
const MAX_STATUS = 599

function positiveInt(raw: string | null, max = Number.MAX_SAFE_INTEGER): number | null {
  if (raw === null || !/^\d+$/u.test(raw)) {
    return null
  }
  const numero = Number(raw)
  return numero >= 1 && numero <= max ? numero : null
}

function text(raw: string | null, max: number): string {
  return (raw ?? '').trim().slice(0, max)
}

function statusMin(raw: string | null): number | null {
  const numero = positiveInt(raw, MAX_STATUS)
  return numero !== null && numero >= MIN_STATUS ? numero : null
}

/** Los filtros de la dirección; lo que no se entiende queda en su valor por omisión. */
export function parseObsFilters(search: URLSearchParams): ObsFilters {
  const ventana = WINDOWS.find((option) => option.value === search.get(PARAM.window))
  const nivel = LEVELS.find((level) => level === search.get(PARAM.logLevel))
  return {
    window: ventana?.value ?? DEFAULT_WINDOW,
    restaurantId: positiveInt(search.get(PARAM.restaurantId)),
    logLevel: nivel ?? null,
    logSearch: text(search.get(PARAM.logSearch), MAX_LOG_SEARCH),
    logRequestId: text(search.get(PARAM.logRequestId), MAX_REQUEST_ID),
    statusMin: statusMin(search.get(PARAM.statusMin)),
    route: text(search.get(PARAM.route), MAX_ROUTE),
    requestId: text(search.get(PARAM.requestId), MAX_REQUEST_ID),
  }
}

/**
 * La dirección de unos filtros. Lo que está en su valor por omisión no se
 * escribe, así el enlace del panel sin filtros queda limpio.
 */
export function obsSearch(filters: ObsFilters): URLSearchParams {
  const params = new URLSearchParams()
  const valores: Record<keyof ObsFilters, string> = {
    window: filters.window === DEFAULT_WINDOW ? '' : filters.window,
    restaurantId: filters.restaurantId === null ? '' : String(filters.restaurantId),
    logLevel: filters.logLevel ?? '',
    logSearch: filters.logSearch.trim(),
    logRequestId: filters.logRequestId.trim(),
    statusMin: filters.statusMin === null ? '' : String(filters.statusMin),
    route: filters.route.trim(),
    requestId: filters.requestId.trim(),
  }
  for (const [clave, valor] of Object.entries(valores) as [keyof ObsFilters, string][]) {
    if (valor !== '') {
      params.set(PARAM[clave], valor)
    }
  }
  return params
}

/**
 * El enlace a las peticiones de un `request_id`, con la misma ventana y el
 * mismo restaurante. Los demás filtros de peticiones se sueltan: si no,
 * podrían esconder justo la que se busca.
 */
export function requestsOf(filters: ObsFilters, requestId: string): URLSearchParams {
  return obsSearch({ ...filters, statusMin: null, route: '', requestId })
}

/** El enlace a los logs de un `request_id`, soltando los demás filtros de logs. */
export function logsOf(filters: ObsFilters, requestId: string): URLSearchParams {
  return obsSearch({ ...filters, logLevel: null, logSearch: '', logRequestId: requestId })
}

/** La ventana y el restaurante, lo único que comparten todas las lecturas. */
export function windowParams(filters: ObsFilters): ObsWindowParams {
  return filters.restaurantId === null
    ? { window: filters.window }
    : { window: filters.window, restaurant_id: filters.restaurantId }
}

// Un filtro vacío no viaja: la clave de caché de «sin filtro» es una sola.
function withoutEmpty<T extends object>(params: T): T {
  return Object.fromEntries(
    Object.entries(params).filter(([, valor]) => valor !== null && valor !== undefined && valor !== ''),
  ) as T
}

export function logsParams(filters: ObsFilters): Omit<ObsLogsParams, 'before_id' | 'limit'> {
  return withoutEmpty({
    ...windowParams(filters),
    level: filters.logLevel,
    search: filters.logSearch.trim(),
    request_id: filters.logRequestId.trim(),
  })
}

export function requestsParams(filters: ObsFilters): Omit<ObsRequestsParams, 'before_id' | 'limit'> {
  return withoutEmpty({
    ...windowParams(filters),
    status_min: filters.statusMin,
    route: filters.route.trim(),
    request_id: filters.requestId.trim(),
  })
}
