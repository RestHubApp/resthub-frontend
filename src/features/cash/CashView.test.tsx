import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { CAJA_CERRADA, cajaAbierta, resumenDeCaja, turnoDeCaja } from '#jest/fixtures/cash'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import CashView from './CashView'

const PAGINA_VACIA = { items: [], total: 0, limit: 10, offset: 0 }
const ACTUAL = '/cash/current'
const ABRIR = '/cash/open'
const INICIAL = 'Efectivo inicial'
const ABRIR_CAJA = { name: 'Abrir caja' }

function abrirCaja(actual = CAJA_CERRADA) {
  const api = servidor().on('get', ACTUAL, actual).on('get', '/cash/sessions', PAGINA_VACIA)
  entrarComo()
  return { api, ...montar(<CashView />, { path: '/caja' }) }
}

describe('CashView', () => {
  it('sin caja abierta ofrece abrirla y envía el monto con punto decimal', async () => {
    const { api, user } = abrirCaja()
    // Como el servidor: después de abrir, la caja actual es el turno nuevo.
    const turno = turnoDeCaja({ opening_amount: '150.50' })
    api.on('post', ABRIR, () => {
      api.on('get', ACTUAL, cajaAbierta(turno))
      return turno
    })

    await user.type(await screen.findByLabelText(INICIAL), '150,50')
    await user.type(screen.getByLabelText('Nota (opcional)'), 'Turno mañana')
    await user.click(screen.getByRole('button', ABRIR_CAJA))

    expect(await screen.findByText('Caja abierta con S/ 150.50. Ya se puede cobrar.')).toBeInTheDocument()
    expect(api.llamadas('post', ABRIR)[0]?.body).toEqual({ opening_amount: '150.50', notes: 'Turno mañana' })
    expect(await screen.findByRole('heading', { name: 'Turno en curso' })).toBeInTheDocument()
  })

  it('un monto mal escrito no llega al servidor', async () => {
    const { api, user } = abrirCaja()

    await user.type(await screen.findByLabelText(INICIAL), '15.505')
    await user.click(screen.getByRole('button', ABRIR_CAJA))

    expect(await screen.findByText('Escribe un monto como 150 o 150.50')).toBeInTheDocument()
    expect(api.llamadas('post', ABRIR)).toHaveLength(0)
  })

  it('con la caja abierta muestra el arqueo por medio de pago', async () => {
    const resumen = resumenDeCaja({
      sales: '80.00',
      paid_orders: 2,
      expected_cash: '200.00',
      by_method: [{ method: 'cash', method_label: 'Efectivo', payments: 2, amount: '50.00', tips: '0.00' }],
    })
    abrirCaja(cajaAbierta(turnoDeCaja({ summary: resumen })))

    const tabla = await screen.findByRole('table', { name: 'Por medio de pago' })
    expect(within(tabla).getByRole('rowheader', { name: 'Efectivo' })).toBeInTheDocument()
    expect(screen.getByText('S/ 200.00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cerrar caja/i })).toBeInTheDocument()
  })

  it('si el servidor falla, lo dice en vez de mostrar la caja vacía', async () => {
    servidor().on('get', ACTUAL, new RespuestaDeError(500, 'Base caída')).on('get', '/cash/sessions', PAGINA_VACIA)
    entrarComo()
    montar(<CashView />)

    expect(await screen.findByText('Base caída')).toBeInTheDocument()
    expect(screen.queryByRole('button', ABRIR_CAJA)).not.toBeInTheDocument()
  })
})
