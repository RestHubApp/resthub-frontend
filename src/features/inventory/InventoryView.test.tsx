import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { insumo } from '#jest/fixtures/inventario'
import { entrarComo, montar, PERMISOS_ENCARGADO, RespuestaDeError, servidor } from '#jest/harness'
import type { Ingredient, PermissionCode } from '../../api/types'
import InventoryView from './InventoryView'

const INSUMOS = '/inventory/ingredients'
const ALERTAS = '/inventory/alerts/low-stock'
const RESTAURANTE = '/restaurant'
const BUSCAR = 'Buscar insumo'
const SOLO_LECTURA: PermissionCode[] = ['inventory.read', 'orders.take']

const PAPA = insumo({ id: 2, name: 'Papa amarilla', stock: '800', min_stock: '3000', is_low: true })
const ACEITE = insumo({ id: 3, name: 'Aceite', unit: 'ml', unit_label: 'mililitros', stock: '-200', min_stock: '1000', is_low: true, is_negative: true })

function local(autoOutOfStock = false) {
  return {
    id: 1,
    name: 'La Picantería',
    slug: 'la-picanteria',
    timezone: 'America/Lima',
    is_active: true,
    auto_out_of_stock: autoOutOfStock,
    max_waiter_discount_percent: '10.00',
    external_ai_enabled: true,
    created_at: '2026-09-26T13:00:00Z',
  }
}

function abrir(permisos: readonly PermissionCode[] = PERMISOS_ENCARGADO, alertas: Ingredient[] = [PAPA, ACEITE], en = '/inventario') {
  const api = servidor()
    .on('get', INSUMOS, [ACEITE, insumo(), PAPA])
    .on('get', ALERTAS, alertas)
    .on('get', RESTAURANTE, local())
  entrarComo(permisos)
  return { api, ...montar(<InventoryView />, { path: '/inventario', en }) }
}

describe('InventoryView: resumen y alertas', () => {
  it('dice cuántos insumos hay por reponer y cuántos en negativo', async () => {
    abrir()
    expect(await screen.findByText('2 insumos por reponer, 1 en negativo')).toBeInTheDocument()
    expect(screen.getByText('Papa amarilla, Aceite')).toBeInTheDocument()
    expect(await screen.findByRole('tab', { name: /Alertas\s*2/u })).toBeInTheDocument()
  })

  it('con todo sobre el mínimo lo dice y no ofrece ver alertas', async () => {
    abrir(PERMISOS_ENCARGADO, [])
    expect(await screen.findByText('Stock en orden: nada por debajo del mínimo.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver alertas' })).not.toBeInTheDocument()
  })

  it('«Ver alertas» abre la pestaña con lo que falta para el mínimo y la compra a un toque', async () => {
    const { user } = abrir()
    await user.click(await screen.findByRole('button', { name: 'Ver alertas' }))

    const papa = (await screen.findByRole('heading', { name: 'Papa amarilla' })).closest('li') as HTMLElement
    expect(within(papa).getByText('Bajo mínimo')).toBeInTheDocument()
    expect(within(papa).getByText('2.2 kg')).toBeInTheDocument()
    const aceite = screen.getByRole('heading', { name: 'Aceite' }).closest('li') as HTMLElement
    expect(within(aceite).getByText('Negativo')).toBeInTheDocument()

    await user.click(within(papa).getByRole('button', { name: 'Registrar compra de Papa amarilla' }))
    expect(await screen.findByRole('dialog', { name: 'Registrar compra: Papa amarilla' })).toBeInTheDocument()
  })

  it('sin alertas la pestaña lo dice', async () => {
    abrir(PERMISOS_ENCARGADO, [], '/inventario?vista=alertas')
    expect(await screen.findByText('Nada por reponer')).toBeInTheDocument()
  })

  it('más de cuatro por reponer se resumen', async () => {
    const muchos = ['A', 'B', 'C', 'D', 'E', 'F'].map((nombre, i) => insumo({ id: 10 + i, name: nombre, is_low: true }))
    abrir(PERMISOS_ENCARGADO, muchos)
    expect(await screen.findByText('A, B, C, D y 2 más')).toBeInTheDocument()
  })
})

describe('InventoryView: tabla de insumos', () => {
  it('muestra stock, estado, mínimo y costo por kilo de cada insumo', async () => {
    abrir()
    const fila = (await screen.findByText('Limón')).closest('tr') as HTMLElement
    expect(within(fila).getByText('5 kg')).toBeInTheDocument()
    expect(within(fila).getByText('Suficiente')).toBeInTheDocument()
    expect(within(fila).getByText('S/ 4.00 por kg')).toBeInTheDocument()
    expect(screen.getByText('3 insumos')).toBeInTheDocument()
  })

  it('busca sin importar tildes ni mayúsculas y filtra lo que está bajo el mínimo', async () => {
    const { user } = abrir()
    await user.type(await screen.findByLabelText(BUSCAR), 'LIMON')
    expect(screen.getByText('1 de 3 insumos')).toBeInTheDocument()
    expect(screen.queryByText('Aceite')).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText(BUSCAR))
    await user.click(screen.getByLabelText('Solo bajo mínimo'))
    expect(screen.getByText('2 de 3 insumos')).toBeInTheDocument()
    expect(screen.queryByText('Limón')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(BUSCAR), 'zzz')
    expect(screen.getByText('Ningún insumo coincide con la búsqueda.')).toBeInTheDocument()
  })

  it('cada fila ofrece compra, merma, ajuste y edición con el nombre del insumo', async () => {
    const { user } = abrir()
    await user.click(await screen.findByRole('button', { name: 'Merma de Limón' }))
    expect(await screen.findByRole('dialog', { name: 'Registrar merma: Limón' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Ajuste de Limón' }))
    expect(await screen.findByRole('dialog', { name: 'Ajustar stock: Limón' })).toBeInTheDocument()
  })

  it('quien solo consulta no ve acciones ni la regla de agotar platos', async () => {
    const { api } = abrir(SOLO_LECTURA)
    await screen.findByText('Limón')
    expect(screen.queryByRole('button', { name: 'Nuevo insumo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Compra de Limón' })).not.toBeInTheDocument()
    expect(screen.queryByText('Agotar solos los platos sin insumos')).not.toBeInTheDocument()
    expect(api.llamadas('get', RESTAURANTE)).toHaveLength(0)
  })

  it('si los insumos no cargan, lo dice', async () => {
    servidor().on('get', INSUMOS, new RespuestaDeError(500, 'Inventario caído')).on('get', ALERTAS, []).on('get', RESTAURANTE, local())
    entrarComo()
    montar(<InventoryView />)
    expect(await screen.findByText('Inventario caído')).toBeInTheDocument()
  })
})

describe('InventoryView: regla de agotar platos', () => {
  it('encenderla la envía y avisa lo que cambia', async () => {
    const { api, user } = abrir()
    api.on('patch', RESTAURANTE, () => {
      api.on('get', RESTAURANTE, local(true))
      return local(true)
    })
    const casilla = await screen.findByRole('checkbox', { name: /Agotar solos los platos sin insumos/u })
    await user.click(casilla)

    expect(await screen.findByText('Los platos sin insumos se agotan solos.')).toBeInTheDocument()
    expect(api.llamadas('patch', RESTAURANTE)[0]?.body).toEqual({ auto_out_of_stock: true })
  })

  it('si el servidor la rechaza, avisa', async () => {
    const { api, user } = abrir()
    api.on('patch', RESTAURANTE, new RespuestaDeError(403, 'Solo el encargado.'))
    await user.click(await screen.findByRole('checkbox', { name: /Agotar solos/u }))
    expect(await screen.findByText('Solo el encargado.')).toBeInTheDocument()
  })
})
