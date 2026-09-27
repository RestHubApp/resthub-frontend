import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { cliente } from '#jest/fixtures/panel'
import { entrarComo, montar, PERMISOS_MESERO, RespuestaDeError, servidor } from '#jest/harness'
import type { Customer } from '../../api/types'
import CustomersView from './CustomersView'

const LISTA = '/customers'
const BUSCAR = 'Buscar por nombre o teléfono'
const NOMBRE = 'Nombre'
const ROSA = '/customers/11'
const NUEVO = 'Nuevo cliente'
const EDITADA = 'Rosa Q. Mamani'

function abrir(clientes: Customer[] = [cliente()], permisos?: Parameters<typeof entrarComo>[0]) {
  const api = servidor().on('get', LISTA, (peticion: { params: Record<string, unknown> }) => {
    const q = String(peticion.params.q).toLowerCase()
    const items = clientes.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
    return { items, total: items.length }
  })
  entrarComo(permisos)
  return { api, ...montar(<CustomersView />) }
}

describe('CustomersView: lista', () => {
  it('muestra cuántos hay, sus visitas y quién es frecuente', async () => {
    abrir([cliente(), cliente({ id: 12, name: 'Juan Pérez', phone: '', visits: 1, spent: '35.00', is_frequent: false })])
    expect(await screen.findByRole('heading', { name: '2 clientes' })).toBeInTheDocument()
    expect(screen.getByText('4 visitas · S/ 240.00')).toBeInTheDocument()
    expect(screen.getByText('1 visita · S/ 35.00')).toBeInTheDocument()
    expect(screen.getByText('Sin teléfono')).toBeInTheDocument()
    expect(screen.getAllByText('Frecuente')).toHaveLength(1)
  })

  it('busca por teléfono y avisa cuando nadie coincide', async () => {
    const { api, user } = abrir([cliente()])
    await screen.findByText('Rosa Quispe')

    await user.type(screen.getByLabelText(BUSCAR), '999')

    expect(await screen.findByText('Nadie coincide con la búsqueda')).toBeInTheDocument()
    expect(api.llamadas('get', LISTA).at(-1)?.params).toEqual({ q: '999', limit: 50 })
  })

  it('sin clientes todavía lo dice', async () => {
    abrir([])
    expect(await screen.findByText('Todavía no hay clientes')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '0 clientes' })).toBeInTheDocument()
  })

  it('si la búsqueda falla muestra el error', async () => {
    servidor().on('get', LISTA, new RespuestaDeError(500, 'Sin base'))
    entrarComo()
    montar(<CustomersView />)
    expect(await screen.findByText('Sin base')).toBeInTheDocument()
  })
})

describe('CustomersView: ficha y edición', () => {
  it('la ficha muestra cifras, dirección, notas y los últimos pedidos', async () => {
    const detalle = cliente({
      notes: 'Alérgica al maní',
      email: 'rosa@correo.pe',
      recent_orders: [{ order_id: 40, number: 17, type: 'Delivery', status: 'paid', total: '58.00', created_at: '2026-09-20T19:00:00Z' }],
    })
    const { api, user } = abrir()
    api.on('get', ROSA, detalle)

    await user.click(await screen.findByRole('button', { name: /Rosa Quispe/u }))

    const ficha = await screen.findByRole('dialog', { name: 'Rosa Quispe' })
    expect(await within(ficha).findByText('987654321 · rosa@correo.pe')).toBeInTheDocument()
    expect(within(ficha).getByText('Jr. Unión 450 · Ref.: Frente al parque')).toBeInTheDocument()
    expect(within(ficha).getByText('Alérgica al maní')).toBeInTheDocument()
    expect(within(ficha).getByText('Cliente frecuente')).toBeInTheDocument()
    expect(within(ficha).getByRole('link', { name: /#17 · Delivery/u })).toHaveAttribute('href', '/pedidos/40')
  })

  it('el mesero ve la ficha pero no puede editar ni crear', async () => {
    const { api, user } = abrir([cliente()], PERMISOS_MESERO)
    api.on('get', ROSA, cliente({ phone: '', recent_orders: [] }))
    expect(screen.queryByRole('button', { name: NUEVO })).not.toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: /Rosa Quispe/u }))

    const ficha = await screen.findByRole('dialog')
    expect(await within(ficha).findByText('Todavía no pidió.')).toBeInTheDocument()
    expect(within(ficha).getByText('Sin datos de contacto')).toBeInTheDocument()
    expect(within(ficha).queryByRole('button', { name: 'Editar datos' })).not.toBeInTheDocument()
  })

  it('el encargado edita desde la ficha y guarda con PUT', async () => {
    const { api, user } = abrir()
    api.on('get', ROSA, cliente()).on('put', ROSA, cliente({ name: EDITADA }))

    await user.click(await screen.findByRole('button', { name: /Rosa Quispe/u }))
    await user.click(await screen.findByRole('button', { name: 'Editar datos' }))
    const ventana = await screen.findByRole('dialog', { name: 'Editar a Rosa Quispe' })
    await user.clear(within(ventana).getByLabelText(NOMBRE))
    await user.type(within(ventana).getByLabelText(NOMBRE), EDITADA)
    await user.click(within(ventana).getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText(`${EDITADA}: datos guardados.`)).toBeInTheDocument()
    expect(api.llamadas('put', ROSA)[0]?.body).toMatchObject({ name: EDITADA, phone: '987654321' })
  })

  it('un cliente nuevo exige nombre, valida el correo y muestra el rechazo del servidor', async () => {
    const { api, user } = abrir()
    api.on('post', LISTA, new RespuestaDeError(409, 'Ya hay un cliente con ese teléfono'))

    await user.click(screen.getByRole('button', { name: NUEVO }))
    const ventana = await screen.findByRole('dialog', { name: NUEVO })
    await user.type(within(ventana).getByLabelText('Correo (opcional)'), 'no-es-correo')
    await user.click(within(ventana).getByRole('button', { name: 'Guardar' }))
    expect(await within(ventana).findByText('Escribe el nombre')).toBeInTheDocument()
    expect(within(ventana).getByText('Escribe un correo válido')).toBeInTheDocument()

    await user.type(within(ventana).getByLabelText(NOMBRE), 'Pedro')
    await user.clear(within(ventana).getByLabelText('Correo (opcional)'))
    await user.click(within(ventana).getByRole('button', { name: 'Guardar' }))

    expect(await within(ventana).findByText('Ya hay un cliente con ese teléfono')).toBeInTheDocument()
    expect(api.llamadas('post', LISTA)[0]?.body).toEqual({ name: 'Pedro', phone: '', email: '', address: '', reference: '', notes: '' })
  })
})
