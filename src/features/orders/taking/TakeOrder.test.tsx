import { afterEach, describe, expect, it } from '@jest/globals'
import { act, renderHook, screen, within } from '@testing-library/react'

import { carta, mesa, pedido, ultimoCuerpo } from '#jest/fixtures/pedidos'
import { entrarComo, montar, RespuestaDeError, servidor, sinRed } from '#jest/harness'
import type { OpenOrderRequest } from '../../../api/types'
import { ownerOf, queuedOrders, removeQueued } from '../../../store/offlineQueue'
import { useSession } from '../../../store/session'
import NewOrderView from '../NewOrderView'
import { useDraftActions } from './useOrderDraft'

const PEDIDOS = '/orders'
const ENVIAR = '/orders/5/send'
const ENVIAR_A_COCINA = { name: /enviar a cocina/i }
const DUENA = { userId: 7, restaurantId: 1 }
const LOMO = 'Lomo saltado'

function tomarPedidoEnMesa() {
  const api = servidor()
    .on('get', '/tables', [mesa()])
    .on('get', '/menu', carta())
    .on('post', PEDIDOS, pedido({ status: 'open' }))
    .on('post', ENVIAR, pedido())
  entrarComo()
  return { api, ...montar(<NewOrderView />, { path: '/pedidos/nuevo', en: '/pedidos/nuevo?mesa=3' }) }
}

async function elegir(user: ReturnType<typeof tomarPedidoEnMesa>['user'], nombre: string) {
  // eslint-disable-next-line security/detect-non-literal-regexp -- el texto lo fija la prueba; se busca por coincidencia parcial del nombre accesible
  await user.click(await screen.findByRole('button', { name: new RegExp(nombre, 'u') }))
}

async function enviar(user: ReturnType<typeof tomarPedidoEnMesa>['user']) {
  // El botón de la barra; el del resumen solo está con el resumen abierto.
  await user.click(screen.getAllByRole('button', ENVIAR_A_COCINA)[0])
}

function rutaActual() {
  return screen.findByRole('status', { name: 'Ruta actual' })
}

afterEach(() => {
  const { result } = renderHook(() => useDraftActions())
  act(() => {
    result.current.clear('mesa-3')
  })
  // La sesión ya la cerró el arnés: la cola se vacía con la dueña fija de las pruebas.
  for (const enCola of queuedOrders(DUENA)) {
    removeQueued(enCola.request.client_request_id ?? '')
  }
})

describe('tomar un pedido en una mesa', () => {
  it('mesa, dos platos y «Enviar a cocina»: abre el pedido, lo envía y vuelve al salón', async () => {
    const { api, user } = tomarPedidoEnMesa()
    expect(await screen.findByRole('heading', { name: 'Mesa 3', level: 1 })).toBeInTheDocument()

    await elegir(user, LOMO)
    await elegir(user, 'Ají de gallina')
    expect(screen.getByText('2 platos · Ver y anotar')).toBeInTheDocument()
    await enviar(user)

    expect(await screen.findByText('Pedido #12 enviado a cocina.')).toBeInTheDocument()
    const cuerpo = ultimoCuerpo(api.llamadas('post', PEDIDOS)) as OpenOrderRequest
    expect(cuerpo).toMatchObject({ type: 'dine_in', table_id: 3, customer_name: '' })
    expect(cuerpo.items?.map((item) => item.menu_item_id)).toEqual([11, 12])
    expect(cuerpo.client_request_id).toEqual(expect.any(String))
    expect(api.llamadas('post', ENVIAR)).toHaveLength(1)
    expect(await rutaActual()).toHaveTextContent('/pedidos')
  })

  it('en el resumen se anota para la cocina y se ajusta la cantidad', async () => {
    const { api, user } = tomarPedidoEnMesa()
    await elegir(user, LOMO)
    await user.click(screen.getByRole('button', { name: /ver y anotar/i }))

    const resumen = await screen.findByRole('dialog', { name: 'Resumen · Mesa 3' })
    await user.type(within(resumen).getByLabelText('Nota para cocina'), 'sin cebolla')
    await user.click(within(resumen).getByRole('button', { name: 'Uno más de Lomo saltado' }))
    expect(within(resumen).getByText('2 platos')).toBeInTheDocument()
    await user.click(within(resumen).getByRole('button', ENVIAR_A_COCINA))

    await screen.findByText('Pedido #12 enviado a cocina.')
    const cuerpo = ultimoCuerpo(api.llamadas('post', PEDIDOS)) as OpenOrderRequest
    expect(cuerpo.items).toEqual([{ menu_item_id: 11, quantity: 2, notes: 'sin cebolla', modifiers: [] }])
  })

  it('si la cocina no lo recibe, el pedido queda abierto y lleva a su detalle', async () => {
    const { api, user } = tomarPedidoEnMesa()
    api.on('post', ENVIAR, new RespuestaDeError(500, 'La cocina no respondió'))
    await elegir(user, LOMO)
    await enviar(user)

    expect(await screen.findByText('El pedido #12 quedó abierto sin enviar: La cocina no respondió')).toBeInTheDocument()
    expect(await rutaActual()).toHaveTextContent('/pedidos/5')
  })

  it('sin señal, el pedido queda guardado en el celular para enviarse solo', async () => {
    const { api, user } = tomarPedidoEnMesa()
    api.on('post', PEDIDOS, sinRed)
    await elegir(user, LOMO)
    await enviar(user)

    expect(await screen.findByText('Sin señal: el pedido de Mesa 3 quedó guardado y se enviará solo.')).toBeInTheDocument()
    const enCola = queuedOrders(ownerOf(useSession.getState().account))
    expect(enCola.map((item) => [item.label, item.request.table_id])).toEqual([['Mesa 3', 3]])
    expect(api.llamadas('post', ENVIAR)).toHaveLength(0)
  })

  it('un rechazo del servidor se avisa y el borrador sigue ahí para corregirlo', async () => {
    const { api, user } = tomarPedidoEnMesa()
    api.on('post', PEDIDOS, new RespuestaDeError(409, 'La mesa ya tiene un pedido abierto.'))
    await elegir(user, LOMO)
    await enviar(user)

    expect(await screen.findByText('La mesa ya tiene un pedido abierto.')).toBeInTheDocument()
    expect(screen.getByText('1 plato · Ver y anotar')).toBeInTheDocument()
    expect(queuedOrders(ownerOf(useSession.getState().account))).toHaveLength(0)
  })

  it('sin platos no se puede enviar', async () => {
    tomarPedidoEnMesa()
    expect(await screen.findByText('Toca un plato')).toBeInTheDocument()
    expect(screen.getByRole('button', ENVIAR_A_COCINA)).toBeDisabled()
  })
})
