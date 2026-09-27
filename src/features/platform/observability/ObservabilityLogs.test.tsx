import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import {
  entrarAPlataforma,
  ESTADOS_OBS,
  logObs,
  montarPlataforma,
  peticionObs,
  RESUMEN_OBS,
  RUTAS_OBS,
  SERIE_OBS,
} from '#jest/fixtures/plataforma'
import { servidor } from '#jest/harness'

const FILTRAR_LOGS = 'Filtrar logs'
const FILTRAR_PETICIONES = 'Filtrar peticiones'

const BASE = '/platform/observability'
const LOGS = `${BASE}/logs`
const PETICIONES = `${BASE}/requests`
const VACIA = { items: [], next_before_id: null }
const VER_DETALLE = { name: 'Ver detalle' }

function abrirPanel(logs: unknown = { items: [logObs()], next_before_id: null }, peticiones: unknown = VACIA) {
  const api = servidor()
    .on('get', `${BASE}/summary`, RESUMEN_OBS)
    .on('get', `${BASE}/timeseries`, SERIE_OBS)
    .on('get', `${BASE}/status`, ESTADOS_OBS)
    .on('get', `${BASE}/routes`, RUTAS_OBS)
    .on('get', LOGS, logs)
    .on('get', PETICIONES, peticiones)
    .on('get', '/platform/restaurants', { items: [], total: 0 })
  entrarAPlataforma()
  return { api, ...montarPlataforma('/plataforma/observabilidad') }
}

function filtros(nombre: string): HTMLElement {
  return screen.getByRole('search', { name: nombre })
}

describe('logs del panel', () => {
  it('lista los logs y abre su detalle con campos y traceback, sin interpretarlos como HTML', async () => {
    const { api, user } = abrirPanel()
    api.on('get', `${LOGS}/50`, { ...logObs(), fields: { order_id: 12, nota: '<b>x</b>' }, traceback: 'Traceback (most recent call last)' })

    const fila = await screen.findByRole('row', { name: /payment\.failed/u })
    expect(within(fila).getByText('Con traceback')).toBeInTheDocument()
    await user.click(within(fila).getByRole('button', VER_DETALLE))

    const campos = await screen.findByRole('region', { name: 'Campos del evento' })
    expect(campos).toHaveTextContent('"nota": "<b>x</b>"')
    expect(screen.getByRole('region', { name: 'Traceback' })).toHaveTextContent('Traceback (most recent call last)')
    expect(within(fila).getByRole('button', { name: 'Ocultar' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('desde el detalle de un log se va a las peticiones de su request_id', async () => {
    const { api, user, router } = abrirPanel()
    api.on('get', `${LOGS}/50`, { ...logObs(), fields: {}, traceback: null })

    await user.click(within(await screen.findByRole('row', { name: /payment\.failed/u })).getByRole('button', VER_DETALLE))
    expect(await screen.findByText('El evento no trae campos.')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Ver las peticiones de/u }))

    await waitFor(() => {
      expect(api.llamadas('get', PETICIONES).at(-1)?.params).toEqual({ window: '24h', request_id: 'req-abc', limit: 50 })
    })
    expect(router.state.location.hash).toBe('#peticiones')
  })

  it('filtra por nivel al elegir y por texto al buscar, y quita los filtros', async () => {
    const { api, user } = abrirPanel()
    await screen.findByRole('row', { name: /payment\.failed/u })

    await user.selectOptions(within(filtros(FILTRAR_LOGS)).getByRole('combobox', { name: 'Nivel' }), 'Errores')
    await user.type(within(filtros(FILTRAR_LOGS)).getByRole('searchbox'), 'payment')
    await user.click(within(filtros(FILTRAR_LOGS)).getByRole('button', { name: 'Buscar' }))

    await waitFor(() => {
      expect(api.llamadas('get', LOGS).at(-1)?.params).toEqual({ window: '24h', level: 'error', search: 'payment', limit: 50 })
    })
    await user.click(within(filtros(FILTRAR_LOGS)).getByRole('button', { name: 'Quitar filtros' }))
    // Sin filtros vuelve la lista inicial, que ya estaba en el caché.
    expect(await screen.findByRole('row', { name: /payment\.failed/u })).toBeInTheDocument()
    expect(within(filtros(FILTRAR_LOGS)).getByRole('searchbox')).toHaveValue('')
  })

  it('«Cargar más» pide lo anterior al último log que se ve', async () => {
    const { api, user } = abrirPanel({ items: [logObs()], next_before_id: 50 })
    api.once('get', LOGS, { items: [logObs()], next_before_id: 50 })

    expect(await screen.findByText('1 entrada; hay más')).toBeInTheDocument()
    api.on('get', LOGS, { items: [logObs({ id: 49, event: 'stock.low', level: 'warning' })], next_before_id: null })
    await user.click(screen.getByRole('button', { name: 'Cargar más' }))

    expect(await screen.findByRole('row', { name: /stock\.low/u })).toBeInTheDocument()
    expect(api.llamadas('get', LOGS).at(-1)?.params).toEqual({ window: '24h', limit: 50, before_id: 50 })
    expect(screen.getByText('2 entradas')).toBeInTheDocument()
  })

  it('sin logs con esos filtros lo dice', async () => {
    abrirPanel(VACIA)

    expect(await screen.findByText('No hay logs con esos filtros en esta ventana.')).toBeInTheDocument()
  })
})

describe('peticiones del panel', () => {
  it('muestra cada petición con su estado, tiempos y cuenta, y lleva a sus logs', async () => {
    const { api, user, router } = abrirPanel(VACIA, { items: [peticionObs()], next_before_id: null })

    // La ruta también está en la tabla de rutas: la fila de la petición es la que lleva su request_id.
    const fila = await screen.findByRole('row', { name: /req-abc/u })
    expect(within(fila).getByText('12 ms · 3 consultas')).toBeInTheDocument()
    expect(within(fila).getByText(/restaurante #4/u)).toBeInTheDocument()
    await user.click(within(fila).getByRole('link', { name: 'Ver los logs de req-abc' }))

    await waitFor(() => {
      expect(api.llamadas('get', LOGS).at(-1)?.params).toEqual({ window: '24h', request_id: 'req-abc', limit: 50 })
    })
    expect(router.state.location.hash).toBe('#logs')
  })

  it('filtra desde un estado y por request_id', async () => {
    const { api, user } = abrirPanel(VACIA, { items: [peticionObs()], next_before_id: null })
    await screen.findByRole('row', { name: /order_id/u })

    await user.selectOptions(within(filtros(FILTRAR_PETICIONES)).getByRole('combobox'), 'Solo 5xx')
    await user.type(within(filtros(FILTRAR_PETICIONES)).getByLabelText('request_id'), ' req-xyz ')
    await user.click(within(filtros(FILTRAR_PETICIONES)).getByRole('button', { name: 'Buscar' }))

    await waitFor(() => {
      expect(api.llamadas('get', PETICIONES).at(-1)?.params).toEqual({ window: '24h', status_min: 500, request_id: 'req-xyz', limit: 50 })
    })
  })

  it('sin peticiones con esos filtros lo dice', async () => {
    abrirPanel(VACIA, VACIA)

    expect(await screen.findByText('No hay peticiones con esos filtros en esta ventana.')).toBeInTheDocument()
  })
})
