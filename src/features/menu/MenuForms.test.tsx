import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { carta, categoria, plato } from '#jest/fixtures/inventario'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import type { MenuResponse } from '../../api/types'
import MenuView from './MenuView'

const MENU = '/menu'
const ITEMS = '/menu/items'
const NOMBRE = 'Nombre'
const OPCIONES = /Una opción por línea/u
const CREADO = '2026-09-26T13:00:00Z'
const PRECIO = 'Precio (S/)'
const CREAR_PLATO = { name: 'Crear plato' }
const PLATO_10 = '/menu/items/10'
const CATEGORIA_1 = '/menu/categories/1'

function abrirMenu() {
  const api = servidor().on('get', MENU, carta()).on('get', '/inventory/recipes', [])
  entrarComo()
  return { api, ...montar(<MenuView />, { path: '/menu' }) }
}

// Como el servidor: después del cambio, la carta que se relee ya lo trae.
function yLuego(api: ReturnType<typeof abrirMenu>['api'], respuesta: unknown, despues: MenuResponse) {
  return () => {
    api.on('get', MENU, despues)
    return respuesta
  }
}

function conCategoria(extra: MenuResponse['categories'][number]): MenuResponse {
  return { categories: [...carta().categories, extra] }
}

async function abrirNuevoPlato(user: ReturnType<typeof abrirMenu>['user']) {
  await user.click(await screen.findByRole('button', { name: 'Nuevo plato' }))
  return screen.findByRole('dialog', { name: 'Nuevo plato' })
}

describe('crear en la carta', () => {
  it('una categoría nueva aparece al final, sin platos', async () => {
    const { api, user } = abrirMenu()
    const postres = { id: 3, name: 'Postres', position: 2, is_active: true, created_at: CREADO }
    api.on('post', '/menu/categories', yLuego(api, postres, conCategoria({ ...postres, items: [] })))

    await user.click(await screen.findByRole('button', { name: 'Nueva categoría' }))
    const ventana = await screen.findByRole('dialog', { name: 'Nueva categoría' })
    await user.type(within(ventana).getByLabelText(NOMBRE), 'Postres')
    await user.click(within(ventana).getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByRole('region', { name: 'Postres' })).toBeInTheDocument()
    expect(api.llamadas('post', '/menu/categories')[0]?.body).toEqual({ name: 'Postres' })
  })

  it('un plato con opciones viaja con el precio con punto y sus grupos', async () => {
    const { api, user } = abrirMenu()
    const chicha = plato({ id: 12, name: 'Chicha', category_id: 2, price: '6.50' })
    const despues = carta()
    despues.categories[1]?.items.push(chicha)
    api.on('post', ITEMS, yLuego(api, chicha, despues))
    const ventana = await abrirNuevoPlato(user)

    await user.type(within(ventana).getByLabelText(NOMBRE), 'Chicha')
    await user.type(within(ventana).getByLabelText(PRECIO), '6,5')
    await user.selectOptions(within(ventana).getByLabelText('Categoría'), 'Bebidas')
    await user.click(within(ventana).getByRole('button', { name: 'Agregar grupo de opciones' }))
    await user.type(within(ventana).getByLabelText('Grupo'), 'Tamaño')
    await user.click(within(ventana).getByRole('checkbox'))
    await user.type(within(ventana).getByLabelText(OPCIONES), 'Vaso{Enter}Jarra = 12,50')
    await user.click(within(ventana).getByRole('button', CREAR_PLATO))

    expect(await screen.findByText('Chicha')).toBeInTheDocument()
    expect(api.llamadas('post', ITEMS)[0]?.body).toEqual({
      category_id: 2,
      name: 'Chicha',
      description: '',
      price: '6.5',
      is_available: true,
      modifier_groups: [
        { name: 'Tamaño', min_choices: 1, max_choices: 1, options: [{ name: 'Vaso', price: '0' }, { name: 'Jarra', price: '12.50' }] },
      ],
    })
  })

  it('un grupo sin nombre frena el envío con su explicación', async () => {
    const { api, user } = abrirMenu()
    const ventana = await abrirNuevoPlato(user)

    await user.type(within(ventana).getByLabelText(NOMBRE), 'Chicha')
    await user.type(within(ventana).getByLabelText(PRECIO), '6')
    await user.selectOptions(within(ventana).getByLabelText('Categoría'), 'Bebidas')
    await user.click(within(ventana).getByRole('button', { name: 'Agregar grupo de opciones' }))
    await user.type(within(ventana).getByLabelText(OPCIONES), 'Vaso')
    await user.click(within(ventana).getByRole('button', CREAR_PLATO))

    expect(await within(ventana).findByRole('alert')).toHaveTextContent('Cada grupo de opciones necesita un nombre')
    expect(api.llamadas('post', ITEMS)).toHaveLength(0)
  })

  it('sin nombre, precio ni categoría pide cada dato', async () => {
    const { api, user } = abrirMenu()
    const ventana = await abrirNuevoPlato(user)

    await user.click(within(ventana).getByRole('button', CREAR_PLATO))

    expect(await within(ventana).findByText('Escribe el nombre del plato')).toBeInTheDocument()
    expect(within(ventana).getByText('Escribe un valor')).toBeInTheDocument()
    expect(within(ventana).getByText('Elige la categoría')).toBeInTheDocument()
    expect(api.llamadas('post', ITEMS)).toHaveLength(0)
  })
})

describe('editar la carta', () => {
  it('editar un plato parte de sus datos y muestra el error del servidor', async () => {
    const { api, user } = abrirMenu()
    api.on('patch', PLATO_10, new RespuestaDeError(409, 'Ya existe un plato con ese nombre.'))

    await user.click(await screen.findByRole('button', { name: 'Editar Ceviche' }))
    const ventana = await screen.findByRole('dialog', { name: 'Editar Ceviche' })
    expect(within(ventana).getByLabelText(PRECIO)).toHaveValue('30.00')
    await user.click(within(ventana).getByRole('button', { name: 'Guardar' }))

    expect(await within(ventana).findByText('Ya existe un plato con ese nombre.')).toBeInTheDocument()
    expect(api.llamadas('patch', PLATO_10)[0]?.body).toMatchObject({ name: 'Ceviche', price: '30.00' })
  })

  it('sacar un plato de la carta se confirma antes de enviarse', async () => {
    const { api, user } = abrirMenu()
    const fuera = carta()
    fuera.categories[0] = { ...carta().categories[0], items: [plato({ is_active: false }), plato({ id: 11, name: 'Causa' })] }
    api.on('patch', PLATO_10, yLuego(api, plato({ is_active: false }), fuera))

    const fila = (await screen.findByRole('heading', { name: 'Ceviche' })).closest('li') as HTMLElement
    await user.click(within(fila).getByRole('button', { name: 'Desactivar' }))
    const confirmar = await screen.findByRole('alertdialog', { name: '¿Sacar Ceviche de la carta?' })
    expect(api.llamadas('patch', PLATO_10)).toHaveLength(0)
    await user.click(within(confirmar).getByRole('button', { name: 'Desactivar' }))

    expect(api.llamadas('patch', PLATO_10)[0]?.body).toEqual({ is_active: false })
    expect(await screen.findByText('Fuera de la carta')).toBeInTheDocument()
  })

  it('una categoría vacía se puede eliminar; si el servidor se niega, lo explica', async () => {
    const { api, user } = abrirMenu()
    api.once('delete', '/menu/categories/2', new RespuestaDeError(409, 'La categoría tiene platos.'))

    await user.click(await screen.findByRole('button', { name: 'Eliminar la categoría Bebidas' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText('La categoría tiene platos.')).toBeInTheDocument()

    api.on('delete', '/menu/categories/2', null, 204)
    api.on('get', MENU, { categories: [carta().categories[0]] })
    await user.click(screen.getByRole('button', { name: 'Eliminar la categoría Bebidas' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText('Categoría Bebidas eliminada.')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Bebidas' })).not.toBeInTheDocument()
  })

  it('una categoría con platos no se elimina: se desactiva, y eso se confirma', async () => {
    const { api, user } = abrirMenu()
    api.on('patch', CATEGORIA_1, { id: 1, name: 'Entradas', position: 0, is_active: false, created_at: CREADO })

    await screen.findByRole('region', { name: 'Entradas' })
    expect(screen.queryByRole('button', { name: 'Eliminar la categoría Entradas' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Desactivar la categoría Entradas' }))
    await user.click(within(await screen.findByRole('alertdialog', { name: '¿Desactivar Entradas?' })).getByRole('button', { name: 'Desactivar' }))

    expect(api.llamadas('patch', CATEGORIA_1)[0]?.body).toEqual({ is_active: false })
  })

  it('una categoría inactiva se activa con un toque, sin confirmar', async () => {
    const api = servidor().on('get', MENU, { categories: [categoria({ is_active: false })] }).on('get', '/inventory/recipes', [])
    api.on('patch', CATEGORIA_1, { id: 1, name: 'Entradas', position: 0, is_active: true, created_at: CREADO })
    entrarComo()
    const { user } = montar(<MenuView />)

    expect(await screen.findByText('Inactiva')).toBeInTheDocument()
    expect(screen.getByText('Hoy: 0 de 0 platos disponibles')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Activar la categoría Entradas' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(api.llamadas('patch', CATEGORIA_1)[0]?.body).toEqual({ is_active: true })
  })
})
