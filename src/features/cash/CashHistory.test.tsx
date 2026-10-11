import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { cashRegisterSummary, cashRegisterShift } from '#jest/fixtures/cash'
import { signInAs, handleMount, ErrorResponse, server } from '#jest/harness'
import type { CashSession } from '@/api/types'
import { CashHistory } from './CashHistory'

const SESSIONS = '/cash/sessions'
const TWO_HUNDRED = '200.00'
const LUIS = 'Luis Rojas'

function closed(id: number, changes: Partial<CashSession> = {}): CashSession {
  return cashRegisterShift({
    id,
    is_open: false,
    closed_by_name: LUIS,
    expected_cash: TWO_HUNDRED,
    counted_cash: TWO_HUNDRED,
    difference: '0.00',
    ...changes,
  })
}

function open(items: CashSession[], total = items.length) {
  const api = server().on('get', SESSIONS, (request: { params: Record<string, unknown> }) => ({
    items: request.params['offset'] === 0 ? items : [closed(99, { opened_by_name: 'Turno viejo' })],
    total,
  }))
  signInAs()
  return { api, ...handleMount(<CashHistory />) }
}

describe('CashHistory', () => {
  it('sin turnos lo dice', async () => {
    open([])
    expect(await screen.findByText('Todavía no hay turnos de caja')).toBeInTheDocument()
  })

  it('cada turno dice quién cerró y si cuadró, sobró o faltó', async () => {
    open([
      closed(1),
      closed(2, { difference: '-4.00', counted_cash: '196.00' }),
      cashRegisterShift({ id: 3, is_open: true, expected_cash: null }),
    ])
    expect(await screen.findByText('Cuadró')).toHaveClass('text-success')
    expect(screen.getByText('Diferencia -S/ 4.00')).toHaveClass('text-destructive')
    expect(screen.getAllByText(/Cerró Luis Rojas/u)).toHaveLength(2)
    expect(screen.getByText('En curso')).toBeInTheDocument()
    expect(screen.getByText(/^Abierta/u)).toBeInTheDocument()
  })

  it('pagina de a diez turnos', async () => {
    const { api, user } = open([closed(1)], 15)
    expect(await screen.findByText('Página 1 de 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText(/abrió Turno viejo/u)).toBeInTheDocument()
    expect(api.calls('get', SESSIONS).map((p) => p.params)).toEqual([
      { limit: 10, offset: 0 },
      { limit: 10, offset: 10 },
    ])
  })

  it('al tocar un turno abre su arqueo firmado con la nota del cierre', async () => {
    const summary = cashRegisterSummary({
      discounts: '5.00',
      courtesies: '3.00',
      discounted_orders: 1,
      by_waiter: [{ waiter_id: 8, name: LUIS, payments: 2, sales: '90.00', tips: '6.00' }],
    })
    const detail = closed(1, { summary, closing_notes: 'Billete falso', difference: '2.00', counted_cash: '202.00' })
    const { api, user } = open([closed(1)])
    api.on('get', '/cash/sessions/1', detail)

    await user.click(await screen.findByRole('button', { name: /Cuadró/u }))

    const window = await screen.findByRole('dialog', { name: 'Turno de caja 1' })
    expect(await within(window).findByText('Nota: Billete falso')).toBeInTheDocument()
    expect(within(window).getByText('Contado S/ 202.00 · diferencia S/ 2.00')).toBeInTheDocument()
    const tips = within(window).getByRole('table', { name: /Propinas por mesero/u })
    expect(within(tips).getByRole('rowheader', { name: LUIS })).toBeInTheDocument()
    expect(within(window).getByText(/Descuentos: S\/ 5.00 en 1 pedido · Cortesías: S\/ 3.00/u)).toBeInTheDocument()
  })

  it('si el turno no se puede leer lo dice dentro de la ventana', async () => {
    const { api, user } = open([closed(1)])
    api.on('get', '/cash/sessions/1', new ErrorResponse(404, 'Ese turno no existe'))

    await user.click(await screen.findByRole('button', { name: /Cuadró/u }))

    const window = await screen.findByRole('dialog')
    expect(await within(window).findByText('Ese turno no existe')).toBeInTheDocument()
  })

  it('si la lista falla muestra el error', async () => {
    server().on('get', SESSIONS, new ErrorResponse(500, 'Sin conexión con la base'))
    signInAs()
    handleMount(<CashHistory />)
    expect(await screen.findByText('Sin conexión con la base')).toBeInTheDocument()
  })
})
