import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { celda, merma, reportesDelPanel } from '#jest/fixtures/panel'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import InsightsView from './InsightsView'

const MERMAS = '/insights/waste'

function abrir(cambios: Record<string, unknown> = {}) {
  const api = servidor()
  for (const [ruta, datos] of Object.entries({ ...reportesDelPanel(), ...cambios })) {
    api.on('get', ruta, datos)
  }
  entrarComo()
  return { api, ...montar(<InsightsView />, { path: '/panel' }) }
}

function seccion(titulo: string): HTMLElement {
  // eslint-disable-next-line security/detect-non-literal-regexp -- el texto lo fija la prueba; se busca por coincidencia parcial del nombre accesible
  const encabezado = screen.getByRole('heading', { name: new RegExp(titulo, 'u') })
  const tarjeta = encabezado.closest('[data-slot="card"]')
  if (!(tarjeta instanceof HTMLElement)) {
    throw new Error(`No se encontró la tarjeta de ${titulo}`)
  }
  return tarjeta
}

describe('InsightsView: secciones', () => {
  it('la hora pico se escribe y la tabla de ventas por día se puede ver', async () => {
    const { user } = abrir()
    expect(await screen.findByText('viernes de 20:00 a 21:00')).toBeInTheDocument()

    await user.click(within(seccion('Ventas por día')).getByRole('button', { name: 'Ver tabla' }))

    const tabla = screen.getByRole('table', { name: 'Ventas por día' })
    expect(within(tabla).getAllByRole('row')).toHaveLength(3)
    expect(within(tabla).getByText('S/ 834.50')).toBeInTheDocument()
  })

  it('platos, medios de pago, meseros y stock bajo muestran sus datos', async () => {
    abrir()
    expect(await screen.findByText('Total cobrado: S/ 1,234.50.')).toBeInTheDocument()
    expect(within(seccion('Platos más vendidos')).getByText('18 porc.')).toBeInTheDocument()
    expect(within(seccion('Ingresos por medio de pago')).getByText('Yape')).toBeInTheDocument()
    expect(await screen.findByRole('cell', { name: 'Luis Rojas' })).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Stock de Limón respecto del mínimo' })).toHaveAttribute('aria-valuenow', '0.5')
    expect(screen.getByText(/Quedan 0.5 kg de un mínimo de 2 kg; faltan\s+1.5 kg\./u)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver reposición sugerida' })).toHaveAttribute('href', '/panel/reposicion')
  })

  it('el margen marca los platos sin receta y las pérdidas, y se ordena por columna', async () => {
    const { user } = abrir()
    expect(await screen.findByText(/1 platos no tienen receta/u)).toBeInTheDocument()
    const tabla = screen.getByRole('table', { name: 'Margen por plato, ordenable por columna' })
    expect(within(tabla).getByText('Sin receta')).toBeInTheDocument()
    expect(within(tabla).getByText('-16.7 % (pérdida)')).toBeInTheDocument()
    const nombres = () => within(tabla).getAllByRole('row').slice(1).map((fila) => within(fila).getAllByRole('cell')[0]?.textContent)
    expect(nombres()[0]).toMatch(/^Ceviche/u)

    await user.click(within(tabla).getByRole('button', { name: /Plato/u }))

    expect(nombres().map((n) => n.replace(/Fondos.*$/u, ''))).toEqual(['Ceviche', 'Chicha', 'Promo'])
    expect(within(tabla).getByRole('columnheader', { name: /Plato/u })).toHaveAttribute('aria-sort', 'ascending')
  })

  it('las mermas dicen su costo y se clasifican con la IA', async () => {
    const { api, user } = abrir()
    api.on('post', '/insights/waste/classify', { classified: 1, remaining: 1, by_cause: [] })
    expect(await screen.findByText(/5 mermas por S\/ 82.40/u)).toBeInTheDocument()
    const antes = api.llamadas('get', MERMAS).length

    await user.click(screen.getByRole('button', { name: 'Clasificar mermas pendientes (2)' }))

    expect(await screen.findByText('Se clasificaron 1 mermas; quedan 1 sin clasificar.')).toBeInTheDocument()
    expect(api.llamadas('get', MERMAS).length).toBeGreaterThan(antes)
  })

  it('si la IA falla al clasificar, lo dice', async () => {
    const { api, user } = abrir()
    api.on('post', '/insights/waste/classify', new RespuestaDeError(503, 'Jev no responde'))

    await user.click(await screen.findByRole('button', { name: 'Clasificar mermas pendientes (2)' }))

    expect(await screen.findByText('Jev no responde')).toBeInTheDocument()
  })

  it('un período sin movimiento muestra cada sección vacía con su aviso', async () => {
    abrir({
      '/insights/sales/daily': { days: [{ date: '2026-09-26', sales: '0', paid_orders: 0, average_ticket: '0' }] },
      '/insights/sales/hourly': { cells: [celda(0, 12, 0)], peak: null },
      '/insights/dishes/top': { dishes: [] },
      '/insights/payments': { methods: [], total: '0' },
      '/insights/dishes/margins': { dishes: [] },
      '/insights/waiters': { waiters: [] },
      '/insights/low-stock': [],
      [MERMAS]: merma({ events: 0, pending_classification: 0, by_cause: [], by_ingredient: [] }),
    })
    expect(await screen.findByText('Con un solo día no hay tendencia')).toBeInTheDocument()
    expect(screen.getByText('No hubo pedidos pagados en este rango.')).toBeInTheDocument()
    expect(screen.getByText('No se vendieron platos en este rango.')).toBeInTheDocument()
    expect(screen.getByText('No hubo cobros en este rango.')).toBeInTheDocument()
    expect(screen.getByText('No hay platos en la carta.')).toBeInTheDocument()
    expect(await screen.findByText('Nadie cobró pedidos en este rango.')).toBeInTheDocument()
    expect(screen.getByText('Ningún insumo está bajo su mínimo.')).toBeInTheDocument()
    expect(screen.getByText('No se registraron mermas en este rango.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clasificar mermas pendientes (0)' })).toBeDisabled()
  })

  it('cada sección que falla lo dice por su cuenta', async () => {
    const error = new RespuestaDeError(500, [])
    abrir({ '/insights/sales/daily': error, '/insights/sales/hourly': error, [MERMAS]: error, '/insights/waiters': error })
    expect(await screen.findByText('No se pudieron cargar las ventas por día.')).toBeInTheDocument()
    expect(screen.getByText('No se pudo cargar el mapa por hora.')).toBeInTheDocument()
    expect(screen.getByText('No se pudieron cargar las mermas.')).toBeInTheDocument()
    expect(screen.getByText('No se pudo cargar el rendimiento por mesero.')).toBeInTheDocument()
  })
})
