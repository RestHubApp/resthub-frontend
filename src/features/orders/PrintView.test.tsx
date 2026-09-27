import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { screen } from '@testing-library/react'

import { itemDePedido, pedido } from '#jest/fixtures/pedidos'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import PrintView from './PrintView'

const RUTA = '/imprimir/:orderId/:kind'
const imprimir = jest.fn()
const originalPrint = window.print.bind(window)

const DELIVERY_PAGADO = pedido({
  type: 'delivery',
  table_label: null,
  customer_name: 'Ana',
  customer_phone: '987654321',
  delivery_address: 'Av. Larco 123',
  status: 'paid',
  notes: 'tocar el timbre',
  items: [
    itemDePedido({ quantity: 2, subtotal: '64.00', notes: 'sin cebolla', modifiers: [{ group: 'Término', option: 'Tres cuartos', price: '0.00' }] }),
    itemDePedido({ id: 102, name: 'Chicha morada', subtotal: '8.00', is_courtesy: true }),
  ],
  courtesy_amount: '8.00',
  discount_amount: '6.40',
  discount_percent: '10',
  total: '57.60',
  change: '2.40',
  payments: [
    { id: 1, method: 'cash', method_label: 'Efectivo', amount: '57.60', tip: '5.00', amount_received: '65.00', change: '2.40', item_ids: [], received_by: 7, received_by_name: 'Ana Torres', created_at: '2026-09-26T18:00:00Z' },
  ],
  paid_at: '2026-09-26T18:00:00Z',
})

function abrir(kind: string, respuesta: unknown = DELIVERY_PAGADO) {
  servidor().on('get', '/orders/5', respuesta)
  entrarComo()
  return montar(<PrintView />, { path: RUTA, en: `/imprimir/5/${kind}` })
}

beforeEach(() => {
  window.print = imprimir
})

afterEach(() => {
  window.print = originalPrint
})

describe('PrintView', () => {
  it('la comanda lleva platos, opciones y notas en mayúsculas, sin precios, y se imprime sola', async () => {
    abrir('comanda')
    expect(await screen.findByText('Comanda')).toBeInTheDocument()
    expect(screen.getByText('2 × Lomo saltado')).toBeInTheDocument()
    expect(screen.getByText('Tres cuartos')).toBeInTheDocument()
    expect(screen.getByText('» sin cebolla')).toBeInTheDocument()
    expect(screen.getByText('Nota: tocar el timbre')).toBeInTheDocument()
    expect(screen.getByText('Tel.: 987654321')).toBeInTheDocument()
    expect(screen.queryByText(/S\//u)).not.toBeInTheDocument()
    expect(imprimir).toHaveBeenCalledTimes(1)
  })

  it('la cuenta pagada es el ticket con cortesías, descuento, pagos y vuelto', async () => {
    abrir('cuenta')
    expect(await screen.findByText('Ticket de venta')).toBeInTheDocument()
    expect(screen.getByText('La Picantería')).toBeInTheDocument()
    expect(screen.getByText(/Chicha morada\s*\(cortesía\)/u)).toBeInTheDocument()
    expect(screen.getByText('Cortesías')).toBeInTheDocument()
    expect(screen.getByText(/Descuento 10/u)).toBeInTheDocument()
    expect(screen.getByText(/S\/\s57\.60 \+ propina S\/\s5\.00/u)).toBeInTheDocument()
    expect(screen.getByText('Vuelto')).toBeInTheDocument()
  })

  it('antes de pagar es la precuenta, y el botón vuelve a imprimir', async () => {
    const { user } = abrir('cuenta', pedido({ status: 'served' }))
    expect(await screen.findByText('Precuenta')).toBeInTheDocument()
    expect(screen.queryByText('Vuelto')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Imprimir' }))
    expect(imprimir).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('link', { name: 'Pedido' })).toHaveAttribute('href', '/pedidos/5')
  })

  it('si el pedido no carga, no imprime una hoja vacía', async () => {
    abrir('cuenta', new RespuestaDeError(404, 'Ese pedido no existe.'))
    expect(await screen.findByText('Ese pedido no existe.')).toBeInTheDocument()
    expect(imprimir).not.toHaveBeenCalled()
  })
})
