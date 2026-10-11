import { describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { customer } from '#jest/fixtures/panel'
import { signInAs, mountScreen, PERMISSIONS_WAITER, ErrorResponse, server } from '#jest/harness'
import type { Customer } from '@/api/types'
import { CustomersView } from './CustomersView'

const LIST = '/customers'
const SEARCH = 'Buscar por nombre o teléfono'
const NAME = 'Nombre'
const ROSA = '/customers/11'
const NEW = 'Nuevo cliente'
const ROSA_QUISPE = 'Rosa Quispe'
const EDITED = 'Rosa Q. Mamani'

function open(customers: Customer[] = [customer()], permissions?: Parameters<typeof signInAs>[0]) {
  const api = server().on('get', LIST, (request: { params: Record<string, unknown> }) => {
    const q = String(request.params['q']).toLowerCase()
    const items = customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
    return { items, total: items.length }
  })
  signInAs(permissions)
  return { api, ...mountScreen(<CustomersView />) }
}

describe('CustomersView: lista', () => {
  it('muestra cuántos hay, sus visitas y quién es frecuente', async () => {
    open([customer(), customer({ id: 12, name: 'Juan Pérez', phone: '', visits: 1, spent: '35.00', is_frequent: false })])
    expect(await screen.findByRole('heading', { name: '2 clientes' })).toBeInTheDocument()
    expect(screen.getByText('4 visitas · S/ 240.00')).toBeInTheDocument()
    expect(screen.getByText('1 visita · S/ 35.00')).toBeInTheDocument()
    expect(screen.getByText('Sin teléfono')).toBeInTheDocument()
    expect(screen.getAllByText('Frecuente')).toHaveLength(1)
  })

  it('busca por teléfono y avisa cuando nadie coincide', async () => {
    const { api, user } = open([customer()])
    await screen.findByText(ROSA_QUISPE)

    await user.type(screen.getByLabelText(SEARCH), '999')

    expect(await screen.findByText('Nadie coincide con la búsqueda')).toBeInTheDocument()
    expect(api.calls('get', LIST).at(-1)?.params).toEqual({ q: '999', limit: 50 })
  })

  it('sin clientes todavía lo dice', async () => {
    open([])
    expect(await screen.findByText('Todavía no hay clientes')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '0 clientes' })).toBeInTheDocument()
  })

  it('si la búsqueda falla muestra el error', async () => {
    server().on('get', LIST, new ErrorResponse(500, 'Sin base'))
    signInAs()
    mountScreen(<CustomersView />)
    expect(await screen.findByText('Sin base')).toBeInTheDocument()
  })
})

describe('CustomersView: ficha y edición', () => {
  it('la ficha muestra cifras, dirección, notas y los últimos pedidos', async () => {
    const detail = customer({
      notes: 'Alérgica al maní',
      email: 'rosa@correo.pe',
      recent_orders: [{ order_id: 40, number: 17, type: 'Delivery', status: 'paid', total: '58.00', created_at: '2026-09-20T19:00:00Z' }],
    })
    const { api, user } = open()
    api.on('get', ROSA, detail)

    await user.click(await screen.findByRole('button', { name: /Rosa Quispe/u }))

    const card = await screen.findByRole('dialog', { name: ROSA_QUISPE })
    expect(await within(card).findByText('987654321 · rosa@correo.pe')).toBeInTheDocument()
    expect(within(card).getByText('Jr. Unión 450 · Ref.: Frente al parque')).toBeInTheDocument()
    expect(within(card).getByText('Alérgica al maní')).toBeInTheDocument()
    expect(within(card).getByText('Cliente frecuente')).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: /#17 · Delivery/u })).toHaveAttribute('href', '/pedidos/40')
  })

  it('el mesero ve la ficha pero no puede editar ni crear', async () => {
    const { api, user } = open([customer()], PERMISSIONS_WAITER)
    api.on('get', ROSA, customer({ phone: '', recent_orders: [] }))
    expect(screen.queryByRole('button', { name: NEW })).not.toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: /Rosa Quispe/u }))

    const card = await screen.findByRole('dialog')
    expect(await within(card).findByText('Todavía no pidió.')).toBeInTheDocument()
    expect(within(card).getByText('Sin datos de contacto')).toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: 'Editar datos' })).not.toBeInTheDocument()
  })

  it('el encargado edita desde la ficha y guarda con PUT', async () => {
    const { api, user } = open()
    api.on('get', ROSA, customer()).on('put', ROSA, customer({ name: EDITED }))

    await user.click(await screen.findByRole('button', { name: /Rosa Quispe/u }))
    await user.click(await screen.findByRole('button', { name: 'Editar datos' }))
    const window = await screen.findByRole('dialog', { name: 'Editar a Rosa Quispe' })
    await user.clear(within(window).getByLabelText(NAME))
    await user.type(within(window).getByLabelText(NAME), EDITED)
    await user.click(within(window).getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText(`${EDITED}: datos guardados.`)).toBeInTheDocument()
    expect(api.calls('put', ROSA)[0]?.body).toMatchObject({ name: EDITED, phone: '987654321' })
  })

  it('un cliente nuevo exige nombre, valida el correo y muestra el rechazo del servidor', async () => {
    const { api, user } = open()
    api.on('post', LIST, new ErrorResponse(409, 'Ya hay un cliente con ese teléfono'))

    await user.click(screen.getByRole('button', { name: NEW }))
    const window = await screen.findByRole('dialog', { name: NEW })
    await user.type(within(window).getByLabelText('Correo (opcional)'), 'no-es-correo')
    await user.click(within(window).getByRole('button', { name: 'Guardar' }))
    expect(await within(window).findByText('Escribe el nombre')).toBeInTheDocument()
    expect(within(window).getByText('Escribe un correo válido')).toBeInTheDocument()
    expect(within(window).getByText('Sin su consentimiento no se puede guardar al cliente en la libreta.')).toBeInTheDocument()

    await user.type(within(window).getByLabelText(NAME), 'Pedro')
    await user.clear(within(window).getByLabelText('Correo (opcional)'))
    await user.click(within(window).getByRole('checkbox', { name: /Ley N\.º 29733/u }))
    await user.click(within(window).getByRole('button', { name: 'Guardar' }))

    expect(await within(window).findByText('Ya hay un cliente con ese teléfono')).toBeInTheDocument()
    expect(api.calls('post', LIST)[0]?.body).toEqual({ name: 'Pedro', phone: '', email: '', address: '', reference: '', notes: '', consent: true })
  })

  it('la etiqueta del consentimiento nombra también el <input> oculto de la casilla (WAVE)', async () => {
    const { user } = open()

    await user.click(screen.getByRole('button', { name: NEW }))
    const window = await screen.findByRole('dialog', { name: NEW })
    const checkbox = within(window).getByRole('checkbox', { name: /Ley N\.º 29733/u })
    // Dentro de un formulario, Radix agrega un <input> oculto junto a su botón.
    const label = within(window).getByTestId('consent-label')

    expect(within(label).getAllByRole('checkbox', { hidden: true })).toHaveLength(2)
    expect(within(label).getByRole('checkbox', { name: /Ley N\.º 29733/u })).toBe(checkbox)
  })
})

describe('CustomersView: derechos ARCO', () => {
  const DELETE_DATA = 'Borrar sus datos'
  const EXPORT = '/customers/11/export'
  const DELETE = '/customers/11/anonymize'

  it('el encargado descarga los datos del cliente', async () => {
    const { api, user } = open()
    api.on('get', ROSA, customer())
    api.on('get', EXPORT, { name: ROSA_QUISPE, orders: [], reservations: [] })
    const create = jest.fn(() => 'blob:datos')
    const drop = jest.fn()
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: drop })

    await user.click(await screen.findByRole('button', { name: /Rosa Quispe/u }))
    const card = await screen.findByRole('dialog', { name: ROSA_QUISPE })
    await user.click(within(card).getByRole('button', { name: 'Descargar sus datos' }))

    await waitFor(() => {
      expect(drop).toHaveBeenCalledWith('blob:datos')
    })
    expect(api.calls('get', EXPORT)).toHaveLength(1)
  })

  it('borrar pide confirmación, cierra la ficha y lo avisa', async () => {
    const { api, user } = open()
    api.on('get', ROSA, customer())
    api.on('post', DELETE, null)

    await user.click(await screen.findByRole('button', { name: /Rosa Quispe/u }))
    const card = await screen.findByRole('dialog', { name: ROSA_QUISPE })
    await user.click(within(card).getByRole('button', { name: DELETE_DATA }))
    const confirm = await screen.findByRole('alertdialog', { name: '¿Borrar los datos de Rosa Quispe?' })
    expect(api.calls('post', DELETE)).toHaveLength(0)
    await user.click(within(confirm).getByRole('button', { name: DELETE_DATA }))

    expect(await screen.findByText('Los datos del cliente se borraron.')).toBeInTheDocument()
    expect(api.calls('post', DELETE)).toHaveLength(1)
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: ROSA_QUISPE })).not.toBeInTheDocument()
    })
  })

  it('con pedidos en curso, el servidor lo rechaza y la ficha lo dice', async () => {
    const { api, user } = open()
    api.on('get', ROSA, customer())
    api.on('post', DELETE, new ErrorResponse(409, 'El cliente tiene pedidos en curso.'))

    await user.click(await screen.findByRole('button', { name: /Rosa Quispe/u }))
    const card = await screen.findByRole('dialog', { name: ROSA_QUISPE })
    await user.click(within(card).getByRole('button', { name: DELETE_DATA }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: DELETE_DATA }))

    expect(await within(card).findByText('El cliente tiene pedidos en curso.')).toBeInTheDocument()
  })

  it('el mesero no ve cómo exportar ni borrar', async () => {
    const { api, user } = open([customer()], PERMISSIONS_WAITER)
    api.on('get', ROSA, customer())

    await user.click(await screen.findByRole('button', { name: /Rosa Quispe/u }))
    const card = await screen.findByRole('dialog')
    await within(card).findByText(ROSA_QUISPE)
    expect(within(card).queryByRole('button', { name: DELETE_DATA })).not.toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: 'Descargar sus datos' })).not.toBeInTheDocument()
  })
})
