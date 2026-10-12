import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { panelReports, salesSummary } from '#jest/fixtures/panel'
import { signInAs, mountScreen, ErrorResponse, server } from '#jest/harness'
import { todayIn } from '@/services/format'
import { addDays } from './dateRange'
import { InsightsView } from './InsightsView'

const SUMMARY = '/insights/summary'

function open(en = '/panel', changes: Record<string, unknown> = {}) {
  const api = server()
  for (const [route, data] of Object.entries({ ...panelReports(), ...changes })) {
    api.on('get', route, data)
  }
  signInAs()
  return { api, ...mountScreen(<InsightsView />, { path: '/panel', en }) }
}

function today(): string {
  return todayIn('America/Lima')
}

describe('InsightsView: rango de fechas', () => {
  it('abre con los últimos 30 días del local y lo dice arriba', async () => {
    const { api } = open()
    expect(await screen.findByText(/Del .* \(30 días\)\./u)).toBeInTheDocument()
    expect(api.calls('get', SUMMARY)[0]?.params).toEqual({ date_from: addDays(today(), -29), date_to: today() })
    expect(screen.getByRole('button', { name: '30 días' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('elegir «7 días» guarda el rango en la dirección y pide ese período', async () => {
    const { api, user, router } = open()
    await screen.findByText('Ventas')

    await user.click(screen.getByRole('button', { name: '7 días' }))

    expect(router.state.location.search).toBe('?rango=7d')
    expect(api.calls('get', SUMMARY).at(-1)?.params).toEqual({ date_from: addDays(today(), -6), date_to: today() })
  })

  it('un rango personalizado se valida antes de aplicarse', async () => {
    const { api, user, router } = open()
    await user.click(screen.getByRole('button', { name: 'Personalizado' }))
    const from = screen.getByLabelText('Desde')
    const until = screen.getByLabelText('Hasta')

    await user.clear(from)
    await user.type(from, '2026-09-10')
    await user.clear(until)
    await user.type(until, '2026-09-01')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('La fecha de inicio tiene que ser anterior a la de fin.')

    await user.clear(until)
    await user.type(until, '2026-09-15')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    expect(router.state.location.search).toBe('?rango=personalizado&desde=2026-09-10&hasta=2026-09-15')
    expect(api.calls('get', SUMMARY).at(-1)?.params).toEqual({ date_from: '2026-09-10', date_to: '2026-09-15' })
  })

  it('un enlace con un rango personalizado inválido vuelve a los 30 días', async () => {
    const { api } = open('/panel?rango=personalizado&desde=2026-09-20&hasta=2026-09-01')
    await screen.findByText('Ventas')
    expect(api.calls('get', SUMMARY)[0]?.params).toEqual({ date_from: addDays(today(), -29), date_to: today() })
  })

  it('un enlace con «Este mes» empieza el día 1', async () => {
    const { api } = open('/panel?rango=mes')
    await screen.findByText('Ventas')
    expect(api.calls('get', SUMMARY)[0]?.params).toEqual({ date_from: `${today().slice(0, 8)}01`, date_to: today() })
  })
})

function changeOf(kpis: HTMLElement, text: string): HTMLElement {
  const change = within(kpis).getAllByTestId('kpi-change').find((element) => element.textContent.includes(text))
  if (change === undefined) {
    throw new Error(`No se encontró la variación ${text}`)
  }
  return change
}

describe('InsightsView: indicadores', () => {
  it('cada KPI dice cuánto cambió, con el tono según si es bueno o malo', async () => {
    open()
    const kpis = await screen.findByRole('region', { name: 'Indicadores del período' })
    expect(within(kpis).getByText('S/ 1,234.50')).toBeInTheDocument()
    expect(changeOf(kpis, '+12.5 %')).toHaveClass('text-success')
    expect(changeOf(kpis, '−5.0 %')).toHaveClass('text-destructive')
    expect(changeOf(kpis, '0.0 %')).toHaveClass('text-muted-foreground')
    expect(within(kpis).getByText('S/ 45.00 sin cobrar')).toBeInTheDocument()
    expect(changeOf(kpis, '+50.0 %')).toHaveClass('text-destructive')
  })

  it('sin período anterior lo dice en vez de inventar una variación', async () => {
    const base = salesSummary()
    open('/panel', {
      [SUMMARY]: salesSummary({
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
    open('/panel', { [SUMMARY]: new ErrorResponse(500, 'El resumen no responde') })
    expect(await screen.findByText('El resumen no responde')).toBeInTheDocument()
    expect(await screen.findByText('Platos más vendidos')).toBeInTheDocument()
  })
})
