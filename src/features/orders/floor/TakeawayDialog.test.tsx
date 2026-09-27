import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { cliente, ultimoCuerpo } from '#jest/fixtures/pedidos'
import { entrarComo, montar, servidor, sinRespuesta } from '#jest/harness'
import TakeawayDialog from './TakeawayDialog'

const ELEGIR = { name: 'Elegir platos' }
const RECIBE = 'Nombre de quien recibe'
const CLIENTES = '/customers'
const RUTA_ACTUAL = { name: 'Ruta actual' }
const NOMBRE = 'Nombre del cliente (opcional)'
const BUSCAR = 'Buscar cliente frecuente (opcional)'

function abrir() {
  const api = servidor()
    .on('get', CLIENTES, { items: [], total: 0 })
    .on('post', CLIENTES, cliente({ id: 55 }))
  entrarComo()
  const montaje = montar(<TakeawayDialog />, { path: '/pedidos' })
  return { api, ...montaje }
}

async function abrirVentana(montaje: ReturnType<typeof abrir>) {
  await montaje.user.click(screen.getByRole('button', { name: 'Para llevar / Delivery' }))
  return screen.findByRole('dialog', { name: 'Pedido para llevar o delivery' })
}

function destino() {
  return new URL(screen.getByRole('status', RUTA_ACTUAL).textContent, 'http://localhost')
}

beforeEach(() => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
})

afterEach(() => {
  Reflect.deleteProperty(navigator, 'onLine')
})

describe('TakeawayDialog', () => {
  it('para recoger en el local basta con elegir platos; el nombre es opcional', async () => {
    const montaje = abrir()
    const ventana = await abrirVentana(montaje)
    await montaje.user.type(within(ventana).getByLabelText(NOMBRE), 'Luis')
    await montaje.user.click(within(ventana).getByRole('button', ELEGIR))

    await screen.findByRole('status', RUTA_ACTUAL)
    expect(destino().pathname).toBe('/pedidos/nuevo')
    expect(Object.fromEntries(destino().searchParams)).toEqual({ tipo: 'llevar', cliente: 'Luis' })
  })

  it('un delivery pide nombre, teléfono y dirección antes de seguir', async () => {
    const montaje = abrir()
    const ventana = await abrirVentana(montaje)
    await montaje.user.click(within(ventana).getByRole('radio', { name: 'Delivery' }))
    expect(within(ventana).getByRole('radio', { name: 'Delivery' })).toHaveAttribute('aria-checked', 'true')
    await montaje.user.click(within(ventana).getByRole('button', ELEGIR))

    expect(await within(ventana).findByText('Escribe el nombre de quien recibe')).toBeInTheDocument()
    expect(within(ventana).getByText('Escribe un teléfono para coordinar la entrega')).toBeInTheDocument()
    expect(within(ventana).getByText('Escribe la dirección de entrega')).toBeInTheDocument()
    expect(montaje.api.llamadas('post', CLIENTES)).toHaveLength(0)
  })

  it('un delivery a alguien nuevo lo agrega a la libreta y sigue con su id', async () => {
    const montaje = abrir()
    const ventana = await abrirVentana(montaje)
    await montaje.user.click(within(ventana).getByRole('radio', { name: 'Delivery' }))
    await montaje.user.type(within(ventana).getByLabelText(RECIBE), 'Ana')
    await montaje.user.type(within(ventana).getByLabelText('Teléfono'), '912345678')
    await montaje.user.type(within(ventana).getByLabelText('Dirección de entrega'), 'Av. Arequipa 500')
    await montaje.user.click(within(ventana).getByRole('button', ELEGIR))

    await screen.findByRole('status', RUTA_ACTUAL)
    expect(ultimoCuerpo(montaje.api.llamadas('post', CLIENTES))).toMatchObject({ name: 'Ana', phone: '912345678' })
    expect(destino().searchParams.get('clienteId')).toBe('55')
    expect(destino().searchParams.get('direccion')).toBe('Av. Arequipa 500')
  })

  it('elegir un cliente frecuente llena sus datos', async () => {
    const montaje = abrir()
    montaje.api.on('get', CLIENTES, { items: [cliente()], total: 1 })
    const ventana = await abrirVentana(montaje)
    await montaje.user.click(within(ventana).getByRole('radio', { name: 'Delivery' }))
    await montaje.user.type(within(ventana).getByLabelText(BUSCAR), 'Rosa')
    await montaje.user.click(await within(ventana).findByRole('button', { name: /Rosa Quispe/u }))

    expect(within(ventana).getByLabelText(RECIBE)).toHaveValue('Rosa Quispe')
    expect(within(ventana).getByLabelText('Dirección de entrega')).toHaveValue('Jr. Cusco 120')
    expect(montaje.api.llamadas('get', CLIENTES).at(-1)?.params).toMatchObject({ q: 'Rosa' })
  })

  it('la búsqueda espera tres letras y avisa si el cliente no está', async () => {
    const montaje = abrir()
    const ventana = await abrirVentana(montaje)
    const buscar = within(ventana).getByLabelText(BUSCAR)
    await montaje.user.type(buscar, 'Ro')
    expect(montaje.api.llamadas('get', CLIENTES)).toHaveLength(0)
    await montaje.user.type(buscar, 'x')
    expect(await within(ventana).findByText('No está en la libreta: escribe sus datos abajo.')).toBeInTheDocument()
  })

  it('cancelar cierra la ventana y la siguiente vez empieza vacía', async () => {
    const montaje = abrir()
    montaje.api.on('get', CLIENTES, sinRespuesta)
    let ventana = await abrirVentana(montaje)
    await montaje.user.type(within(ventana).getByLabelText(NOMBRE), 'Luis')
    await montaje.user.click(within(ventana).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    ventana = await abrirVentana(montaje)
    expect(within(ventana).getByLabelText(NOMBRE)).toHaveValue('')
  })
})
