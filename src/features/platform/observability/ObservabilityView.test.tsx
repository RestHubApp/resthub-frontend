import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import {
  entrarAPlataforma,
  ESTADOS_OBS,
  montarPlataforma,
  RESUMEN_OBS,
  resumenDeRestaurante,
  RUTAS_OBS,
  SERIE_OBS,
} from '#jest/fixtures/plataforma'
import { RespuestaDeError, servidor } from '#jest/harness'

const INDICADORES_DE_LA_VENTANA = 'Indicadores de la ventana'
const ARIA_PRESSED = 'aria-pressed'

const BASE = '/platform/observability'
const RESUMEN = `${BASE}/summary`
const RUTAS = `${BASE}/routes`
const PAGINA = { items: [], next_before_id: null }

function abrirPanel(en = '/plataforma/observabilidad') {
  const api = servidor()
    .on('get', RESUMEN, RESUMEN_OBS)
    .on('get', `${BASE}/timeseries`, SERIE_OBS)
    .on('get', `${BASE}/status`, ESTADOS_OBS)
    .on('get', RUTAS, RUTAS_OBS)
    .on('get', `${BASE}/logs`, PAGINA)
    .on('get', `${BASE}/requests`, PAGINA)
    .on('get', '/platform/restaurants', { items: [resumenDeRestaurante()], total: 1 })
  entrarAPlataforma()
  return { api, ...montarPlataforma(en) }
}

// La tarjeta de un gráfico: la que tiene su título como encabezado.
function tarjeta(titulo: string): HTMLElement {
  const card = screen.getByRole('heading', { name: titulo }).closest<HTMLElement>('[data-slot="card"]')
  if (card === null) {
    throw new Error(`No se encontró la tarjeta «${titulo}».`)
  }
  return card
}

function ultimaLectura(api: ReturnType<typeof abrirPanel>['api'], ruta: string) {
  return api.llamadas('get', ruta).at(-1)?.params
}

describe('ObservabilityView', () => {
  it('resume la ventana: peticiones, errores y latencias', async () => {
    abrirPanel()

    const indicadores = await screen.findByRole('region', { name: INDICADORES_DE_LA_VENTANA })
    expect(within(indicadores).getByText('De 3 restaurantes')).toBeInTheDocument()
    expect(within(indicadores).getByText('7 con 5xx · 12 con 4xx')).toBeInTheDocument()
    expect(within(indicadores).getByText('52 ms')).toBeInTheDocument()
    expect(within(indicadores).queryByText('Eventos perdidos')).not.toBeInTheDocument()
  })

  it('cuenta las respuestas por estado y deja verlas como tabla', async () => {
    const { user } = abrirPanel()

    const barras = await screen.findByRole('list', { name: 'Respuestas por estado HTTP' })
    expect(within(barras).getByLabelText('500 · error del servidor: 7')).toBeInTheDocument()
    await user.click(within(tarjeta('Respuestas por estado')).getByRole('button', { name: 'Ver tabla' }))

    const tabla = screen.getByRole('table', { name: 'Respuestas por estado' })
    expect(within(tabla).getByRole('row', { name: /404 · error del cliente 33/u })).toBeInTheDocument()
  })

  it('el tráfico y la latencia también se leen como tabla por cubo', async () => {
    const { user } = abrirPanel()
    await screen.findByRole('heading', { name: 'Tráfico' })

    await user.click(within(tarjeta('Tráfico')).getByRole('button', { name: 'Ver tabla' }))
    await user.click(within(tarjeta('Latencia p95')).getByRole('button', { name: 'Ver tabla' }))

    expect(within(screen.getByRole('table', { name: 'Tráfico por cubo' })).getAllByRole('row')).toHaveLength(3)
    expect(within(screen.getByRole('table', { name: 'Latencia p95 por cubo' })).getByText('56 ms')).toBeInTheDocument()
  })

  it('cambiar la ventana relee todo con ella y la deja en la dirección', async () => {
    const { api, user, router } = abrirPanel()
    await screen.findByRole('region', { name: INDICADORES_DE_LA_VENTANA })

    await user.click(screen.getByRole('button', { name: /^6 h/u }))

    await waitFor(() => {
      expect(ultimaLectura(api, RESUMEN)).toEqual({ window: '6h' })
    })
    expect(router.state.location.search).toBe('?ventana=6h')
    expect(screen.getByRole('button', { name: /^6 h/u })).toHaveAttribute(ARIA_PRESSED, 'true')
  })

  it('filtrar por un restaurante manda su id como filtro', async () => {
    const { api, user, router } = abrirPanel()
    const selector = await screen.findByRole('combobox', { name: 'Restaurante' })
    await within(selector).findByRole('option', { name: 'La Esquina de Lucho' })

    await user.selectOptions(selector, 'La Esquina de Lucho')

    await waitFor(() => {
      expect(ultimaLectura(api, RESUMEN)).toEqual({ window: '24h', restaurant_id: 4 })
    })
    expect(router.state.location.search).toBe('?restaurante=4')
  })

  it('un restaurante de la dirección que no está en la lista se sigue ofreciendo', async () => {
    abrirPanel('/plataforma/observabilidad?restaurante=77&ventana=raro')

    expect(await screen.findByRole('option', { name: 'Restaurante #77' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^24 h/u })).toHaveAttribute(ARIA_PRESSED, 'true')
  })
})

describe('ObservabilityView: actualización, rutas y errores', () => {
  it('se puede pausar la actualización automática y releer a mano', async () => {
    const { api, user } = abrirPanel()
    await screen.findByRole('region', { name: INDICADORES_DE_LA_VENTANA })
    const lecturas = api.llamadas('get', RESUMEN).length

    await user.click(screen.getByRole('button', { name: 'Pausar' }))
    expect(screen.getByText('Actualización en pausa')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reanudar' })).toHaveAttribute(ARIA_PRESSED, 'true')
    await user.click(screen.getByRole('button', { name: 'Actualizar ahora' }))

    await waitFor(() => {
      expect(api.llamadas('get', RESUMEN).length).toBeGreaterThan(lecturas)
    })
  })

  it('ordena las rutas por errores y marca los percentiles de muestra', async () => {
    const { api, user } = abrirPanel()
    await screen.findByRole('link', { name: 'Ver peticiones de GET /api/v1/orders' })

    expect(screen.getByText('Los percentiles marcados con ≈ salen de una muestra de sus peticiones.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Errores 5xx/u }))

    await waitFor(() => {
      expect(ultimaLectura(api, RUTAS)).toEqual({ window: '24h', sort: 'errors', limit: 20 })
    })
    const filas = within(screen.getByRole('table', { name: /Rutas de la ventana/u })).getAllByRole('row')
    expect(filas[1]).toHaveTextContent('/api/v1/orders/{order_id}/pay')
  })

  it('una ruta lleva a sus peticiones', async () => {
    const { api, user, router } = abrirPanel()

    await user.click(await screen.findByRole('link', { name: 'Ver peticiones de GET /api/v1/orders' }))

    await waitFor(() => {
      expect(ultimaLectura(api, `${BASE}/requests`)).toEqual({ window: '24h', route: '/api/v1/orders', limit: 50 })
    })
    expect(router.state.location.hash).toBe('#peticiones')
  })

  it('avisa de eventos perdidos y de una ventana muestreada', async () => {
    const { api } = abrirPanel()
    api.on('get', RESUMEN, { ...RESUMEN_OBS, dropped_events: 5, sampled: true })

    expect(await screen.findByText('Eventos perdidos')).toBeInTheDocument()
    expect(screen.getByText(/los percentiles salen de una muestra pareja/u)).toBeInTheDocument()
  })

  it('una lectura que falla muestra su error sin tumbar el resto', async () => {
    const { api } = abrirPanel()
    api.on('get', RESUMEN, new RespuestaDeError(500, 'Resumen caído'))

    expect(await screen.findByText('Resumen caído')).toBeInTheDocument()
    expect(await screen.findByRole('list', { name: 'Respuestas por estado HTTP' })).toBeInTheDocument()
  })
})
