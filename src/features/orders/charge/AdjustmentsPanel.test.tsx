import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { pago, pedido, plato } from '#jest/fixtures/cobro'
import { entrarComo, montar, PERMISOS_ENCARGADO, PERMISOS_MESERO, RespuestaDeError, servidor } from '#jest/harness'
import type { OrderResponse } from '../../../api/types'
import AdjustmentsPanel from './AdjustmentsPanel'

const DESCUENTO = '/orders/12/discount'
const CORTESIA = '/orders/12/items/1/courtesy'
const INVITAR_PLATO = 'Invitar un plato (cortesía)'
const APLICAR = { name: 'Aplicar descuento' }
const PORCENTAJE = 'Descuento %'
const MOTIVO = 'Motivo'

function ajustar(order: OrderResponse = pedido(), permisos = PERMISOS_MESERO) {
  const api = servidor()
    .on('get', '/restaurant', { max_waiter_discount_percent: '10.00' })
    .on('put', DESCUENTO, (peticion: { body: unknown }) => ({
      ...order,
      discount_percent: (peticion.body as { percent: string }).percent,
    }))
  entrarComo(permisos)
  return { api, ...montar(<AdjustmentsPanel order={order} />) }
}

describe('descuento del pedido', () => {
  it('el mesero ve su tope y el descuento viaja con punto decimal y motivo', async () => {
    const { api, user } = ajustar()

    await user.click(screen.getByRole('button', APLICAR))
    expect(await screen.findByText('Hasta 10.0 %; más, lo aplica el encargado.')).toBeInTheDocument()
    await user.type(screen.getByLabelText(PORCENTAJE), '7,5')
    await user.type(screen.getByLabelText(MOTIVO), 'Cliente frecuente')
    await user.click(screen.getByRole('button', APLICAR))

    expect(await screen.findByText('Descuento de 7.5 % aplicado.')).toBeInTheDocument()
    expect(api.llamadas('put', DESCUENTO)[0]?.body).toEqual({ percent: '7.5', reason: 'Cliente frecuente' })
    expect(screen.queryByLabelText(PORCENTAJE)).not.toBeInTheDocument()
  })

  it('el encargado descuenta sin tope y no consulta el del mesero', async () => {
    const { api, user } = ajustar(pedido(), PERMISOS_ENCARGADO)

    await user.click(screen.getByRole('button', APLICAR))

    expect(screen.getByText('Sin tope: lo aplicas como encargado.')).toBeInTheDocument()
    expect(api.llamadas('get', '/restaurant')).toHaveLength(0)
  })

  it('valida el porcentaje y el motivo antes de enviar', async () => {
    const { api, user } = ajustar()

    await user.click(screen.getByRole('button', APLICAR))
    await user.type(screen.getByLabelText(PORCENTAJE), '150')
    await user.type(screen.getByLabelText(MOTIVO), 'ok')
    await user.click(screen.getByRole('button', APLICAR))

    expect(await screen.findByText('Como máximo 100 %. Revisa el dato')).toBeInTheDocument()
    expect(screen.getByText('Escribe el motivo (al menos 5 caracteres)')).toBeInTheDocument()
    expect(api.llamadas('put', DESCUENTO)).toHaveLength(0)
  })

  it('si el servidor rechaza el descuento del mesero, muestra por qué', async () => {
    const { api, user } = ajustar()
    api.on('put', DESCUENTO, new RespuestaDeError(403, 'Supera el tope del mesero.'))

    await user.click(screen.getByRole('button', APLICAR))
    await user.type(screen.getByLabelText(PORCENTAJE), '20')
    await user.type(screen.getByLabelText(MOTIVO), 'Demora en cocina')
    await user.click(screen.getByRole('button', APLICAR))

    expect(await screen.findByText('Supera el tope del mesero.')).toBeInTheDocument()
  })

  it('con descuento se puede cambiar o quitar, y quitarlo envía cero', async () => {
    const { api, user } = ajustar(pedido({ discount_amount: '5.00', discount_percent: '10.00' }))

    expect(screen.getByRole('button', { name: 'Cambiar descuento (10.0 %)' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Quitar descuento' }))

    expect(await screen.findByText('Descuento quitado.')).toBeInTheDocument()
    expect(api.llamadas('put', DESCUENTO)[0]?.body).toEqual({ percent: '0', reason: '' })
  })

  it('después del primer pago ya no se puede ajustar la cuenta', () => {
    ajustar(pedido({ payments: [pago()] }), PERMISOS_ENCARGADO)

    expect(screen.queryByRole('region', { name: 'Descuentos y cortesías' })).not.toBeInTheDocument()
  })
})

describe('cortesías', () => {
  it('solo quien descuenta sin tope puede invitar un plato', () => {
    ajustar()

    expect(screen.queryByText(INVITAR_PLATO)).not.toBeInTheDocument()
  })

  it('invitar pide un motivo de al menos cinco letras', async () => {
    const { api, user } = ajustar(pedido(), PERMISOS_ENCARGADO)
    api.on('put', CORTESIA, pedido())

    await user.click(screen.getByText(INVITAR_PLATO))
    await user.click(screen.getAllByRole('button', { name: 'Invitar' })[0])
    const motivo = screen.getByLabelText('Motivo de la cortesía de Lomo saltado')
    await user.type(motivo, 'Cump')
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
    await user.type(motivo, 'leaños ')
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText(INVITAR_PLATO)).toBeInTheDocument()
    expect(api.llamadas('put', CORTESIA)[0]?.body).toEqual({ reason: 'Cumpleaños' })
  })

  it('un plato invitado muestra el motivo y se puede volver a cobrar', async () => {
    const invitado = plato({ is_courtesy: true, courtesy_reason: 'Error de cocina' })
    const { api, user } = ajustar(pedido({ items: [invitado] }), PERMISOS_ENCARGADO)
    api.on('delete', CORTESIA, pedido())

    expect(screen.getByText('Invita la casa: Error de cocina')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cobrar' }))

    expect(api.llamadas('delete', CORTESIA)).toHaveLength(1)
  })
})
