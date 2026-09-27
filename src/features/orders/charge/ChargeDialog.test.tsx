import { describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { pagado, pago, pedido } from '#jest/fixtures/cobro'
import { entrarComo, montar, RespuestaDeError, servidor, type Peticion } from '#jest/harness'
import type { OrderResponse } from '../../../api/types'
import ChargeDialog from './ChargeDialog'

const PAGOS = '/orders/12/payments'
const CONFIRMAR = { name: 'Confirmar pago' }
const RECIBIDO = 'Monto recibido'
const REGISTRADO = { name: 'Cobro registrado' }
const COBRANDO = { name: 'Cobrar pedido #34' }

// Un servidor que recuerda el pedido: cada pago lo cambia y la consulta lo relee.
type AlPagar = (peticion: Peticion, actual: OrderResponse) => OrderResponse | RespuestaDeError

function cobrar(inicial: OrderResponse = pedido(), responder?: AlPagar) {
  let actual = inicial
  const api = servidor()
    .on('get', '/cash/current', { is_open: true, session: null })
    .on('get', '/orders/12', () => actual)
  api.on('post', PAGOS, (peticion: Peticion) => {
    const respuesta = responder ? responder(peticion, actual) : pagado(actual, pago({ method: 'cash', method_label: 'Efectivo' }))
    if (!(respuesta instanceof RespuestaDeError)) {
      actual = respuesta
    }
    return respuesta
  })
  entrarComo()
  const onClose = jest.fn()
  const montaje = montar(<ChargeDialog order={inicial} onClose={onClose} />)
  return { api, onClose, ...montaje }
}

function cuerpoDelPago(api: ReturnType<typeof servidor>) {
  return api.llamadas('post', PAGOS)[0]?.body
}

describe('ChargeDialog: todo junto', () => {
  it('en efectivo calcula el vuelto en vivo y envía el saldo esperado', async () => {
    const { api, user } = cobrar(pedido(), (_p, actual) =>
      pagado(actual, pago({ method: 'cash', method_label: 'Efectivo', amount: '50.00', amount_received: '100.00', change: '50.00' })),
    )

    expect(await screen.findByRole('dialog', COBRANDO)).toBeInTheDocument()
    expect(screen.getByText('Total a cobrar')).toBeInTheDocument()
    await user.type(screen.getByLabelText(RECIBIDO), '100')
    expect(screen.getByText('Vuelto').nextSibling).toHaveTextContent('S/ 50.00')
    await user.click(screen.getByRole('button', CONFIRMAR))

    expect(await screen.findByRole('dialog', REGISTRADO)).toBeInTheDocument()
    expect(screen.getByText('Pedido #34 pagado · Efectivo')).toBeInTheDocument()
    expect(cuerpoDelPago(api)).toEqual({
      payment_method: 'cash',
      amount_received: '100',
      tip: '0',
      expected_balance: '50.00',
    })
    expect(await screen.findByText('Pedido #34 pagado.')).toBeInTheDocument()
  })

  it('no deja cobrar en efectivo si lo recibido no cubre la cuenta', async () => {
    const { api, user } = cobrar()

    await user.type(await screen.findByLabelText(RECIBIDO), '40')
    expect(screen.getByText('Vuelto').nextSibling).toHaveTextContent('—')
    await user.click(screen.getByRole('button', CONFIRMAR))

    expect(await screen.findByText('El monto no cubre lo que se cobra')).toBeInTheDocument()
    expect(api.llamadas('post', PAGOS)).toHaveLength(0)
  })

  it('la propina rápida se suma a lo que se cobra y viaja aparte', async () => {
    const { api, user } = cobrar()

    const rapidas = within(await screen.findByRole('group', { name: 'Propinas rápidas' }))
    await user.click(rapidas.getByRole('button', { name: /^S\/\s5\.00$/u }))
    await user.click(within(screen.getByRole('group', { name: 'Montos rápidos' })).getByRole('button', { name: 'Monto exacto' }))
    expect(screen.getByLabelText(RECIBIDO)).toHaveValue('55.00')
    await user.click(screen.getByRole('button', CONFIRMAR))

    await screen.findByRole('dialog', REGISTRADO)
    expect(cuerpoDelPago(api)).toMatchObject({ tip: '5', amount_received: '55.00' })
  })

  it('con Yape no pide el monto recibido y lo envía vacío', async () => {
    const { api, user } = cobrar()

    await user.click(await screen.findByRole('radio', { name: 'Yape' }))
    expect(screen.queryByLabelText(RECIBIDO)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', CONFIRMAR))

    await screen.findByRole('dialog', REGISTRADO)
    expect(cuerpoDelPago(api)).toMatchObject({ payment_method: 'yape', amount_received: null })
  })

  it('una propina mal escrita se marca en el campo', async () => {
    const { api, user } = cobrar()

    await user.type(await screen.findByLabelText('Propina (opcional)'), 'dos')
    await user.click(screen.getByRole('button', CONFIRMAR))

    expect(await screen.findByText('Escribe un monto como 100 o 100.50')).toBeInTheDocument()
    expect(api.llamadas('post', PAGOS)).toHaveLength(0)
  })
})

describe('ChargeDialog: sin caja o con error', () => {
  it('con la caja cerrada lo avisa y no deja confirmar', async () => {
    servidor().on('get', '/cash/current', { is_open: false, session: null })
    entrarComo()
    montar(<ChargeDialog order={pedido()} onClose={jest.fn()} />)

    expect(await screen.findByText('La caja está cerrada.')).toBeInTheDocument()
    expect(screen.getByRole('button', CONFIRMAR)).toBeDisabled()
  })

  it('si el servidor rechaza el pago muestra su motivo y la ventana sigue abierta', async () => {
    const { api, user } = cobrar(pedido(), () => new RespuestaDeError(409, 'El saldo cambió: vuelve a revisar la cuenta.'))

    await user.click(await screen.findByRole('button', CONFIRMAR))

    expect(await screen.findByText('El saldo cambió: vuelve a revisar la cuenta.')).toBeInTheDocument()
    expect(screen.getByRole('dialog', COBRANDO)).toBeInTheDocument()
    expect(api.llamadas('post', PAGOS)).toHaveLength(1)
  })

  it('«Volver» cierra la ventana sin cobrar', async () => {
    const { api, onClose, user } = cobrar()

    await user.click(await screen.findByRole('button', { name: 'Volver' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(api.llamadas('post', PAGOS)).toHaveLength(0)
  })

  it('Escape cierra la ventana como «Volver»', async () => {
    const { onClose, user } = cobrar()

    await screen.findByRole('dialog', COBRANDO)
    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('sin pedido no muestra nada', () => {
    servidor()
    entrarComo()
    montar(<ChargeDialog order={null} onClose={jest.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
