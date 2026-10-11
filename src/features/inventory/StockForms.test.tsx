import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { stockChange, ingredient } from '#jest/fixtures/inventario'
import { signInAs, handleMount, ErrorResponse, server } from '#jest/harness'
import { InventoryView } from './InventoryView'

const INGREDIENTS = '/inventory/ingredients'
const LIMON = ingredient()
const NEW = 'Nuevo insumo'
const MIN = 'Stock mínimo'
const CREATE = { name: 'Crear insumo' }
const PURCHASES = '/inventory/purchases'
const SETTINGS = '/inventory/adjustments'

function open() {
  const api = server().on('get', INGREDIENTS, [LIMON]).on('get', '/inventory/alerts/low-stock', []).on('get', '/restaurant', new ErrorResponse(404))
  signInAs()
  return { api, ...handleMount(<InventoryView />, { path: '/inventario' }) }
}

async function action(user: ReturnType<typeof open>['user'], button: string, title: string) {
  await user.click(await screen.findByRole('button', { name: button }))
  return screen.findByRole('dialog', { name: title })
}

describe('alta y edición de insumos', () => {
  it('crea un insumo con el mínimo en kilos y el costo por kilo, enviados en gramos', async () => {
    const { api, user } = open()
    api.on('post', INGREDIENTS, ingredient({ id: 5, name: 'Pollo' }))
    const window = await action(user, NEW, NEW)

    await user.type(within(window).getByLabelText('Nombre'), 'Pollo')
    await user.type(within(window).getByLabelText(MIN), '2,5')
    await user.type(within(window).getByLabelText('Costo por kg (S/)'), '12')
    await user.click(within(window).getByRole('button', CREATE))

    expect(await screen.findByText('Insumo Pollo creado.')).toBeInTheDocument()
    expect(api.calls('post', INGREDIENTS)[0]?.body).toEqual({ name: 'Pollo', unit: 'g', min_stock: '2500', unit_cost: '0.012' })
  })

  it('al elegir unidades, el mínimo y el costo se piden por unidad', async () => {
    const { api, user } = open()
    api.on('post', INGREDIENTS, ingredient({ id: 6, name: 'Gaseosa', unit: 'unit' }))
    const window = await action(user, NEW, NEW)

    await user.selectOptions(within(window).getByLabelText('Cómo se mide'), 'unit')
    expect(within(window).getByLabelText('Costo por unid. (S/)')).toBeInTheDocument()
    expect(within(window).queryByLabelText('Unidad de stock mínimo')).not.toBeInTheDocument()
    await user.type(within(window).getByLabelText('Nombre'), 'Gaseosa')
    await user.type(within(window).getByLabelText(MIN), '24')
    await user.click(within(window).getByRole('button', CREATE))

    expect(await screen.findByText('Insumo Gaseosa creado.')).toBeInTheDocument()
    expect(api.calls('post', INGREDIENTS)[0]?.body).toEqual({ name: 'Gaseosa', unit: 'unit', min_stock: '24', unit_cost: '0' })
  })

  it('editar parte de los datos en kilos, no deja cambiar la unidad y muestra el error del servidor', async () => {
    const { api, user } = open()
    api.on('patch', `${INGREDIENTS}/1`, new ErrorResponse(409, 'Ya hay un insumo con ese nombre.'))
    const window = await action(user, 'Editar Limón', 'Editar: Limón')

    expect(within(window).getByLabelText(MIN)).toHaveValue('2')
    expect(within(window).getByText(/Se mide en/u)).toHaveTextContent('Se mide en gramos')
    await user.click(within(window).getByRole('button', { name: 'Guardar' }))

    expect(await within(window).findByText('Ya hay un insumo con ese nombre.')).toBeInTheDocument()
    expect(api.calls('patch', `${INGREDIENTS}/1`)[0]?.body).toEqual({ name: 'Limón', min_stock: '2000', unit_cost: '0.004' })
  })

  it('sin nombre no se envía', async () => {
    const { api, user } = open()
    const window = await action(user, NEW, NEW)
    await user.click(within(window).getByRole('button', CREATE))
    expect(await within(window).findByText('Escribe el nombre del insumo')).toBeInTheDocument()
    expect(api.calls('post', INGREDIENTS)).toHaveLength(0)
  })
})

describe('compras, mermas y ajustes', () => {
  it('una compra por kilo muestra el total, cómo queda el stock y lo envía en gramos', async () => {
    const { api, user } = open()
    api.on('post', PURCHASES, stockChange(ingredient({ stock: '10000' })))
    const window = await action(user, 'Compra de Limón', 'Registrar compra: Limón')

    expect(within(window).getByLabelText('Costo por kg (S/)')).toHaveValue('4')
    await user.type(within(window).getByLabelText('Cantidad comprada'), '5')
    expect(within(window).getByText(/Total S\/\s20\.00 · sale a S\/\s4\.00 por kg/u)).toBeInTheDocument()
    expect(within(window).getByText(/quedará en/u).parentElement).toHaveTextContent('Hoy hay 5 kg → quedará en 10 kg')
    await user.click(within(window).getByRole('button', { name: 'Registrar compra' }))

    expect(await screen.findByText('Compra registrada: Limón queda en 10 kg')).toBeInTheDocument()
    expect(api.calls('post', PURCHASES)[0]?.body).toEqual({ ingredient_id: 1, quantity: '5000', unit_cost: '0.004', reason: '' })
  })

  it('con el total pagado, el costo por gramo sale de dividir', async () => {
    const { api, user } = open()
    api.on('post', PURCHASES, stockChange(ingredient({ stock: '5500' })))
    const window = await action(user, 'Compra de Limón', 'Registrar compra: Limón')

    await user.type(within(window).getByLabelText('Cantidad comprada'), '500')
    await user.selectOptions(within(window).getByLabelText('Unidad de cantidad comprada'), 'g')
    await user.click(within(window).getByLabelText('Total pagado'))
    const cost = within(window).getByLabelText('Total pagado (S/)')
    await user.clear(cost)
    await user.type(cost, '3')
    await user.click(within(window).getByRole('button', { name: 'Registrar compra' }))

    expect(await screen.findByText(/Compra registrada/u)).toBeInTheDocument()
    expect(api.calls('post', PURCHASES)[0]?.body).toMatchObject({ quantity: '500', unit_cost: '0.006' })
  })

  it('una merma exige motivo, avisa si deja el stock bajo el mínimo y se envía en gramos', async () => {
    const { api, user } = open()
    api.on('post', '/inventory/waste', stockChange(ingredient({ stock: '1000' })))
    const window = await action(user, 'Merma de Limón', 'Registrar merma: Limón')

    await user.type(within(window).getByLabelText('Cantidad perdida'), '4000')
    expect(within(window).getByText(/todavía bajo el mínimo/u)).toBeInTheDocument()
    await user.click(within(window).getByRole('button', { name: 'Registrar merma' }))
    expect(await within(window).findByText('Escribe el motivo de la merma')).toBeInTheDocument()

    await user.type(within(window).getByLabelText('Motivo'), 'Se malogró con el calor')
    await user.click(within(window).getByRole('button', { name: 'Registrar merma' }))
    expect(await screen.findByText('Merma registrada: Limón queda en 1 kg')).toBeInTheDocument()
    expect(api.calls('post', '/inventory/waste')[0]?.body).toEqual({ ingredient_id: 1, quantity: '4000', reason: 'Se malogró con el calor' })
  })

  it('un conteo envía lo contado y el servidor calcula la diferencia', async () => {
    const { api, user } = open()
    api.on('post', SETTINGS, stockChange(ingredient({ stock: '3000' }), { kind: 'adjustment', quantity: '-2000' }))
    const window = await action(user, 'Ajuste de Limón', 'Ajustar stock: Limón')

    await user.type(within(window).getByLabelText('Stock contado'), '3')
    expect(within(window).getByText(/quedará en/u).parentElement).toHaveTextContent('quedará en 3 kg')
    await user.click(within(window).getByRole('button', { name: 'Guardar ajuste' }))

    expect(await screen.findByText('Ajuste de −2 kg: Limón queda en 3 kg')).toBeInTheDocument()
    expect(api.calls('post', SETTINGS)[0]?.body).toEqual({ ingredient_id: 1, reason: 'Conteo físico', counted_stock: '3000' })
  })

  it('una diferencia que sobra se suma; si falla, el error queda en el formulario', async () => {
    const { api, user } = open()
    api.on('post', SETTINGS, new ErrorResponse(422, 'El motivo es muy corto.'))
    const window = await action(user, 'Ajuste de Limón', 'Ajustar stock: Limón')

    await user.click(within(window).getByLabelText('Sé cuánto sobra o falta'))
    await user.selectOptions(within(window).getByLabelText('La diferencia'), 'add')
    await user.type(within(window).getByLabelText('Cantidad de la diferencia'), '1')
    await user.click(within(window).getByRole('button', { name: 'Guardar ajuste' }))

    expect(await within(window).findByText('El motivo es muy corto.')).toBeInTheDocument()
    expect(api.calls('post', SETTINGS)[0]?.body).toEqual({ ingredient_id: 1, reason: 'Conteo físico', quantity: '1000' })
  })
})
