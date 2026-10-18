import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import {
  signInToPlatform,
  STATUSES_OBS,
  mountPlatform,
  SUMMARY_OBS,
  restaurantSummary,
  ROUTES_OBS,
  SERIES_OBS,
} from '#jest/fixtures/platform'
import { ErrorResponse, server } from '#jest/harness'

const WINDOW_INDICATORS = 'Indicadores de la ventana'
const ARIA_PRESSED = 'aria-pressed'

const BASE = '/platform/observability'
const SUMMARY = `${BASE}/summary`
const ROUTES = `${BASE}/routes`
const PAGE = { items: [], next_before_id: null }

const ALERTS = `${BASE}/security-alerts`
const FAILED_LOGINS = { id: 4, kind: 'failed_logins', kind_label: 'Accesos fallidos', count: 47, threshold: 30, window_minutes: 15, raised_at: '2026-10-17T15:00:00Z' }

function openPanel(en = '/plataforma/observabilidad', alerts: unknown = []) {
  const api = server()
    .on('get', ALERTS, alerts)
    .on('get', SUMMARY, SUMMARY_OBS)
    .on('get', `${BASE}/timeseries`, SERIES_OBS)
    .on('get', `${BASE}/status`, STATUSES_OBS)
    .on('get', ROUTES, ROUTES_OBS)
    .on('get', `${BASE}/logs`, PAGE)
    .on('get', `${BASE}/requests`, PAGE)
    .on('get', '/platform/restaurants', { items: [restaurantSummary()], total: 1 })
  signInToPlatform()
  return { api, ...mountPlatform(en) }
}

// La tarjeta de un gráfico: la que tiene su título como encabezado.
function getCard(title: string): HTMLElement {
  return screen.getByTestId(`section-${title}`)
}

function lastRead(api: ReturnType<typeof openPanel>['api'], route: string) {
  return api.calls('get', route).at(-1)?.params
}

describe('ObservabilityView', () => {
  it('muestra las alertas de seguridad por picos (RFS-31)', async () => {
    openPanel(undefined, [FAILED_LOGINS])

    const list = await screen.findByRole('list', { name: 'Alertas de seguridad' })
    expect(within(list).getByText('Accesos fallidos')).toBeInTheDocument()
    expect(within(list).getByText('47 en 15 min (umbral 30)')).toBeInTheDocument()
  })

  it('sin picos lo dice', async () => {
    openPanel()

    expect(await screen.findByText('Sin picos recientes.')).toBeInTheDocument()
  })

  it('resume la ventana: peticiones, errores y latencias', async () => {
    openPanel()

    const indicators = await screen.findByRole('region', { name: WINDOW_INDICATORS })
    expect(within(indicators).getByText('De 3 restaurantes')).toBeInTheDocument()
    expect(within(indicators).getByText('7 con 5xx · 12 con 4xx')).toBeInTheDocument()
    expect(within(indicators).getByText('52 ms')).toBeInTheDocument()
    expect(within(indicators).queryByText('Eventos perdidos')).not.toBeInTheDocument()
  })

  it('cuenta las respuestas por estado y deja verlas como tabla', async () => {
    const { user } = openPanel()

    const bars = await screen.findByRole('list', { name: 'Respuestas por estado HTTP' })
    expect(within(bars).getByLabelText('500 · error del servidor: 7')).toBeInTheDocument()
    await user.click(within(getCard('Respuestas por estado')).getByRole('button', { name: 'Ver tabla' }))

    const table = screen.getByRole('table', { name: 'Respuestas por estado' })
    expect(within(table).getByRole('row', { name: /404 · error del cliente 33/u })).toBeInTheDocument()
  })

  it('el tráfico y la latencia también se leen como tabla por cubo', async () => {
    const { user } = openPanel()
    await screen.findByRole('heading', { name: 'Tráfico' })

    await user.click(within(getCard('Tráfico')).getByRole('button', { name: 'Ver tabla' }))
    await user.click(within(getCard('Latencia p95')).getByRole('button', { name: 'Ver tabla' }))

    expect(within(screen.getByRole('table', { name: 'Tráfico por cubo' })).getAllByRole('row')).toHaveLength(3)
    expect(within(screen.getByRole('table', { name: 'Latencia p95 por cubo' })).getByText('56 ms')).toBeInTheDocument()
  })

  it('cambiar la ventana relee todo con ella y la deja en la dirección', async () => {
    const { api, user, router } = openPanel()
    await screen.findByRole('region', { name: WINDOW_INDICATORS })

    await user.click(screen.getByRole('button', { name: /^6 h/u }))

    await waitFor(() => {
      expect(lastRead(api, SUMMARY)).toEqual({ window: '6h' })
    })
    expect(router.state.location.search).toBe('?ventana=6h')
    expect(screen.getByRole('button', { name: /^6 h/u })).toHaveAttribute(ARIA_PRESSED, 'true')
  })

  it('filtrar por un restaurante manda su id como filtro', async () => {
    const { api, user, router } = openPanel()
    const selector = await screen.findByRole('combobox', { name: 'Restaurante' })
    await within(selector).findByRole('option', { name: 'La Esquina de Lucho' })

    await user.selectOptions(selector, 'La Esquina de Lucho')

    await waitFor(() => {
      expect(lastRead(api, SUMMARY)).toEqual({ window: '24h', restaurant_id: '4' })
    })
    expect(router.state.location.search).toBe('?restaurante=4')
  })

  it('un restaurante de la dirección que no está en la lista se sigue ofreciendo', async () => {
    openPanel('/plataforma/observabilidad?restaurante=77&ventana=raro')

    expect(await screen.findByRole('option', { name: 'Restaurante #77' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^24 h/u })).toHaveAttribute(ARIA_PRESSED, 'true')
  })
})

describe('ObservabilityView: actualización, rutas y errores', () => {
  it('se puede pausar la actualización automática y releer a mano', async () => {
    const { api, user } = openPanel()
    await screen.findByRole('region', { name: WINDOW_INDICATORS })
    const reads = api.calls('get', SUMMARY).length

    await user.click(screen.getByRole('button', { name: 'Pausar' }))
    expect(screen.getByText('Actualización en pausa')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reanudar' })).toHaveAttribute(ARIA_PRESSED, 'true')
    await user.click(screen.getByRole('button', { name: 'Actualizar ahora' }))

    await waitFor(() => {
      expect(api.calls('get', SUMMARY).length).toBeGreaterThan(reads)
    })
  })

  it('ordena las rutas por errores y marca los percentiles de muestra', async () => {
    const { api, user } = openPanel()
    await screen.findByRole('link', { name: 'Ver peticiones de GET /api/v1/orders' })

    expect(screen.getByText('Los percentiles marcados con ≈ salen de una muestra de sus peticiones.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Errores 5xx/u }))

    await waitFor(() => {
      expect(lastRead(api, ROUTES)).toEqual({ window: '24h', sort: 'errors', limit: '20' })
    })
    const rows = within(screen.getByRole('table', { name: /Rutas de la ventana/u })).getAllByRole('row')
    expect(rows[1]).toHaveTextContent('/api/v1/orders/{order_id}/pay')
  })

  it('una ruta lleva a sus peticiones', async () => {
    const { api, user, router } = openPanel()

    await user.click(await screen.findByRole('link', { name: 'Ver peticiones de GET /api/v1/orders' }))

    await waitFor(() => {
      expect(lastRead(api, `${BASE}/requests`)).toEqual({ window: '24h', route: '/api/v1/orders', limit: '50' })
    })
    expect(router.state.location.hash).toBe('#peticiones')
  })

  it('avisa de eventos perdidos y de una ventana muestreada', async () => {
    const { api } = openPanel()
    api.on('get', SUMMARY, { ...SUMMARY_OBS, dropped_events: 5, sampled: true })

    expect(await screen.findByText('Eventos perdidos')).toBeInTheDocument()
    expect(screen.getByText(/los percentiles salen de una muestra pareja/u)).toBeInTheDocument()
  })

  it('una lectura que falla muestra su error sin tumbar el resto', async () => {
    const { api } = openPanel()
    api.on('get', SUMMARY, new ErrorResponse(500, 'Resumen caído'))

    expect(await screen.findByText('Resumen caído')).toBeInTheDocument()
    expect(await screen.findByRole('list', { name: 'Respuestas por estado HTTP' })).toBeInTheDocument()
  })
})
