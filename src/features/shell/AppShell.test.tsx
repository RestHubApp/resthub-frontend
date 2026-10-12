import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { signInAs, mountRoutes, TEST_SCREENS, PERMISSIONS_OWNER, PERMISSIONS_WAITER, firstOf, ErrorResponse, second, server } from '#jest/harness'
import { currentUserQueryKey } from '@/api/auth'
import { queryClient } from '@/services/queryClient'
import type { OpenOrderRequest } from '@/api/types'
import { enqueueOrder, removeQueued } from '@/store/offlineQueue'
import { useAppearance } from '@/store/appearance'
import { useSession } from '@/store/session'
import { AppShell } from './AppShell'
import type { ShellScreen } from './shellScreens'

const ORDERS_TAKE = 'orders.take'
const CASH_MANAGE = 'cash.manage'
const ACCESS_FORM = 'Formulario de acceso'

const MENU = { name: 'Navegación principal' }
const SIGN_OUT = { name: 'Cerrar sesión' }

function openShell(screens: readonly ShellScreen[] = TEST_SCREENS, en = '/') {
  const routes = [
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
  return mountRoutes(routes, en)
}

// Las pantallas reales del registro, con otra carga o precarga en las que se indican.
function withChanges(changes: Record<string, Partial<ShellScreen>>): readonly ShellScreen[] {
  return TEST_SCREENS.map((shellScreen) => ({ ...shellScreen, ...changes[shellScreen.path] }))
}

function sidebar() {
  return firstOf(screen.getAllByRole('navigation', MENU))
}

function bottomBar() {
  return second(screen.getAllByRole('navigation', MENU))
}

function links(zone: HTMLElement): string[] {
  return within(zone).getAllByRole('link').map((link) => link.textContent)
}

afterEach(() => {
  removeQueued('pedido-en-cola')
  useAppearance.getState().reset()
})

describe('AppShell', () => {
  it('si falla la actualización de la cuenta en segundo plano, no avisa: la sesión guardada sigue sirviendo', async () => {
    server().on('get', '/auth/me', new ErrorResponse(503, 'No hay conexión con la base de datos.'))
    signInAs(PERMISSIONS_WAITER)
    openShell()

    await waitFor(() => {
      expect(queryClient.getQueryState(currentUserQueryKey)?.status).toBe('error')
    })
    expect(screen.queryByText('No hay conexión con la base de datos.')).not.toBeInTheDocument()
    expect(screen.getByText('Pantalla de inicio')).toBeInTheDocument()
  })

  it('el mesero solo ve en el menú las pantallas de sus permisos', () => {
    server()
    signInAs(PERMISSIONS_WAITER)
    openShell()

    expect(links(sidebar())).toEqual(expect.arrayContaining(['Pedidos', 'Cocina', 'Reservas', 'Clientes']))
    expect(within(sidebar()).queryByRole('link', { name: 'Caja' })).not.toBeInTheDocument()
    expect(within(sidebar()).queryByRole('link', { name: 'Resumen' })).not.toBeInTheDocument()
    expect(screen.getByText('Pantalla de inicio')).toBeInTheDocument()
  })

  it('el menú sigue a los permisos y no al nombre del rol', () => {
    server()
    signInAs([ORDERS_TAKE, CASH_MANAGE], {
      user: { id: 7, email: 'ana@resthub.dev', full_name: 'Ana Torres', role_id: 9, role_label: 'Mesero' },
    })
    openShell()

    expect(within(sidebar()).getByRole('link', { name: 'Caja' })).toBeInTheDocument()
    expect(within(sidebar()).queryByRole('link', { name: 'Reservas' })).not.toBeInTheDocument()
  })

  it('quien lleva el local trae de fábrica una barra de abajo con pedidos, tablero, caja y resumen', () => {
    server()
    signInAs(PERMISSIONS_OWNER)
    openShell()

    expect(links(bottomBar())).toEqual(['Pedidos', 'Tablero', 'Caja', 'Resumen'])
  })

  it('en el celular caben cuatro pantallas y el resto va en «Más»', async () => {
    server()
    signInAs(PERMISSIONS_OWNER)
    useAppearance.getState().change({ menu: { order: [], bottom: ['/pedidos', '/tablero', '/cocina', '/reservas'] } })
    const { user } = openShell()

    expect(links(bottomBar())).toEqual(['Pedidos', 'Tablero', 'Cocina', 'Reservas'])
    await user.click(within(bottomBar()).getByRole('button', { name: 'Más' }))

    const panel = await screen.findByRole('dialog')
    expect(within(panel).getByRole('link', { name: 'Caja' })).toBeInTheDocument()
    await user.click(within(panel).getByRole('link', { name: 'Caja' }))
    expect(await screen.findByText('Pantalla de caja')).toBeInTheDocument()
  })

  it('sin pantallas de sobra, el último botón es «Cuenta»', () => {
    server()
    signInAs([ORDERS_TAKE])
    openShell()

    expect(within(bottomBar()).getByRole('button', { name: 'Cuenta' })).toBeInTheDocument()
  })
})

describe('AppShell: sesión y precargas', () => {
  it('cerrar sesión vacía la sesión, lleva al acceso y avisa la salida al servidor', async () => {
    const api = server().on('post', '/auth/logout', null, 204)
    signInAs(PERMISSIONS_WAITER)
    const { user } = openShell()

    await user.click(screen.getByRole('button', SIGN_OUT))

    expect(await screen.findByText(ACCESS_FORM)).toBeInTheDocument()
    expect(useSession.getState().account).toBeNull()
    await waitFor(() => {
      expect(api.calls('post', '/auth/logout')).toHaveLength(1)
    })
  })

  it('con pedidos sin enviar, pregunta antes de cerrar la sesión', async () => {
    server()
    const account = signInAs(PERMISSIONS_WAITER)
    enqueueOrder({
      userId: account.user.id,
      restaurantId: account.restaurant.id,
      request: { client_request_id: 'pedido-en-cola' } as OpenOrderRequest,
      queuedAt: '2026-09-26T13:00:00Z',
      label: 'Mesa 3',
    })
    const { user } = openShell()

    await user.click(screen.getByRole('button', SIGN_OUT))

    const notice = await screen.findByRole('alertdialog')
    expect(within(notice).getByText(/Un pedido tuyo espera señal: Mesa 3/u)).toBeInTheDocument()
    expect(useSession.getState().account).not.toBeNull()
    await user.click(within(notice).getByRole('button', SIGN_OUT))
    expect(await screen.findByText(ACCESS_FORM)).toBeInTheDocument()
  })

  it('sin sesión solo muestra la marca y el contenido del acceso', () => {
    server()
    openShell(TEST_SCREENS, '/acceso')

    expect(screen.getByText(ACCESS_FORM)).toBeInTheDocument()
    expect(screen.queryByRole('navigation', MENU)).not.toBeInTheDocument()
  })

  it('relee la cuenta con /auth/me y muestra el nombre nuevo del local', async () => {
    const updated = signInAs(PERMISSIONS_WAITER)
    server().on('get', '/auth/me', { ...updated, restaurant: { ...updated.restaurant, name: 'Picantería Renovada' } })
    openShell()

    expect((await screen.findAllByText('Picantería Renovada')).length).toBeGreaterThan(0)
  })

  it('no baja pantallas en reposo; al acercarse al enlace baja solo la permitida', async () => {
    server()
    signInAs(PERMISSIONS_WAITER)
    const cashRegister = jest.fn(() => Promise.resolve())
    const kitchen = jest.fn(() => Promise.resolve())
    const { user } = openShell(withChanges({ '/caja': { load: cashRegister }, '/cocina': { load: kitchen } }))

    expect(kitchen).not.toHaveBeenCalled()
    expect(cashRegister).not.toHaveBeenCalled()
    await user.hover(within(sidebar()).getByRole('link', { name: 'Cocina' }))
    expect(kitchen).toHaveBeenCalledTimes(1)
    expect(cashRegister).not.toHaveBeenCalled()
  })

  it('acercarse a un enlace del menú adelanta los datos de esa pantalla', async () => {
    server()
    signInAs(PERMISSIONS_OWNER)
    const prefetch = jest.fn()
    const { user } = openShell(withChanges({ '/caja': { prefetch } }))

    await user.hover(within(sidebar()).getByRole('link', { name: 'Caja' }))

    expect(prefetch).toHaveBeenCalled()
  })
})
