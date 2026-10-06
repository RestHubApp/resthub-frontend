import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { entrarComo, montarRutas, PERMISOS_ENCARGADO, PERMISOS_MESERO, RespuestaDeError, servidor } from '#jest/harness'
import { currentUserQueryKey } from '../../api/auth'
import { queryClient } from '../../services/queryClient'
import type { OpenOrderRequest } from '../../api/types'
import { enqueueOrder, removeQueued } from '../../store/offlineQueue'
import { useSession } from '../../store/session'
import AppShell from './AppShell'
import type { ScreenPreload } from './screenPreload'

const ORDERS_TAKE = 'orders.take'
const CASH_MANAGE = 'cash.manage'
const FORMULARIO_DE_ACCESO = 'Formulario de acceso'

const MENU = { name: 'Navegación principal' }
const SALIR = { name: 'Cerrar sesión' }

function abrirArmazon(screens: readonly ScreenPreload[] = [], en = '/') {
  const rutas = [
    {
      path: '/',
      element: <AppShell screens={screens} />,
      children: [
        { index: true, element: <p>Pantalla de inicio</p> },
        { path: 'acceso', element: <p>Formulario de acceso</p> },
        { path: 'perfil', element: <p>Mi perfil</p> },
        { path: 'caja', element: <p>Pantalla de caja</p> },
      ],
    },
  ]
  return montarRutas(rutas, en)
}

function barraLateral() {
  return screen.getAllByRole('navigation', MENU)[0]
}

function contenedorDeLaBarra(): HTMLElement {
  const contenedor = barraLateral().parentElement
  if (contenedor === null) {
    throw new Error('La barra lateral no tiene contenedor.')
  }
  return contenedor
}

function barraInferior() {
  return screen.getAllByRole('navigation', MENU)[1]
}

function enlaces(zona: HTMLElement): string[] {
  return within(zona).getAllByRole('link').map((enlace) => enlace.textContent)
}

afterEach(() => {
  removeQueued('pedido-en-cola')
})

describe('AppShell', () => {
  it('si falla la actualización de la cuenta en segundo plano, no avisa: la sesión guardada sigue sirviendo', async () => {
    servidor().on('get', '/auth/me', new RespuestaDeError(503, 'No hay conexión con la base de datos.'))
    entrarComo(PERMISOS_MESERO)
    abrirArmazon()

    await waitFor(() => {
      expect(queryClient.getQueryState(currentUserQueryKey)?.status).toBe('error')
    })
    expect(screen.queryByText('No hay conexión con la base de datos.')).not.toBeInTheDocument()
    expect(screen.getByText('Pantalla de inicio')).toBeInTheDocument()
  })

  it('el mesero solo ve en el menú las pantallas de sus permisos', () => {
    servidor()
    entrarComo(PERMISOS_MESERO)
    abrirArmazon()

    expect(enlaces(barraLateral())).toEqual(expect.arrayContaining(['Pedidos', 'Cocina', 'Reservas', 'Clientes']))
    expect(within(barraLateral()).queryByRole('link', { name: 'Caja' })).not.toBeInTheDocument()
    expect(within(barraLateral()).queryByRole('link', { name: 'Panel BI' })).not.toBeInTheDocument()
    expect(screen.getByText('Pantalla de inicio')).toBeInTheDocument()
  })

  it('el menú sigue a los permisos y no al nombre del rol', () => {
    servidor()
    entrarComo([ORDERS_TAKE, CASH_MANAGE], {
      user: { id: 7, email: 'ana@resthub.dev', full_name: 'Ana Torres', role_id: 9, role_label: 'Mesero' },
    })
    abrirArmazon()

    expect(within(barraLateral()).getByRole('link', { name: 'Caja' })).toBeInTheDocument()
    expect(within(barraLateral()).queryByRole('link', { name: 'Reservas' })).not.toBeInTheDocument()
  })

  it('en el celular caben cuatro pantallas y el resto va en «Más»', async () => {
    servidor()
    entrarComo(PERMISOS_ENCARGADO)
    const { user } = abrirArmazon()

    expect(enlaces(barraInferior())).toEqual(['Pedidos', 'Tablero', 'Cocina', 'Reservas'])
    await user.click(within(barraInferior()).getByRole('button', { name: 'Más' }))

    const panel = await screen.findByRole('dialog')
    expect(within(panel).getByRole('link', { name: 'Caja' })).toBeInTheDocument()
    await user.click(within(panel).getByRole('link', { name: 'Caja' }))
    expect(await screen.findByText('Pantalla de caja')).toBeInTheDocument()
  })

  it('sin pantallas de sobra, el último botón es «Cuenta»', () => {
    servidor()
    entrarComo([ORDERS_TAKE])
    abrirArmazon()

    expect(within(barraInferior()).getByRole('button', { name: 'Cuenta' })).toBeInTheDocument()
  })
})

describe('AppShell: sesión y precargas', () => {
  it('cerrar sesión vacía la sesión y lleva al acceso', async () => {
    servidor()
    entrarComo(PERMISOS_MESERO)
    const { user } = abrirArmazon()

    await user.click(within(contenedorDeLaBarra()).getByRole('button', SALIR))

    expect(await screen.findByText(FORMULARIO_DE_ACCESO)).toBeInTheDocument()
    expect(useSession.getState().account).toBeNull()
  })

  it('con pedidos sin enviar, pregunta antes de cerrar la sesión', async () => {
    servidor()
    const cuenta = entrarComo(PERMISOS_MESERO)
    enqueueOrder({
      userId: cuenta.user.id,
      restaurantId: cuenta.restaurant.id,
      request: { client_request_id: 'pedido-en-cola' } as OpenOrderRequest,
      queuedAt: '2026-09-26T13:00:00Z',
      label: 'Mesa 3',
    })
    const { user } = abrirArmazon()

    await user.click(within(contenedorDeLaBarra()).getByRole('button', SALIR))

    const aviso = await screen.findByRole('alertdialog')
    expect(within(aviso).getByText(/Un pedido tuyo espera señal: Mesa 3/u)).toBeInTheDocument()
    expect(useSession.getState().account).not.toBeNull()
    await user.click(within(aviso).getByRole('button', SALIR))
    expect(await screen.findByText(FORMULARIO_DE_ACCESO)).toBeInTheDocument()
  })

  it('sin sesión solo muestra la marca y el contenido del acceso', () => {
    servidor()
    abrirArmazon([], '/acceso')

    expect(screen.getByText(FORMULARIO_DE_ACCESO)).toBeInTheDocument()
    expect(screen.queryByRole('navigation', MENU)).not.toBeInTheDocument()
  })

  it('relee la cuenta con /auth/me y muestra el nombre nuevo del local', async () => {
    const actualizada = entrarComo(PERMISOS_MESERO)
    servidor().on('get', '/auth/me', { ...actualizada, restaurant: { ...actualizada.restaurant, name: 'Picantería Renovada' } })
    abrirArmazon()

    expect((await screen.findAllByText('Picantería Renovada')).length).toBeGreaterThan(0)
  })

  it('no baja pantallas en reposo; al acercarse al enlace baja solo la permitida', async () => {
    servidor()
    entrarComo(PERMISOS_MESERO)
    const caja = jest.fn(() => Promise.resolve())
    const cocina = jest.fn(() => Promise.resolve())
    const { user } = abrirArmazon([
      { path: 'caja', permission: CASH_MANAGE, load: caja },
      { path: 'cocina', permission: ORDERS_TAKE, load: cocina },
    ])

    expect(cocina).not.toHaveBeenCalled()
    expect(caja).not.toHaveBeenCalled()
    await user.hover(within(barraLateral()).getByRole('link', { name: 'Cocina' }))
    expect(cocina).toHaveBeenCalledTimes(1)
    expect(caja).not.toHaveBeenCalled()
  })

  it('acercarse a un enlace del menú adelanta los datos de esa pantalla', async () => {
    servidor()
    entrarComo(PERMISOS_ENCARGADO)
    const prefetch = jest.fn()
    const { user } = abrirArmazon([{ path: 'caja', permission: CASH_MANAGE, prefetch }])

    await user.hover(within(barraLateral()).getByRole('link', { name: 'Caja' }))

    expect(prefetch).toHaveBeenCalled()
  })
})
