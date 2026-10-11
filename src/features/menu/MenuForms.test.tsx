import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { handleMenu, category, dish } from '#jest/fixtures/inventario'
import { signInAs, handleMount, handleFirst, ErrorResponse, server } from '#jest/harness'
import type { MenuResponse } from '@/api/types'
import { MenuView } from './MenuView'

const MENU = '/menu'
const ITEMS = '/menu/items'
const NAME = 'Nombre'
const OPTIONS = /Una opción por línea/u
const CREATED = '2026-09-26T13:00:00Z'
const PRICE = 'Precio (S/)'
const CREATE_DISH = { name: 'Crear plato' }
const DISH_10 = '/menu/items/10'
const CATEGORY_1 = '/menu/categories/1'

function openMenu() {
  const api = server().on('get', MENU, handleMenu()).on('get', '/inventory/recipes', [])
  signInAs()
  return { api, ...handleMount(<MenuView />, { path: '/menu' }) }
}

// Como el servidor: después del cambio, la carta que se relee ya lo trae.
function andThen(api: ReturnType<typeof openMenu>['api'], response: unknown, after: MenuResponse) {
  return () => {
    api.on('get', MENU, after)
    return response
  }
}

function withCategory(extra: MenuResponse['categories'][number]): MenuResponse {
  return { categories: [...handleMenu().categories, extra] }
}

async function openNewDish(user: ReturnType<typeof openMenu>['user']) {
  await user.click(await screen.findByRole('button', { name: 'Nuevo plato' }))
  return screen.findByRole('dialog', { name: 'Nuevo plato' })
}

describe('crear en la carta', () => {
  it('una categoría nueva aparece al final, sin platos', async () => {
    const { api, user } = openMenu()
    const desserts = { id: 3, name: 'Postres', position: 2, is_active: true, created_at: CREATED }
    api.on('post', '/menu/categories', andThen(api, desserts, withCategory({ ...desserts, items: [] })))

    await user.click(await screen.findByRole('button', { name: 'Nueva categoría' }))
    const window = await screen.findByRole('dialog', { name: 'Nueva categoría' })
    await user.type(within(window).getByLabelText(NAME), 'Postres')
    await user.click(within(window).getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByRole('region', { name: 'Postres' })).toBeInTheDocument()
    expect(api.llamadas('post', '/menu/categories')[0]?.body).toEqual({ name: 'Postres' })
  })

  it('un plato con opciones viaja con el precio con punto y sus grupos', async () => {
    const { api, user } = openMenu()
    const chicha = dish({ id: 12, name: 'Chicha', category_id: 2, price: '6.50' })
    const after = handleMenu()
    after.categories[1]?.items.push(chicha)
    api.on('post', ITEMS, andThen(api, chicha, after))
    const window = await openNewDish(user)

    await user.type(within(window).getByLabelText(NAME), 'Chicha')
    await user.type(within(window).getByLabelText(PRICE), '6,5')
    await user.selectOptions(within(window).getByLabelText('Categoría'), 'Bebidas')
    await user.click(within(window).getByRole('button', { name: 'Agregar grupo de opciones' }))
    await user.type(within(window).getByLabelText('Grupo'), 'Tamaño')
    await user.click(within(window).getByRole('checkbox'))
    await user.type(within(window).getByLabelText(OPTIONS), 'Vaso{Enter}Jarra = 12,50')
    await user.click(within(window).getByRole('button', CREATE_DISH))

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
    const { api, user } = openMenu()
    const window = await openNewDish(user)

    await user.type(within(window).getByLabelText(NAME), 'Chicha')
    await user.type(within(window).getByLabelText(PRICE), '6')
    await user.selectOptions(within(window).getByLabelText('Categoría'), 'Bebidas')
    await user.click(within(window).getByRole('button', { name: 'Agregar grupo de opciones' }))
    await user.type(within(window).getByLabelText(OPTIONS), 'Vaso')
    await user.click(within(window).getByRole('button', CREATE_DISH))

    expect(await within(window).findByRole('alert')).toHaveTextContent('Cada grupo de opciones necesita un nombre')
    expect(api.llamadas('post', ITEMS)).toHaveLength(0)
  })

  it('sin nombre, precio ni categoría pide cada dato', async () => {
    const { api, user } = openMenu()
    const window = await openNewDish(user)

    await user.click(within(window).getByRole('button', CREATE_DISH))

    expect(await within(window).findByText('Escribe el nombre del plato')).toBeInTheDocument()
    expect(within(window).getByText('Escribe un valor')).toBeInTheDocument()
    expect(within(window).getByText('Elige la categoría')).toBeInTheDocument()
    expect(api.llamadas('post', ITEMS)).toHaveLength(0)
  })
})

describe('editar la carta', () => {
  it('editar un plato parte de sus datos y muestra el error del servidor', async () => {
    const { api, user } = openMenu()
    api.on('patch', DISH_10, new ErrorResponse(409, 'Ya existe un plato con ese nombre.'))

    await user.click(await screen.findByRole('button', { name: 'Editar Ceviche' }))
    const window = await screen.findByRole('dialog', { name: 'Editar Ceviche' })
    expect(within(window).getByLabelText(PRICE)).toHaveValue('30.00')
    await user.click(within(window).getByRole('button', { name: 'Guardar' }))

    expect(await within(window).findByText('Ya existe un plato con ese nombre.')).toBeInTheDocument()
    expect(api.llamadas('patch', DISH_10)[0]?.body).toMatchObject({ name: 'Ceviche', price: '30.00' })
  })

  it('sacar un plato de la carta se confirma antes de enviarse', async () => {
    const { api, user } = openMenu()
    const outside = handleMenu()
    outside.categories[0] = { ...handleFirst(handleMenu().categories), items: [dish({ is_active: false }), dish({ id: 11, name: 'Causa' })] }
    api.on('patch', DISH_10, andThen(api, dish({ is_active: false }), outside))

    const row = (await screen.findByRole('heading', { name: 'Ceviche' })).closest('li') as HTMLElement
    await user.click(within(row).getByRole('button', { name: 'Desactivar' }))
    const confirm = await screen.findByRole('alertdialog', { name: '¿Sacar Ceviche de la carta?' })
    expect(api.llamadas('patch', DISH_10)).toHaveLength(0)
    await user.click(within(confirm).getByRole('button', { name: 'Desactivar' }))

    expect(api.llamadas('patch', DISH_10)[0]?.body).toEqual({ is_active: false })
    expect(await screen.findByText('Fuera de la carta')).toBeInTheDocument()
  })

  it('una categoría vacía se puede eliminar; si el servidor se niega, lo explica', async () => {
    const { api, user } = openMenu()
    api.once('delete', '/menu/categories/2', new ErrorResponse(409, 'La categoría tiene platos.'))

    await user.click(await screen.findByRole('button', { name: 'Eliminar la categoría Bebidas' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText('La categoría tiene platos.')).toBeInTheDocument()

    api.on('delete', '/menu/categories/2', null, 204)
    api.on('get', MENU, { categories: [handleMenu().categories[0]] })
    await user.click(screen.getByRole('button', { name: 'Eliminar la categoría Bebidas' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText('Categoría Bebidas eliminada.')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Bebidas' })).not.toBeInTheDocument()
  })

  it('una categoría con platos no se elimina: se desactiva, y eso se confirma', async () => {
    const { api, user } = openMenu()
    api.on('patch', CATEGORY_1, { id: 1, name: 'Entradas', position: 0, is_active: false, created_at: CREATED })

    await screen.findByRole('region', { name: 'Entradas' })
    expect(screen.queryByRole('button', { name: 'Eliminar la categoría Entradas' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Desactivar la categoría Entradas' }))
    await user.click(within(await screen.findByRole('alertdialog', { name: '¿Desactivar Entradas?' })).getByRole('button', { name: 'Desactivar' }))

    expect(api.llamadas('patch', CATEGORY_1)[0]?.body).toEqual({ is_active: false })
  })

  it('una categoría inactiva se activa con un toque, sin confirmar', async () => {
    const api = server().on('get', MENU, { categories: [category({ is_active: false })] }).on('get', '/inventory/recipes', [])
    api.on('patch', CATEGORY_1, { id: 1, name: 'Entradas', position: 0, is_active: true, created_at: CREATED })
    signInAs()
    const { user } = handleMount(<MenuView />)

    expect(await screen.findByText('Inactiva')).toBeInTheDocument()
    expect(screen.getByText('Hoy: 0 de 0 platos disponibles')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Activar la categoría Entradas' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(api.llamadas('patch', CATEGORY_1)[0]?.body).toEqual({ is_active: true })
  })
})
