import { describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { cliente } from '#jest/fixtures/panel'
import { entrarComo, montar, PERMISOS_MESERO, RespuestaDeError, servidor } from '#jest/harness'
import type { Customer } from '../../api/types'
import CustomersView from './CustomersView'

const LISTA = '/customers'
const BUSCAR = 'Buscar por nombre o teléfono'
const NOMBRE = 'Nombre'
const ROSA = '/customers/11'
const NUEVO = 'Nuevo cliente'
const ROSA_QUISPE = 'Rosa Quispe'
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
    await screen.findByText(ROSA_QUISPE)

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

    const ficha = await screen.findByRole('dialog', { name: ROSA_QUISPE })
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
    expect(within(ventana).getByText('Sin su consentimiento no se puede guardar al cliente en la libreta.')).toBeInTheDocument()

    await user.type(within(ventana).getByLabelText(NOMBRE), 'Pedro')
    await user.clear(within(ventana).getByLabelText('Correo (opcional)'))
    await user.click(within(ventana).getByRole('checkbox', { name: /Ley N\.º 29733/u }))
    await user.click(within(ventana).getByRole('button', { name: 'Guardar' }))

    expect(await within(ventana).findByText('Ya hay un cliente con ese teléfono')).toBeInTheDocument()
    expect(api.llamadas('post', LISTA)[0]?.body).toEqual({ name: 'Pedro', phone: '', email: '', address: '', reference: '', notes: '', consent: true })
  })
})

describe('CustomersView: derechos ARCO', () => {
  const BORRAR_DATOS = 'Borrar sus datos'
  const EXPORTAR = '/customers/11/export'
  const BORRAR = '/customers/11/anonymize'

  it('el encargado descarga los datos del cliente', async () => {
    const { api, user } = abrir()
    api.on('get', ROSA, cliente())
    api.on('get', EXPORTAR, { name: ROSA_QUISPE, orders: [], reservations: [] })
    const crear = jest.fn(() => 'blob:datos')
    const soltar = jest.fn()
    Object.assign(URL, { createObjectURL: crear, revokeObjectURL: soltar })

    await user.click(await screen.findByRole('button', { name: /Rosa Quispe/u }))
    const ficha = await screen.findByRole('dialog', { name: ROSA_QUISPE })
    await user.click(within(ficha).getByRole('button', { name: 'Descargar sus datos' }))

    await waitFor(() => {
      expect(soltar).toHaveBeenCalledWith('blob:datos')
    })
    expect(api.llamadas('get', EXPORTAR)).toHaveLength(1)
  })

  it('borrar pide confirmación, cierra la ficha y lo avisa', async () => {
    const { api, user } = abrir()
    api.on('get', ROSA, cliente())
    api.on('post', BORRAR, null)

    await user.click(await screen.findByRole('button', { name: /Rosa Quispe/u }))
    const ficha = await screen.findByRole('dialog', { name: ROSA_QUISPE })
    await user.click(within(ficha).getByRole('button', { name: BORRAR_DATOS }))
    const confirmar = await screen.findByRole('alertdialog', { name: '¿Borrar los datos de Rosa Quispe?' })
    expect(api.llamadas('post', BORRAR)).toHaveLength(0)
    await user.click(within(confirmar).getByRole('button', { name: BORRAR_DATOS }))

    expect(await screen.findByText('Los datos del cliente se borraron.')).toBeInTheDocument()
    expect(api.llamadas('post', BORRAR)).toHaveLength(1)
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: ROSA_QUISPE })).not.toBeInTheDocument()
    })
  })

  it('con pedidos en curso, el servidor lo rechaza y la ficha lo dice', async () => {
    const { api, user } = abrir()
    api.on('get', ROSA, cliente())
    api.on('post', BORRAR, new RespuestaDeError(409, 'El cliente tiene pedidos en curso.'))

    await user.click(await screen.findByRole('button', { name: /Rosa Quispe/u }))
    const ficha = await screen.findByRole('dialog', { name: ROSA_QUISPE })
    await user.click(within(ficha).getByRole('button', { name: BORRAR_DATOS }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: BORRAR_DATOS }))

    expect(await within(ficha).findByText('El cliente tiene pedidos en curso.')).toBeInTheDocument()
  })

  it('el mesero no ve cómo exportar ni borrar', async () => {
    const { api, user } = abrir([cliente()], PERMISOS_MESERO)
    api.on('get', ROSA, cliente())

    await user.click(await screen.findByRole('button', { name: /Rosa Quispe/u }))
    const ficha = await screen.findByRole('dialog')
    await within(ficha).findByText(ROSA_QUISPE)
    expect(within(ficha).queryByRole('button', { name: BORRAR_DATOS })).not.toBeInTheDocument()
    expect(within(ficha).queryByRole('button', { name: 'Descargar sus datos' })).not.toBeInTheDocument()
  })
})
