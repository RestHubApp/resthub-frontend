import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { reportesDelPanel, resumenDeVentas } from '#jest/fixtures/panel'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import { todayIn } from '../../services/format'
import { addDays } from './dateRange'
import InsightsView from './InsightsView'

const RESUMEN = '/insights/summary'

function abrir(en = '/panel', cambios: Record<string, unknown> = {}) {
  const api = servidor()
  for (const [ruta, datos] of Object.entries({ ...reportesDelPanel(), ...cambios })) {
    api.on('get', ruta, datos)
  }
  entrarComo()
  return { api, ...montar(<InsightsView />, { path: '/panel', en }) }
}

function hoy(): string {
  return todayIn('America/Lima')
}

describe('InsightsView: rango de fechas', () => {
  it('abre con los últimos 30 días del local y lo dice arriba', async () => {
    const { api } = abrir()
    expect(await screen.findByText(/Del .* \(30 días\)\./u)).toBeInTheDocument()
    expect(api.llamadas('get', RESUMEN)[0]?.params).toEqual({ date_from: addDays(hoy(), -29), date_to: hoy() })
    expect(screen.getByRole('button', { name: '30 días' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('elegir «7 días» guarda el rango en la dirección y pide ese período', async () => {
    const { api, user, router } = abrir()
    await screen.findByText('Ventas')

    await user.click(screen.getByRole('button', { name: '7 días' }))

    expect(router.state.location.search).toBe('?rango=7d')
    expect(api.llamadas('get', RESUMEN).at(-1)?.params).toEqual({ date_from: addDays(hoy(), -6), date_to: hoy() })
  })

  it('un rango personalizado se valida antes de aplicarse', async () => {
    const { api, user, router } = abrir()
    await user.click(screen.getByRole('button', { name: 'Personalizado' }))
    const desde = screen.getByLabelText('Desde')
    const hasta = screen.getByLabelText('Hasta')

    await user.clear(desde)
    await user.type(desde, '2026-09-10')
    await user.clear(hasta)
    await user.type(hasta, '2026-09-01')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('La fecha de inicio tiene que ser anterior a la de fin.')

    await user.clear(hasta)
    await user.type(hasta, '2026-09-15')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    expect(router.state.location.search).toBe('?rango=personalizado&desde=2026-09-10&hasta=2026-09-15')
    expect(api.llamadas('get', RESUMEN).at(-1)?.params).toEqual({ date_from: '2026-09-10', date_to: '2026-09-15' })
  })

  it('un enlace con un rango personalizado inválido vuelve a los 30 días', async () => {
    const { api } = abrir('/panel?rango=personalizado&desde=2026-09-20&hasta=2026-09-01')
    await screen.findByText('Ventas')
    expect(api.llamadas('get', RESUMEN)[0]?.params).toEqual({ date_from: addDays(hoy(), -29), date_to: hoy() })
  })

  it('un enlace con «Este mes» empieza el día 1', async () => {
    const { api } = abrir('/panel?rango=mes')
    await screen.findByText('Ventas')
    expect(api.llamadas('get', RESUMEN)[0]?.params).toEqual({ date_from: `${hoy().slice(0, 8)}01`, date_to: hoy() })
  })
})

describe('InsightsView: indicadores', () => {
  it('cada KPI dice cuánto cambió, con el tono según si es bueno o malo', async () => {
    abrir()
    const kpis = await screen.findByRole('region', { name: 'Indicadores del período' })
    expect(within(kpis).getByText('S/ 1,234.50')).toBeInTheDocument()
    expect(within(kpis).getByText('+12.5 %').parentElement).toHaveClass('text-success')
    expect(within(kpis).getByText('−5.0 %').parentElement).toHaveClass('text-destructive')
    expect(within(kpis).getByText('0.0 %').parentElement).toHaveClass('text-muted-foreground')
    expect(within(kpis).getByText('S/ 45.00 sin cobrar')).toBeInTheDocument()
    expect(within(kpis).getByText('+50.0 %').parentElement).toHaveClass('text-destructive')
  })

  it('sin período anterior lo dice en vez de inventar una variación', async () => {
    const base = resumenDeVentas()
    abrir('/panel', {
      [RESUMEN]: resumenDeVentas({
        sales_change_percent: null,
        cancelled_amount: '0',
        previous: { ...base.previous, cancelled_orders: 0 },
      }),
    })
    const kpis = await screen.findByRole('region', { name: 'Indicadores del período' })
    expect(within(kpis).getAllByText('Sin datos del período anterior')).toHaveLength(2)
    expect(within(kpis).queryByText(/sin cobrar/u)).not.toBeInTheDocument()
  })

  it('si el resumen falla lo dice y el resto del panel sigue', async () => {
    abrir('/panel', { [RESUMEN]: new RespuestaDeError(500, 'El resumen no responde') })
    expect(await screen.findByText('El resumen no responde')).toBeInTheDocument()
    expect(await screen.findByText('Platos más vendidos')).toBeInTheDocument()
  })
})
