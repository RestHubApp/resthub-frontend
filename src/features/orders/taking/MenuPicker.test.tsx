import { afterEach, describe, expect, it } from '@jest/globals'
import { act, renderHook, screen, within } from '@testing-library/react'

import { carta, pedido, plato, seccion, ultimoCuerpo } from '#jest/fixtures/pedidos'
import { entrarComo, montar, RespuestaDeError, servidor } from '#jest/harness'
import type { OpenOrderRequest } from '../../../api/types'
import NewOrderView from '../NewOrderView'
import { useDraftActions } from './useOrderDraft'

const LOMO = 'Lomo saltado'
const BUSCAR = 'Buscar plato'
const CHICHA = 'Chicha morada'

function abrirCarta(menu: unknown = carta()) {
  const api = servidor()
    .on('get', '/menu', menu)
    .on('post', '/orders', pedido({ status: 'open', type: 'takeaway' }))
    .on('post', '/orders/5/send', pedido({ type: 'takeaway' }))
  entrarComo()
  return { api, ...montar(<NewOrderView />, { path: '/pedidos/nuevo', en: '/pedidos/nuevo?tipo=llevar' }) }
}

function plat(nombre: string) {
  // eslint-disable-next-line security/detect-non-literal-regexp -- el texto lo fija la prueba; se busca por coincidencia parcial del nombre accesible
  return screen.findByRole('button', { name: new RegExp(nombre, 'u') })
}

afterEach(() => {
  const { result } = renderHook(() => useDraftActions())
  act(() => {
    result.current.clear('llevar')
  })
})

describe('la carta para tomar el pedido', () => {
  it('la búsqueda encuentra el plato sin tildes y avisa si nada coincide', async () => {
    const { user } = abrirCarta()
    await user.type(await screen.findByLabelText(BUSCAR), 'aji')
    expect(await plat('Ají de gallina')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: new RegExp(LOMO, 'u') })).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText(BUSCAR))
    await user.type(screen.getByLabelText(BUSCAR), 'pizza')
    expect(await screen.findByText('Ningún plato coincide con «pizza»')).toBeInTheDocument()
  })

  it('una categoría filtra la lista y se marca como elegida', async () => {
    const { user } = abrirCarta()
    const categorias = await screen.findByRole('group', { name: 'Categorías' })
    await user.click(within(categorias).getByRole('button', { name: 'Bebidas' }))

    expect(within(categorias).getByRole('button', { name: 'Bebidas' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('heading', { name: 'Fondos' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Bebidas' })).toBeInTheDocument()
  })

  it('un plato agotado se ve pero no se puede elegir; uno sin insumos, tampoco', async () => {
    const menu = { categories: [seccion({ items: [plato({ is_available: false }), plato({ id: 12, name: 'Tacu tacu', out_of_stock: true })] })] }
    abrirCarta(menu)
    expect(await plat(LOMO)).toBeDisabled()
    expect(screen.getByText('Agotado')).toBeInTheDocument()
    expect(await plat('Tacu tacu')).toBeDisabled()
    expect(screen.getByText('Sin insumos')).toBeInTheDocument()
  })

  it('con el más y el menos se ajusta la cantidad; en uno, el menos quita el plato', async () => {
    const { user } = abrirCarta()
    await user.click(await plat(LOMO))
    await user.click(screen.getByRole('button', { name: `Uno más de ${LOMO}` }))
    expect(screen.getByText('2 platos · Ver y anotar')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: `Uno menos de ${LOMO}` }))
    await user.click(screen.getByRole('button', { name: `Quitar ${LOMO}` }))
    expect(screen.getByText('Toca un plato')).toBeInTheDocument()
  })

  it('si la carta no carga, lo dice y deja reintentar', async () => {
    const { api, user } = abrirCarta(new RespuestaDeError(500, 'Sin carta'))
    expect(await screen.findByText('Sin carta')).toBeInTheDocument()
    api.on('get', '/menu', carta())
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await plat(LOMO)).toBeInTheDocument()
  })
})

describe('las opciones de un plato', () => {
  it('un grupo obligatorio no deja agregar hasta elegir, y el precio suma los extras', async () => {
    const { user } = abrirCarta()
    await user.click(await plat(CHICHA))

    const dialogo = await screen.findByRole('dialog', { name: CHICHA })
    expect(within(dialogo).getByRole('button', { name: 'Elige tamaño' })).toBeDisabled()
    await user.click(within(dialogo).getByRole('button', { name: /Vaso/u }))
    await user.click(within(dialogo).getByRole('button', { name: /Jarra/u }))
    await user.click(within(dialogo).getByRole('button', { name: /Limón/u }))

    expect(within(dialogo).getByRole('button', { name: /Vaso/u })).toHaveAttribute('aria-pressed', 'false')
    await user.click(within(dialogo).getByRole('button', { name: /Agregar · S\/\s20\.50/u }))
    expect(screen.queryByRole('dialog', { name: CHICHA })).not.toBeInTheDocument()
    expect(screen.getByText('×1')).toBeInTheDocument()
    expect(screen.getByText('1 plato · Ver y anotar')).toBeInTheDocument()
  })

  it('la combinación elegida viaja con el pedido', async () => {
    const { api, user } = abrirCarta()
    await user.click(await plat(CHICHA))
    const dialogo = await screen.findByRole('dialog', { name: CHICHA })
    await user.click(within(dialogo).getByRole('button', { name: /Vaso/u }))
    await user.click(within(dialogo).getByRole('button', { name: /Agregar/u }))
    await user.click(screen.getByRole('button', { name: /enviar a cocina/i }))

    await screen.findByText('Pedido #12 enviado a cocina.')
    const cuerpo = ultimoCuerpo(api.llamadas('post', '/orders')) as OpenOrderRequest
    expect(cuerpo.items?.[0]?.modifiers).toEqual([{ group: 'Tamaño', option: 'Vaso' }])
  })

  it('cerrar la ventana no agrega nada', async () => {
    const { user } = abrirCarta()
    await user.click(await plat(CHICHA))
    await screen.findByRole('dialog', { name: CHICHA })
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Toca un plato')).toBeInTheDocument()
  })
})
