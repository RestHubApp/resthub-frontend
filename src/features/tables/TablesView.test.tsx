import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { mesa, pedidoEnMesa } from '#jest/fixtures/inventario'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import TablesView from './TablesView'

const MESAS = '/tables'
const NOMBRE = 'Nombre'
const GUARDAR = { name: 'Guardar' }
const CREADO = '2026-09-26T13:00:00Z'
const NUEVA_MESA = { name: 'Nueva mesa' }

function abrirMesas(mesas = [mesa(), mesa({ id: 2, label: 'Terraza 2', position: 1 })]) {
  const api = servidor().on('get', MESAS, mesas)
  entrarComo()
  return { api, ...montar(<TablesView />, { path: '/mesas' }) }
}

describe('TablesView: lista y nombre', () => {
  it('lista las mesas con su estado y cuenta las activas', async () => {
    abrirMesas([mesa(), mesa({ id: 2, label: 'Barra', is_active: false })])

    expect(await screen.findByText('Mesa 1')).toBeInTheDocument()
    expect(screen.getByText('Barra')).toBeInTheDocument()
    expect(screen.getByText('1 activas de 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Activar' })).toBeInTheDocument()
  })

  it('pide todas las mesas, también las desactivadas', async () => {
    const { api } = abrirMesas()
    await screen.findByText('Mesa 1')
    expect(api.llamadas('get', MESAS)[0]?.params).toEqual({ include_inactive: true })
  })

  it('sin mesas invita a crear la primera', async () => {
    abrirMesas([])
    expect(await screen.findByText('Todavía no hay mesas')).toBeInTheDocument()
  })

  it('crea una mesa y la muestra con lo que devolvió el servidor', async () => {
    const { api, user } = abrirMesas([mesa()])
    api.on('post', MESAS, () => {
      api.on('get', MESAS, [mesa(), mesa({ id: 9, label: 'Patio', position: 1 })])
      return { id: 9, label: 'Patio', position: 1, is_active: true, created_at: CREADO }
    })

    await user.click(await screen.findByRole('button', NUEVA_MESA))
    const ventana = await screen.findByRole('dialog', NUEVA_MESA)
    await user.type(within(ventana).getByLabelText(NOMBRE), '  Patio ')
    await user.click(within(ventana).getByRole('button', GUARDAR))

    expect(await screen.findByText('Mesa creada.')).toBeInTheDocument()
    expect(api.llamadas('post', MESAS)[0]?.body).toEqual({ label: 'Patio' })
    expect(screen.getByText('Patio')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('sin nombre no envía nada y lo pide', async () => {
    const { api, user } = abrirMesas()

    await user.click(await screen.findByRole('button', NUEVA_MESA))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', GUARDAR))

    expect(await screen.findByText('Escribe el nombre de la mesa')).toBeInTheDocument()
    expect(api.llamadas('post', MESAS)).toHaveLength(0)
  })

  it('si el nombre ya existe, muestra lo que dijo el servidor dentro de la ventana', async () => {
    const { api, user } = abrirMesas()
    api.on('patch', '/tables/1', new RespuestaDeError(409, 'Ya hay una mesa con ese nombre.'))

    await user.click((await screen.findAllByRole('button', { name: 'Renombrar' }))[0])
    const ventana = await screen.findByRole('dialog', { name: 'Renombrar Mesa 1' })
    const campo = within(ventana).getByLabelText(NOMBRE)
    expect(campo).toHaveValue('1')
    await user.clear(campo)
    await user.type(campo, 'Terraza 2')
    await user.click(within(ventana).getByRole('button', GUARDAR))

    expect(await within(ventana).findByText('Ya hay una mesa con ese nombre.')).toBeInTheDocument()
    expect(api.llamadas('patch', '/tables/1')[0]?.body).toEqual({ label: 'Terraza 2' })
  })

})

describe('TablesView: orden y estado', () => {
  it('bajar la primera mesa envía el orden nuevo y lo aplica', async () => {
    const { api, user } = abrirMesas()
    api.on('put', '/tables/order', () => {
      api.on('get', MESAS, [mesa({ id: 2, label: 'Terraza 2', position: 0 }), mesa({ position: 1 })])
      return [
        { id: 2, label: 'Terraza 2', position: 0, is_active: true, created_at: CREADO },
        { id: 1, label: '1', position: 1, is_active: true, created_at: CREADO },
      ]
    })

    expect(await screen.findByRole('button', { name: 'Subir Mesa 1' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Bajar Terraza 2' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Bajar Mesa 1' }))

    expect(api.llamadas('put', '/tables/order')[0]?.body).toEqual({ ids: [2, 1] })
    expect(await screen.findByRole('button', { name: 'Subir Terraza 2' })).toBeDisabled()
  })

  it('una mesa con pedido en curso no se puede desactivar', async () => {
    abrirMesas([mesa({ status: 'occupied', status_label: 'Ocupada', active_order: pedidoEnMesa(12) })])

    expect(await screen.findByText('Ocupada · pedido #12')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeDisabled()
  })

  it('desactivar una mesa libre avisa y, si falla, dice por qué', async () => {
    const { api, user } = abrirMesas([mesa()])
    api.once('patch', '/tables/1', new RespuestaDeError(409, 'La mesa tiene un pedido.'))
    await user.click(await screen.findByRole('button', { name: 'Desactivar' }))
    expect(await screen.findByText('La mesa tiene un pedido.')).toBeInTheDocument()

    api.on('patch', '/tables/1', { id: 1, label: '1', position: 0, is_active: false, created_at: CREADO })
    await user.click(screen.getByRole('button', { name: 'Desactivar' }))
    expect(await screen.findByText('Mesa 1 desactivada.')).toBeInTheDocument()
    expect(api.llamadas('patch', '/tables/1')[1]?.body).toEqual({ is_active: false })
  })

  it('si no carga, lo dice', async () => {
    servidor().on('get', MESAS, new RespuestaDeError(500, 'Servidor caído'))
    entrarComo()
    montar(<TablesView />)
    expect(await screen.findByText('Servidor caído')).toBeInTheDocument()
  })
})
