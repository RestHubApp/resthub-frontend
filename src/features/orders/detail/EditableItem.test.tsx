import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { pedido, plato } from '#jest/fixtures/cobro'
import { entrarComo, montar, PERMISOS_MESERO, RespuestaDeError, servidor } from '#jest/harness'
import OrderItems from './OrderItems'

const PLATO = '/orders/12/items/1'
const NOTA = 'Sin cebolla'
const abierto = pedido({ status: 'open', items: [plato({ notes: NOTA })], item_count: 1 })
const sinBandera = () => undefined

function editar(order = abierto) {
  const api = servidor()
  entrarComo(PERMISOS_MESERO)
  return { api, ...montar(<OrderItems order={order} flagFor={sinBandera} />) }
}

describe('platos de un pedido abierto', () => {
  it('explica que todavía se pueden cambiar y muestra la nota', () => {
    editar()

    expect(screen.getByText('Todavía no está en cocina: puedes cambiar cantidades, notas o quitar platos.')).toBeInTheDocument()
    expect(screen.getByText(NOTA)).toBeInTheDocument()
  })

  it('«+» pide una cantidad más al servidor', async () => {
    const { api, user } = editar()
    api.on('patch', PLATO, abierto)

    await user.click(screen.getByRole('button', { name: 'Uno más de Lomo saltado' }))

    expect(api.llamadas('patch', PLATO)[0]?.body).toEqual({ quantity: 2 })
  })

  it('con uno solo, «−» quita el plato y lo avisa', async () => {
    const { api, user } = editar()
    api.on('delete', PLATO, pedido({ status: 'open', items: [] }))

    await user.click(screen.getByRole('button', { name: 'Quitar Lomo saltado' }))

    expect(await screen.findByText('Lomo saltado quitado del pedido.')).toBeInTheDocument()
  })

  it('cambiar la nota abre una ventana con la nota actual y la guarda', async () => {
    const { api, user } = editar()
    api.on('patch', PLATO, abierto)

    await user.click(screen.getByRole('button', { name: 'Cambiar nota' }))
    const ventana = within(await screen.findByRole('dialog', { name: 'Nota de Lomo saltado' }))
    const campo = ventana.getByLabelText('Nota para cocina')
    expect(campo).toHaveValue(NOTA)
    await user.clear(campo)
    await user.type(campo, 'Término medio')
    await user.click(ventana.getByRole('button', { name: 'Guardar nota' }))

    expect(api.llamadas('patch', PLATO)[0]?.body).toEqual({ notes: 'Término medio' })
    expect(await screen.findByRole('button', { name: 'Cambiar nota' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('si la cocina ya lo tiene, el servidor rechaza el cambio y se avisa', async () => {
    const { api, user } = editar()
    api.on('patch', PLATO, new RespuestaDeError(409, 'El pedido ya está en cocina.'))

    await user.click(screen.getByRole('button', { name: 'Uno más de Lomo saltado' }))

    expect(await screen.findByText('El pedido ya está en cocina.')).toBeInTheDocument()
  })
})

describe('platos de un pedido en cocina', () => {
  it('se muestran sin controles, con modificadores y precio', () => {
    const conOpciones = plato({ modifiers: [{ group: 'Término', option: 'Tres cuartos', price: '0.00' }] })
    editar(pedido({ status: 'in_kitchen', items: [conOpciones] }))

    expect(screen.getByText('Tres cuartos')).toBeInTheDocument()
    expect(screen.getByText('S/ 30.00')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Lomo saltado/u })).not.toBeInTheDocument()
  })

  it('un pedido sin platos lo dice', () => {
    editar(pedido({ status: 'in_kitchen', items: [] }))

    expect(screen.getByText('Este pedido no tiene platos.')).toBeInTheDocument()
  })
})
