import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { cell, waste, panelReports } from '#jest/fixtures/panel'
import { signInAs, mountScreen, ErrorResponse, server } from '#jest/harness'
import { InsightsView } from './InsightsView'

const WASTES = '/insights/waste'
const PAYMENTS_TAB = 'Pagos y servicio'
const WASTE_TAB = 'Mermas y stock'

function open(changes: Record<string, unknown> = {}) {
  const api = server()
  for (const [route, data] of Object.entries({ ...panelReports(), ...changes })) {
    api.on('get', route, data)
  }
  signInAs()
  return { api, ...mountScreen(<InsightsView />, { path: '/panel' }) }
}

/** Abre una pestaña del detalle del panel. */
async function tab(user: ReturnType<typeof open>['user'], name: string) {
  await user.click(await screen.findByRole('tab', { name }))
}

function section(title: string): HTMLElement {
  return screen.getByTestId(`section-${title}`)
}

describe('InsightsView: secciones', () => {
  it('la hora pico se escribe y la tabla de ventas por día se puede ver', async () => {
    const { user } = open()
    await tab(user, PAYMENTS_TAB)
    expect(await screen.findByText('viernes de 20:00 a 21:00')).toBeInTheDocument()

    await user.click(within(section('Ventas por día')).getByRole('button', { name: 'Ver tabla' }))

    const table = screen.getByRole('table', { name: 'Ventas por día' })
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(within(table).getByText('S/ 834.50')).toBeInTheDocument()
  })

  it('platos, medios de pago, meseros y stock bajo muestran sus datos', async () => {
    const { user } = open()
    expect(await screen.findByText('18 porc.')).toBeInTheDocument()
    await tab(user, PAYMENTS_TAB)
    expect(await screen.findByText('Total cobrado: S/ 1,234.50.')).toBeInTheDocument()
    expect(within(section('Ingresos por medio de pago')).getByText('Yape')).toBeInTheDocument()
    expect(await screen.findByRole('cell', { name: 'Luis Rojas' })).toBeInTheDocument()
    await tab(user, WASTE_TAB)
    expect(await screen.findByText(/Quedan 0.5 kg de un mínimo de 2 kg; faltan\s+1.5 kg\./u)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver reposición sugerida' })).toHaveAttribute('href', '/panel/reposicion')
  })

  it('el margen marca los platos sin receta y las pérdidas, y se ordena por columna', async () => {
    const { user } = open()
    expect(await screen.findByText(/1 platos no tienen receta/u)).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Margen por plato, ordenable por columna' })
    expect(within(table).getByText('Sin receta')).toBeInTheDocument()
    expect(within(table).getByText('-16.7 % (pérdida)')).toBeInTheDocument()
    const names = () => within(table).getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell').at(0)?.textContent ?? '')
    expect(names()[0]).toMatch(/^Ceviche/u)

    await user.click(within(table).getByRole('button', { name: /Plato/u }))

    expect(names().map((n) => n.replace(/Fondos.*$/u, ''))).toEqual(['Ceviche', 'Chicha', 'Promo'])
    expect(within(table).getByRole('columnheader', { name: /Plato/u })).toHaveAttribute('aria-sort', 'ascending')
  })

  it('con muchos platos el margen muestra cinco y cinco, y la tabla completa se abre en una hoja', async () => {
    const dishes = Array.from({ length: 14 }, (_, index) => ({
      menu_item_id: 100 + index,
      name: `Plato ${String(index)}`,
      category: 'Fondos',
      price: '30.00',
      recipe_cost: '10.00',
      estimated_cost: '10.00',
      revenue: '30.00',
      unit_margin: '20.00',
      margin_percent: String(10 + index),
      quantity_sold: 1,
      gross_margin: '20.00',
    }))
    const { user } = open({ '/insights/dishes/margins': { dishes, period: { date_from: '2026-09-01', date_to: '2026-09-30' } } })
    const table = await screen.findByRole('table', { name: 'Margen por plato, ordenable por columna' })
    expect(within(table).getAllByRole('row')).toHaveLength(11)

    await user.click(screen.getByRole('button', { name: 'Ver los 14 platos' }))

    const sheet = await screen.findByRole('dialog', { name: 'Margen por plato' })
    expect(within(sheet).getAllByRole('row')).toHaveLength(15)
  })

  it('las mermas dicen su costo y se clasifican con la IA', async () => {
    const { api, user } = open()
    await tab(user, WASTE_TAB)
    api.on('post', '/insights/waste/classify', { classified: 1, remaining: 1, by_cause: [] })
    expect(await screen.findByText(/5 mermas por S\/ 82.40/u)).toBeInTheDocument()
    const before = api.calls('get', WASTES).length

    await user.click(screen.getByRole('button', { name: 'Clasificar mermas pendientes (2)' }))

    expect(await screen.findByText('Se clasificaron 1 mermas; quedan 1 sin clasificar.')).toBeInTheDocument()
    expect(api.calls('get', WASTES).length).toBeGreaterThan(before)
  })

  it('si la IA falla al clasificar, lo dice', async () => {
    const { api, user } = open()
    api.on('post', '/insights/waste/classify', new ErrorResponse(503, 'Jev no responde'))
    await tab(user, WASTE_TAB)

    await user.click(await screen.findByRole('button', { name: 'Clasificar mermas pendientes (2)' }))

    expect(await screen.findByText('Jev no responde')).toBeInTheDocument()
  })

})

describe('InsightsView: secciones vacías y con error', () => {
  it('un período sin movimiento muestra cada sección vacía con su aviso', async () => {
    const { user } = open({
      '/insights/sales/daily': { days: [{ date: '2026-09-26', sales: '0', paid_orders: 0, average_ticket: '0' }] },
      '/insights/sales/hourly': { cells: [cell(0, 12, 0)], peak: null },
      '/insights/dishes/top': { dishes: [] },
      '/insights/payments': { methods: [], total: '0' },
      '/insights/dishes/margins': { dishes: [] },
      '/insights/waiters': { waiters: [] },
      '/insights/low-stock': [],
      [WASTES]: waste({ events: 0, pending_classification: 0, by_cause: [], by_ingredient: [] }),
    })
    expect(await screen.findByText('Con un solo día no hay tendencia')).toBeInTheDocument()
    expect(screen.getByText('No se vendieron platos en este rango.')).toBeInTheDocument()
    expect(screen.getByText('No hay platos en la carta.')).toBeInTheDocument()
    await tab(user, PAYMENTS_TAB)
    expect(await screen.findByText('No hubo cobros en este rango.')).toBeInTheDocument()
    expect(screen.getByText('No hubo pedidos pagados en este rango.')).toBeInTheDocument()
    expect(await screen.findByText('Nadie cobró pedidos en este rango.')).toBeInTheDocument()
    await tab(user, WASTE_TAB)
    expect(await screen.findByText('Ningún insumo está bajo su mínimo.')).toBeInTheDocument()
    expect(screen.getByText('No se registraron mermas en este rango.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clasificar mermas pendientes (0)' })).toBeDisabled()
  })

  it('cada sección que falla lo dice por su cuenta', async () => {
    const error = new ErrorResponse(500, [])
    const { user } = open({ '/insights/sales/daily': error, '/insights/sales/hourly': error, [WASTES]: error, '/insights/waiters': error })
    expect(await screen.findByText('No se pudieron cargar las ventas por día.')).toBeInTheDocument()
    await tab(user, PAYMENTS_TAB)
    expect(await screen.findByText('No se pudo cargar el mapa por hora.')).toBeInTheDocument()
    expect(await screen.findByText('No se pudo cargar el rendimiento por mesero.')).toBeInTheDocument()
    await tab(user, WASTE_TAB)
    expect(await screen.findByText('No se pudieron cargar las mermas.')).toBeInTheDocument()
  })
})
