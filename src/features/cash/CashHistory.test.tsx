import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { resumenDeCaja, turnoDeCaja } from '#jest/fixtures/cash'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import type { CashSession } from '../../api/types'
import CashHistory from './CashHistory'

const SESIONES = '/cash/sessions'
const DOSCIENTOS = '200.00'
const LUIS = 'Luis Rojas'

function cerrado(id: number, cambios: Partial<CashSession> = {}): CashSession {
  return turnoDeCaja({
    id,
    is_open: false,
    closed_by_name: LUIS,
    expected_cash: DOSCIENTOS,
    counted_cash: DOSCIENTOS,
    difference: '0.00',
    ...cambios,
  })
}

function abrir(items: CashSession[], total = items.length) {
  const api = servidor().on('get', SESIONES, (peticion: { params: Record<string, unknown> }) => ({
    items: peticion.params.offset === 0 ? items : [cerrado(99, { opened_by_name: 'Turno viejo' })],
    total,
  }))
  entrarComo()
  return { api, ...montar(<CashHistory />) }
}

describe('CashHistory', () => {
  it('sin turnos lo dice', async () => {
    abrir([])
    expect(await screen.findByText('Todavía no hay turnos de caja')).toBeInTheDocument()
  })

  it('cada turno dice quién cerró y si cuadró, sobró o faltó', async () => {
    abrir([
      cerrado(1),
      cerrado(2, { difference: '-4.00', counted_cash: '196.00' }),
      turnoDeCaja({ id: 3, is_open: true, expected_cash: null }),
    ])
    expect(await screen.findByText('Cuadró')).toHaveClass('text-success')
    expect(screen.getByText('Diferencia -S/ 4.00')).toHaveClass('text-destructive')
    expect(screen.getAllByText(/Cerró Luis Rojas/u)).toHaveLength(2)
    expect(screen.getByText('En curso')).toBeInTheDocument()
    expect(screen.getByText(/^Abierta/u)).toBeInTheDocument()
  })

  it('pagina de a diez turnos', async () => {
    const { api, user } = abrir([cerrado(1)], 15)
    expect(await screen.findByText('Página 1 de 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText(/abrió Turno viejo/u)).toBeInTheDocument()
    expect(api.llamadas('get', SESIONES).map((p) => p.params)).toEqual([
      { limit: 10, offset: 0 },
      { limit: 10, offset: 10 },
    ])
  })

  it('al tocar un turno abre su arqueo firmado con la nota del cierre', async () => {
    const resumen = resumenDeCaja({
      discounts: '5.00',
      courtesies: '3.00',
      discounted_orders: 1,
      by_waiter: [{ waiter_id: 8, name: LUIS, payments: 2, sales: '90.00', tips: '6.00' }],
    })
    const detalle = cerrado(1, { summary: resumen, closing_notes: 'Billete falso', difference: '2.00', counted_cash: '202.00' })
    const { api, user } = abrir([cerrado(1)])
    api.on('get', '/cash/sessions/1', detalle)

    await user.click(await screen.findByRole('button', { name: /Cuadró/u }))

    const ventana = await screen.findByRole('dialog', { name: 'Turno de caja 1' })
    expect(await within(ventana).findByText('Nota: Billete falso')).toBeInTheDocument()
    expect(within(ventana).getByText('Contado S/ 202.00 · diferencia S/ 2.00')).toBeInTheDocument()
    const propinas = within(ventana).getByRole('table', { name: /Propinas por mesero/u })
    expect(within(propinas).getByRole('rowheader', { name: LUIS })).toBeInTheDocument()
    expect(within(ventana).getByText(/Descuentos: S\/ 5.00 en 1 pedido · Cortesías: S\/ 3.00/u)).toBeInTheDocument()
  })

  it('si el turno no se puede leer lo dice dentro de la ventana', async () => {
    const { api, user } = abrir([cerrado(1)])
    api.on('get', '/cash/sessions/1', new RespuestaDeError(404, 'Ese turno no existe'))

    await user.click(await screen.findByRole('button', { name: /Cuadró/u }))

    const ventana = await screen.findByRole('dialog')
    expect(await within(ventana).findByText('Ese turno no existe')).toBeInTheDocument()
  })

  it('si la lista falla muestra el error', async () => {
    servidor().on('get', SESIONES, new RespuestaDeError(500, 'Sin conexión con la base'))
    entrarComo()
    montar(<CashHistory />)
    expect(await screen.findByText('Sin conexión con la base')).toBeInTheDocument()
  })
})
