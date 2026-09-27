import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { cambioDeStock, insumo } from '#jest/fixtures/inventario'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import InventoryView from './InventoryView'

const INSUMOS = '/inventory/ingredients'
const LIMON = insumo()
const NUEVO = 'Nuevo insumo'
const MINIMO = 'Stock mínimo'
const CREAR = { name: 'Crear insumo' }
const COMPRAS = '/inventory/purchases'
const AJUSTES = '/inventory/adjustments'

function abrir() {
  const api = servidor().on('get', INSUMOS, [LIMON]).on('get', '/inventory/alerts/low-stock', []).on('get', '/restaurant', new RespuestaDeError(404))
  entrarComo()
  return { api, ...montar(<InventoryView />, { path: '/inventario' }) }
}

async function accion(user: ReturnType<typeof abrir>['user'], boton: string, titulo: string) {
  await user.click(await screen.findByRole('button', { name: boton }))
  return screen.findByRole('dialog', { name: titulo })
}

describe('alta y edición de insumos', () => {
  it('crea un insumo con el mínimo en kilos y el costo por kilo, enviados en gramos', async () => {
    const { api, user } = abrir()
    api.on('post', INSUMOS, insumo({ id: 5, name: 'Pollo' }))
    const ventana = await accion(user, NUEVO, NUEVO)

    await user.type(within(ventana).getByLabelText('Nombre'), 'Pollo')
    await user.type(within(ventana).getByLabelText(MINIMO), '2,5')
    await user.type(within(ventana).getByLabelText('Costo por kg (S/)'), '12')
    await user.click(within(ventana).getByRole('button', CREAR))

    expect(await screen.findByText('Insumo Pollo creado.')).toBeInTheDocument()
    expect(api.llamadas('post', INSUMOS)[0]?.body).toEqual({ name: 'Pollo', unit: 'g', min_stock: '2500', unit_cost: '0.012' })
  })

  it('al elegir unidades, el mínimo y el costo se piden por unidad', async () => {
    const { api, user } = abrir()
    api.on('post', INSUMOS, insumo({ id: 6, name: 'Gaseosa', unit: 'unit' }))
    const ventana = await accion(user, NUEVO, NUEVO)

    await user.selectOptions(within(ventana).getByLabelText('Cómo se mide'), 'unit')
    expect(within(ventana).getByLabelText('Costo por unid. (S/)')).toBeInTheDocument()
    expect(within(ventana).queryByLabelText('Unidad de stock mínimo')).not.toBeInTheDocument()
    await user.type(within(ventana).getByLabelText('Nombre'), 'Gaseosa')
    await user.type(within(ventana).getByLabelText(MINIMO), '24')
    await user.click(within(ventana).getByRole('button', CREAR))

    expect(await screen.findByText('Insumo Gaseosa creado.')).toBeInTheDocument()
    expect(api.llamadas('post', INSUMOS)[0]?.body).toEqual({ name: 'Gaseosa', unit: 'unit', min_stock: '24', unit_cost: '0' })
  })

  it('editar parte de los datos en kilos, no deja cambiar la unidad y muestra el error del servidor', async () => {
    const { api, user } = abrir()
    api.on('patch', `${INSUMOS}/1`, new RespuestaDeError(409, 'Ya hay un insumo con ese nombre.'))
    const ventana = await accion(user, 'Editar Limón', 'Editar: Limón')

    expect(within(ventana).getByLabelText(MINIMO)).toHaveValue('2')
    expect(within(ventana).getByText(/Se mide en/u)).toHaveTextContent('Se mide en gramos')
    await user.click(within(ventana).getByRole('button', { name: 'Guardar' }))

    expect(await within(ventana).findByText('Ya hay un insumo con ese nombre.')).toBeInTheDocument()
    expect(api.llamadas('patch', `${INSUMOS}/1`)[0]?.body).toEqual({ name: 'Limón', min_stock: '2000', unit_cost: '0.004' })
  })

  it('sin nombre no se envía', async () => {
    const { api, user } = abrir()
    const ventana = await accion(user, NUEVO, NUEVO)
    await user.click(within(ventana).getByRole('button', CREAR))
    expect(await within(ventana).findByText('Escribe el nombre del insumo')).toBeInTheDocument()
    expect(api.llamadas('post', INSUMOS)).toHaveLength(0)
  })
})

describe('compras, mermas y ajustes', () => {
  it('una compra por kilo muestra el total, cómo queda el stock y lo envía en gramos', async () => {
    const { api, user } = abrir()
    api.on('post', COMPRAS, cambioDeStock(insumo({ stock: '10000' })))
    const ventana = await accion(user, 'Compra de Limón', 'Registrar compra: Limón')

    expect(within(ventana).getByLabelText('Costo por kg (S/)')).toHaveValue('4')
    await user.type(within(ventana).getByLabelText('Cantidad comprada'), '5')
    expect(within(ventana).getByText(/Total S\/\s20\.00 · sale a S\/\s4\.00 por kg/u)).toBeInTheDocument()
    expect(within(ventana).getByText(/quedará en/u).parentElement).toHaveTextContent('Hoy hay 5 kg → quedará en 10 kg')
    await user.click(within(ventana).getByRole('button', { name: 'Registrar compra' }))

    expect(await screen.findByText('Compra registrada: Limón queda en 10 kg')).toBeInTheDocument()
    expect(api.llamadas('post', COMPRAS)[0]?.body).toEqual({ ingredient_id: 1, quantity: '5000', unit_cost: '0.004', reason: '' })
  })

  it('con el total pagado, el costo por gramo sale de dividir', async () => {
    const { api, user } = abrir()
    api.on('post', COMPRAS, cambioDeStock(insumo({ stock: '5500' })))
    const ventana = await accion(user, 'Compra de Limón', 'Registrar compra: Limón')

    await user.type(within(ventana).getByLabelText('Cantidad comprada'), '500')
    await user.selectOptions(within(ventana).getByLabelText('Unidad de cantidad comprada'), 'g')
    await user.click(within(ventana).getByLabelText('Total pagado'))
    const costo = within(ventana).getByLabelText('Total pagado (S/)')
    await user.clear(costo)
    await user.type(costo, '3')
    await user.click(within(ventana).getByRole('button', { name: 'Registrar compra' }))

    expect(await screen.findByText(/Compra registrada/u)).toBeInTheDocument()
    expect(api.llamadas('post', COMPRAS)[0]?.body).toMatchObject({ quantity: '500', unit_cost: '0.006' })
  })

  it('una merma exige motivo, avisa si deja el stock bajo el mínimo y se envía en gramos', async () => {
    const { api, user } = abrir()
    api.on('post', '/inventory/waste', cambioDeStock(insumo({ stock: '1000' })))
    const ventana = await accion(user, 'Merma de Limón', 'Registrar merma: Limón')

    await user.type(within(ventana).getByLabelText('Cantidad perdida'), '4000')
    expect(within(ventana).getByText(/todavía bajo el mínimo/u)).toBeInTheDocument()
    await user.click(within(ventana).getByRole('button', { name: 'Registrar merma' }))
    expect(await within(ventana).findByText('Escribe el motivo de la merma')).toBeInTheDocument()

    await user.type(within(ventana).getByLabelText('Motivo'), 'Se malogró con el calor')
    await user.click(within(ventana).getByRole('button', { name: 'Registrar merma' }))
    expect(await screen.findByText('Merma registrada: Limón queda en 1 kg')).toBeInTheDocument()
    expect(api.llamadas('post', '/inventory/waste')[0]?.body).toEqual({ ingredient_id: 1, quantity: '4000', reason: 'Se malogró con el calor' })
  })

  it('un conteo envía lo contado y el servidor calcula la diferencia', async () => {
    const { api, user } = abrir()
    api.on('post', AJUSTES, cambioDeStock(insumo({ stock: '3000' }), { kind: 'adjustment', quantity: '-2000' }))
    const ventana = await accion(user, 'Ajuste de Limón', 'Ajustar stock: Limón')

    await user.type(within(ventana).getByLabelText('Stock contado'), '3')
    expect(within(ventana).getByText(/quedará en/u).parentElement).toHaveTextContent('quedará en 3 kg')
    await user.click(within(ventana).getByRole('button', { name: 'Guardar ajuste' }))

    expect(await screen.findByText('Ajuste de −2 kg: Limón queda en 3 kg')).toBeInTheDocument()
    expect(api.llamadas('post', AJUSTES)[0]?.body).toEqual({ ingredient_id: 1, reason: 'Conteo físico', counted_stock: '3000' })
  })

  it('una diferencia que sobra se suma; si falla, el error queda en el formulario', async () => {
    const { api, user } = abrir()
    api.on('post', AJUSTES, new RespuestaDeError(422, 'El motivo es muy corto.'))
    const ventana = await accion(user, 'Ajuste de Limón', 'Ajustar stock: Limón')

    await user.click(within(ventana).getByLabelText('Sé cuánto sobra o falta'))
    await user.selectOptions(within(ventana).getByLabelText('La diferencia'), 'add')
    await user.type(within(ventana).getByLabelText('Cantidad de la diferencia'), '1')
    await user.click(within(ventana).getByRole('button', { name: 'Guardar ajuste' }))

    expect(await within(ventana).findByText('El motivo es muy corto.')).toBeInTheDocument()
    expect(api.llamadas('post', AJUSTES)[0]?.body).toEqual({ ingredient_id: 1, reason: 'Conteo físico', quantity: '1000' })
  })
})
