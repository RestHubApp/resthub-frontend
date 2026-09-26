import { describe, expect, it } from 'vitest'

import {
  logsOf,
  logsParams,
  obsSearch,
  parseObsFilters,
  requestsOf,
  requestsParams,
  windowParams,
} from './obsFilters'

const VACIO = parseObsFilters(new URLSearchParams())

describe('parseObsFilters', () => {
  it('sin nada en la dirección son las últimas 24 horas de todos los locales', () => {
    expect(VACIO).toEqual({
      window: '24h',
      restaurantId: null,
      logLevel: null,
      logSearch: '',
      logRequestId: '',
      statusMin: null,
      route: '',
      requestId: '',
    })
  })

  it('lee cada filtro por su nombre en español', () => {
    const filtros = parseObsFilters(
      new URLSearchParams('ventana=6h&restaurante=7&nivel=error&buscar=+caja+&estado=500&ruta=/api/v1/orders&peticion=abc'),
    )
    expect(filtros).toMatchObject({
      window: '6h',
      restaurantId: 7,
      logLevel: 'error',
      logSearch: 'caja',
      statusMin: 500,
      route: '/api/v1/orders',
      requestId: 'abc',
    })
  })

  it('lo que no entiende queda en su valor por omisión', () => {
    const filtros = parseObsFilters(new URLSearchParams('ventana=2h&restaurante=-3&nivel=info&estado=99'))
    expect(filtros).toEqual(VACIO)
    expect(parseObsFilters(new URLSearchParams('restaurante=1.5&estado=600'))).toEqual(VACIO)
  })

  it('recorta la búsqueda a los 120 caracteres que acepta el servidor', () => {
    const largo = 'x'.repeat(200)
    expect(parseObsFilters(new URLSearchParams({ buscar: largo })).logSearch).toHaveLength(120)
    expect(parseObsFilters(new URLSearchParams({ peticion: largo })).requestId).toHaveLength(128)
  })
})

describe('obsSearch', () => {
  it('no escribe lo que está en su valor por omisión', () => {
    expect(obsSearch(VACIO).toString()).toBe('')
    expect(obsSearch({ ...VACIO, window: '7d', statusMin: 400 }).toString()).toBe('ventana=7d&estado=400')
  })

  it('ida y vuelta con la dirección', () => {
    const filtros = { ...VACIO, window: '1h' as const, restaurantId: 3, logLevel: 'warning' as const, route: '/x' }
    expect(parseObsFilters(obsSearch(filtros))).toEqual(filtros)
  })
})

describe('enlaces entre logs y peticiones', () => {
  const filtros = { ...VACIO, window: '6h' as const, restaurantId: 2, statusMin: 500, route: '/y', logSearch: 'z' }

  it('a las peticiones de un request_id, con la misma ventana y sin los otros filtros de peticiones', () => {
    expect(parseObsFilters(requestsOf(filtros, 'req-1'))).toEqual({
      ...filtros,
      statusMin: null,
      route: '',
      requestId: 'req-1',
    })
  })

  it('a los logs de un request_id, sin los otros filtros de logs', () => {
    expect(parseObsFilters(logsOf(filtros, 'req-2'))).toEqual({ ...filtros, logSearch: '', logRequestId: 'req-2' })
  })
})

describe('parámetros de las lecturas', () => {
  it('el restaurante viaja solo si se eligió uno', () => {
    expect(windowParams(VACIO)).toEqual({ window: '24h' })
    expect(windowParams({ ...VACIO, restaurantId: 4 })).toEqual({ window: '24h', restaurant_id: 4 })
  })

  it('los filtros vacíos no viajan', () => {
    expect(logsParams({ ...VACIO, logSearch: '  ' })).toEqual({ window: '24h' })
    expect(requestsParams(VACIO)).toEqual({ window: '24h' })
  })

  it('los filtros elegidos viajan con los nombres del API', () => {
    expect(logsParams({ ...VACIO, logLevel: 'error', logSearch: 'pago', logRequestId: 'r' })).toEqual({
      window: '24h',
      level: 'error',
      search: 'pago',
      request_id: 'r',
    })
    expect(requestsParams({ ...VACIO, statusMin: 500, route: '/a', requestId: 'r' })).toEqual({
      window: '24h',
      status_min: 500,
      route: '/a',
      request_id: 'r',
    })
  })
})
