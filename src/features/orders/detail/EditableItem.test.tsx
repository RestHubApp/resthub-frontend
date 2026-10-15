import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { buildOrder, dish } from '#jest/fixtures/charge'
import { signInAs, mountScreen, PERMISSIONS_WAITER, ErrorResponse, server } from '#jest/harness'
import { OrderItems } from './OrderItems'

const DISH = '/orders/12/items/1'
const NOTE = 'Sin cebolla'
const open = buildOrder({ status: 'open', items: [dish({ notes: NOTE })], item_count: 1 })
const withoutFlag = () => undefined
const ignoreCancel = () => undefined

function edit(order = open) {
  const api = server()
  signInAs(PERMISSIONS_WAITER)
  return { api, ...mountScreen(<OrderItems order={order} flagFor={withoutFlag} onCancelOrder={ignoreCancel} />) }
}

describe('platos de un pedido abierto', () => {
  it('explica que todavía se pueden cambiar y muestra la nota', () => {
    edit()

    expect(screen.getByText('Todavía no está en cocina: puedes cambiar cantidades, notas o quitar platos.')).toBeInTheDocument()
    expect(screen.getByText(NOTE)).toBeInTheDocument()
  })

  it('«+» pide una cantidad más al servidor', async () => {
    const { api, user } = edit()
    api.on('patch', DISH, open)

    await user.click(screen.getByRole('button', { name: 'Uno más de Lomo saltado' }))

    expect(api.calls('patch', DISH)[0]?.body).toEqual({ quantity: 2 })
  })

  it('con uno solo, «−» quita el plato y lo avisa', async () => {
    const { api, user } = edit()
    api.on('delete', DISH, buildOrder({ status: 'open', items: [] }))

    await user.click(screen.getByRole('button', { name: 'Quitar Lomo saltado' }))

    expect(await screen.findByText('Lomo saltado quitado del pedido.')).toBeInTheDocument()
  })

  it('cambiar la nota abre una ventana con la nota actual y la guarda', async () => {
    const { api, user } = edit()
    api.on('patch', DISH, open)

    await user.click(screen.getByRole('button', { name: 'Cambiar nota' }))
    const window = within(await screen.findByRole('dialog', { name: 'Nota de Lomo saltado' }))
    const field = window.getByLabelText('Nota para cocina')
    expect(field).toHaveValue(NOTE)
    await user.clear(field)
    await user.type(field, 'Término medio')
    await user.click(window.getByRole('button', { name: 'Guardar nota' }))

    expect(api.calls('patch', DISH)[0]?.body).toEqual({ notes: 'Término medio' })
    expect(await screen.findByRole('button', { name: 'Cambiar nota' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('si la cocina ya lo tiene, el servidor rechaza el cambio y se avisa', async () => {
    const { api, user } = edit()
    api.on('patch', DISH, new ErrorResponse(409, 'El pedido ya está en cocina.'))

    await user.click(screen.getByRole('button', { name: 'Uno más de Lomo saltado' }))

    expect(await screen.findByText('El pedido ya está en cocina.')).toBeInTheDocument()
  })
})

describe('platos de un pedido en cocina', () => {
  it('se muestran sin controles, con modificadores y precio', () => {
    const withOptions = dish({ modifiers: [{ group: 'Término', option: 'Tres cuartos', price: '0.00' }] })
    edit(buildOrder({ status: 'in_kitchen', items: [withOptions] }))

    expect(screen.getByText('Tres cuartos')).toBeInTheDocument()
    expect(screen.getByText('S/ 30.00')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Lomo saltado/u })).not.toBeInTheDocument()
  })

  it('un pedido sin platos lo dice', () => {
    edit(buildOrder({ status: 'in_kitchen', items: [] }))

    expect(screen.getByText('Este pedido no tiene platos.')).toBeInTheDocument()
  })
})
