import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { cliente, ultimoCuerpo } from '#jest/fixtures/pedidos'
import { entrarComo, montar, servidor, sinRespuesta } from '#jest/harness'
import { TakeawayDialog } from './TakeawayDialog'

const ADDRESS = 'Dirección de entrega'
const AREQUIPA = 'Av. Arequipa 500'
const SELECT = { name: 'Elegir platos' }
const RECEIVES = 'Nombre de quien recibe'
const CUSTOMERS = '/customers'
const CURRENT_ROUTE = { name: 'Ruta actual' }
const NAME = 'Nombre del cliente (opcional)'
const SEARCH = 'Buscar cliente frecuente (opcional)'

function open() {
  const api = servidor()
    .on('get', CUSTOMERS, { items: [], total: 0 })
    .on('post', CUSTOMERS, cliente({ id: 55 }))
  entrarComo()
  const mount = montar(<TakeawayDialog />, { path: '/pedidos' })
  return { api, ...mount }
}

async function openWindow(mount: ReturnType<typeof open>) {
  await mount.user.click(screen.getByRole('button', { name: 'Para llevar / Delivery' }))
  return screen.findByRole('dialog', { name: 'Pedido para llevar o delivery' })
}

function destination() {
  return new URL(screen.getByRole('status', CURRENT_ROUTE).textContent, 'http://localhost')
}

beforeEach(() => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
})

afterEach(() => {
  Reflect.deleteProperty(navigator, 'onLine')
})

describe('TakeawayDialog', () => {
  it('para recoger en el local basta con elegir platos; el nombre es opcional', async () => {
    const mount = open()
    const window = await openWindow(mount)
    await mount.user.type(within(window).getByLabelText(NAME), 'Luis')
    await mount.user.click(within(window).getByRole('button', SELECT))

    await screen.findByRole('status', CURRENT_ROUTE)
    expect(destination().pathname).toBe('/pedidos/nuevo')
    expect(Object.fromEntries(destination().searchParams)).toEqual({ tipo: 'llevar', cliente: 'Luis' })
  })

  it('un delivery pide nombre, teléfono y dirección antes de seguir', async () => {
    const mount = open()
    const window = await openWindow(mount)
    await mount.user.click(within(window).getByRole('radio', { name: 'Delivery' }))
    expect(within(window).getByRole('radio', { name: 'Delivery' })).toHaveAttribute('aria-checked', 'true')
    await mount.user.click(within(window).getByRole('button', SELECT))

    expect(await within(window).findByText('Escribe el nombre de quien recibe')).toBeInTheDocument()
    expect(within(window).getByText('Escribe un teléfono para coordinar la entrega')).toBeInTheDocument()
    expect(within(window).getByText('Escribe la dirección de entrega')).toBeInTheDocument()
    expect(mount.api.llamadas('post', CUSTOMERS)).toHaveLength(0)
  })

  it('un delivery a alguien nuevo lo agrega a la libreta y sigue con su id', async () => {
    const mount = open()
    const window = await openWindow(mount)
    await mount.user.click(within(window).getByRole('radio', { name: 'Delivery' }))
    await mount.user.type(within(window).getByLabelText(RECEIVES), 'Ana')
    await mount.user.type(within(window).getByLabelText('Teléfono'), '912345678')
    await mount.user.type(within(window).getByLabelText(ADDRESS), AREQUIPA)
    await mount.user.click(within(window).getByRole('checkbox', { name: /Ley N\.º 29733/u }))
    await mount.user.click(within(window).getByRole('button', SELECT))

    await screen.findByRole('status', CURRENT_ROUTE)
    expect(ultimoCuerpo(mount.api.llamadas('post', CUSTOMERS))).toMatchObject({ name: 'Ana', phone: '912345678', consent: true })
    expect(destination().searchParams.get('clienteId')).toBe('55')
    expect(destination().searchParams.get('direccion')).toBe(AREQUIPA)
  })

  it('sin el consentimiento del cliente, el delivery sale igual pero no queda en la libreta', async () => {
    const mount = open()
    const window = await openWindow(mount)
    await mount.user.click(within(window).getByRole('radio', { name: 'Delivery' }))
    await mount.user.type(within(window).getByLabelText(RECEIVES), 'Ana')
    await mount.user.type(within(window).getByLabelText('Teléfono'), '912345678')
    await mount.user.type(within(window).getByLabelText(ADDRESS), AREQUIPA)
    await mount.user.click(within(window).getByRole('button', SELECT))

    await screen.findByRole('status', CURRENT_ROUTE)
    expect(mount.api.llamadas('post', CUSTOMERS)).toHaveLength(0)
    expect(destination().searchParams.get('clienteId')).toBeNull()
    expect(destination().searchParams.get('telefono')).toBe('912345678')
  })

  it('elegir un cliente frecuente llena sus datos', async () => {
    const mount = open()
    mount.api.on('get', CUSTOMERS, { items: [cliente()], total: 1 })
    const window = await openWindow(mount)
    await mount.user.click(within(window).getByRole('radio', { name: 'Delivery' }))
    await mount.user.type(within(window).getByLabelText(SEARCH), 'Rosa')
    await mount.user.click(await within(window).findByRole('button', { name: /Rosa Quispe/u }))

    expect(within(window).getByLabelText(RECEIVES)).toHaveValue('Rosa Quispe')
    expect(within(window).getByLabelText(ADDRESS)).toHaveValue('Jr. Cusco 120')
    expect(mount.api.llamadas('get', CUSTOMERS).at(-1)?.params).toMatchObject({ q: 'Rosa' })
  })

  it('la búsqueda espera tres letras y avisa si el cliente no está', async () => {
    const mount = open()
    const window = await openWindow(mount)
    const search = within(window).getByLabelText(SEARCH)
    await mount.user.type(search, 'Ro')
    expect(mount.api.llamadas('get', CUSTOMERS)).toHaveLength(0)
    await mount.user.type(search, 'x')
    expect(await within(window).findByText('No está en la libreta: escribe sus datos abajo.')).toBeInTheDocument()
  })

  it('cancelar cierra la ventana y la siguiente vez empieza vacía', async () => {
    const mount = open()
    mount.api.on('get', CUSTOMERS, sinRespuesta)
    let window = await openWindow(mount)
    await mount.user.type(within(window).getByLabelText(NAME), 'Luis')
    await mount.user.click(within(window).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    window = await openWindow(mount)
    expect(within(window).getByLabelText(NAME)).toHaveValue('')
  })
})
