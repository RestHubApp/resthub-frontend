import { afterEach, describe, expect, it } from '@jest/globals'
import { act, renderHook, screen, within } from '@testing-library/react'

import { carta, pedido, plato, seccion, ultimoCuerpo } from '#jest/fixtures/pedidos'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import type { OpenOrderRequest } from '@/api/types'
import { NewOrderView } from '@/features/orders/NewOrderView'
import { useDraftActions } from './useOrderDraft'

const LOMO = 'Lomo saltado'
const SEARCH = 'Buscar plato'
const CHICHA = 'Chicha morada'

function openMenu(menu: unknown = carta()) {
  const api = servidor()
    .on('get', '/menu', menu)
    .on('post', '/orders', pedido({ status: 'open', type: 'takeaway' }))
    .on('post', '/orders/5/send', pedido({ type: 'takeaway' }))
  entrarComo()
  return { api, ...montar(<NewOrderView />, { path: '/pedidos/nuevo', en: '/pedidos/nuevo?tipo=llevar' }) }
}

function plat(name: string) {
  // eslint-disable-next-line security/detect-non-literal-regexp -- el texto lo fija la prueba; se busca por coincidencia parcial del nombre accesible
  return screen.findByRole('button', { name: new RegExp(name, 'u') })
}

afterEach(() => {
  const { result } = renderHook(() => useDraftActions())
  act(() => {
    result.current.clear('llevar')
  })
})

describe('la carta para tomar el pedido', () => {
  it('la búsqueda encuentra el plato sin tildes y avisa si nada coincide', async () => {
    const { user } = openMenu()
    await user.type(await screen.findByLabelText(SEARCH), 'aji')
    expect(await plat('Ají de gallina')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: new RegExp(LOMO, 'u') })).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText(SEARCH))
    await user.type(screen.getByLabelText(SEARCH), 'pizza')
    expect(await screen.findByText('Ningún plato coincide con «pizza»')).toBeInTheDocument()
  })

  it('una categoría filtra la lista y se marca como elegida', async () => {
    const { user } = openMenu()
    const categories = await screen.findByRole('group', { name: 'Categorías' })
    await user.click(within(categories).getByRole('button', { name: 'Bebidas' }))

    expect(within(categories).getByRole('button', { name: 'Bebidas' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('heading', { name: 'Fondos' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Bebidas' })).toBeInTheDocument()
  })

  it('un plato agotado se ve pero no se puede elegir; uno sin insumos, tampoco', async () => {
    const menu = { categories: [seccion({ items: [plato({ is_available: false }), plato({ id: 12, name: 'Tacu tacu', out_of_stock: true })] })] }
    openMenu(menu)
    expect(await plat(LOMO)).toBeDisabled()
    expect(screen.getByText('Agotado')).toBeInTheDocument()
    expect(await plat('Tacu tacu')).toBeDisabled()
    expect(screen.getByText('Sin insumos')).toBeInTheDocument()
  })

  it('con el más y el menos se ajusta la cantidad; en uno, el menos quita el plato', async () => {
    const { user } = openMenu()
    await user.click(await plat(LOMO))
    await user.click(screen.getByRole('button', { name: `Uno más de ${LOMO}` }))
    expect(screen.getByText('2 platos · Ver y anotar')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: `Uno menos de ${LOMO}` }))
    await user.click(screen.getByRole('button', { name: `Quitar ${LOMO}` }))
    expect(screen.getByText('Toca un plato')).toBeInTheDocument()
  })

  it('si la carta no carga, lo dice y deja reintentar', async () => {
    const { api, user } = openMenu(new RespuestaDeError(500, 'Sin carta'))
    expect(await screen.findByText('Sin carta')).toBeInTheDocument()
    api.on('get', '/menu', carta())
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await plat(LOMO)).toBeInTheDocument()
  })
})

describe('las opciones de un plato', () => {
  it('un grupo obligatorio no deja agregar hasta elegir, y el precio suma los extras', async () => {
    const { user } = openMenu()
    await user.click(await plat(CHICHA))

    const dialog = await screen.findByRole('dialog', { name: CHICHA })
    expect(within(dialog).getByRole('button', { name: 'Elige tamaño' })).toBeDisabled()
    await user.click(within(dialog).getByRole('button', { name: /Vaso/u }))
    await user.click(within(dialog).getByRole('button', { name: /Jarra/u }))
    await user.click(within(dialog).getByRole('button', { name: /Limón/u }))

    expect(within(dialog).getByRole('button', { name: /Vaso/u })).toHaveAttribute('aria-pressed', 'false')
    await user.click(within(dialog).getByRole('button', { name: /Agregar · S\/\s20\.50/u }))
    expect(screen.queryByRole('dialog', { name: CHICHA })).not.toBeInTheDocument()
    expect(screen.getByText('×1')).toBeInTheDocument()
    expect(screen.getByText('1 plato · Ver y anotar')).toBeInTheDocument()
  })

  it('la combinación elegida viaja con el pedido', async () => {
    const { api, user } = openMenu()
    await user.click(await plat(CHICHA))
    const dialog = await screen.findByRole('dialog', { name: CHICHA })
    await user.click(within(dialog).getByRole('button', { name: /Vaso/u }))
    await user.click(within(dialog).getByRole('button', { name: /Agregar/u }))
    await user.click(screen.getByRole('button', { name: /enviar a cocina/i }))

    await screen.findByText('Pedido #12 enviado a cocina.')
    const body = ultimoCuerpo(api.llamadas('post', '/orders')) as OpenOrderRequest
    expect(body.items?.[0]?.modifiers).toEqual([{ group: 'Tamaño', option: 'Vaso' }])
  })

  it('cerrar la ventana no agrega nada', async () => {
    const { user } = openMenu()
    await user.click(await plat(CHICHA))
    await screen.findByRole('dialog', { name: CHICHA })
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Toca un plato')).toBeInTheDocument()
  })
})
