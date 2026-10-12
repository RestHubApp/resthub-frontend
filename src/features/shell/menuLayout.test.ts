import { describe, expect, it } from '@jest/globals'

import { BOTTOM_BAR_SLOTS, DEFAULT_MENU } from '@/services/appearanceRules'
import { layoutMenu, moveEntry, orderEntries, toggleBottom } from './menuLayout'
import { entriesFor } from './navigation'
import type { ShellScreen } from './shellScreens'

const ORDERS = '/pedidos'
const BOARD = '/tablero'
const KITCHEN = '/cocina'
const CASH = '/caja'
const PATHS = [ORDERS, BOARD, KITCHEN, '/reservas', '/clientes', CASH] as const
const WAITER_PERMISSIONS = ['orders.take', 'reservations.read'] as const
const OWNER_PERMISSIONS = ['orders.take', 'orders.read_all', 'orders.manage', 'reservations.read', 'customers.read', 'cash.manage'] as const

const SCREENS: readonly ShellScreen[] = PATHS.map((path, index) => ({
  path,
  permission: OWNER_PERMISSIONS[index] ?? WAITER_PERMISSIONS[0],
  nav: { label: path.slice(1), icon: 'order', description: path },
}))

const ALL = entriesFor(SCREENS, OWNER_PERMISSIONS)

function paths(entries: readonly { readonly to: string }[]): string[] {
  return entries.map((entry) => entry.to)
}

describe('orderEntries', () => {
  it('sin orden guardado deja el de fábrica', () => {
    expect(paths(orderEntries(ALL, []))).toEqual([...PATHS])
  })

  it('pone primero lo guardado, en ese orden', () => {
    expect(paths(orderEntries(ALL, [CASH, KITCHEN]))).toEqual([CASH, KITCHEN, ORDERS, BOARD, '/reservas', '/clientes'])
  })

  it('ignora lo guardado que la cuenta ya no puede ver y nunca agrega lo que no tiene', () => {
    const waiter = entriesFor(SCREENS, WAITER_PERMISSIONS)

    expect(paths(orderEntries(waiter, [CASH, '/reservas', '/plataforma', ORDERS]))).toEqual(['/reservas', ORDERS])
  })

  it('una entrada que el orden guardado no conoce va al final, en el orden de fábrica', () => {
    expect(paths(orderEntries(ALL, ['/clientes', ORDERS]))).toEqual(['/clientes', ORDERS, BOARD, KITCHEN, '/reservas', CASH])
  })
})

describe('layoutMenu', () => {
  it('por omisión la barra de abajo son las primeras cuatro y el resto va en «Más»', () => {
    const layout = layoutMenu(ALL, DEFAULT_MENU)

    expect(paths(layout.bar)).toEqual([ORDERS, BOARD, KITCHEN, '/reservas'])
    expect(paths(layout.rest)).toEqual(['/clientes', CASH])
  })

  it('con barra elegida respeta el orden del menú y no pasa de cuatro', () => {
    const layout = layoutMenu(ALL, { order: [CASH], bottom: ['/clientes', CASH, ORDERS, KITCHEN, BOARD] })

    expect(paths(layout.bar)).toEqual([CASH, ORDERS, BOARD, KITCHEN].slice(0, BOTTOM_BAR_SLOTS))
    expect(paths(layout.rest)).toEqual(['/reservas', '/clientes'])
  })

  it('una ruta de la barra que la cuenta no puede ver no aparece ni la reemplaza otra', () => {
    const waiter = entriesFor(SCREENS, WAITER_PERMISSIONS)
    const layout = layoutMenu(waiter, { order: [], bottom: [CASH, '/reservas'] })

    expect(paths(layout.bar)).toEqual(['/reservas'])
    expect(paths(layout.rest)).toEqual([ORDERS])
  })

  it('sin pantallas no hay barra ni «Más» con nada', () => {
    expect(layoutMenu([], { order: [CASH], bottom: [CASH] })).toEqual({ ordered: [], bar: [], rest: [] })
  })
})

describe('moveEntry', () => {
  it('sube y baja una posición, conservando la barra de abajo', () => {
    const layout = layoutMenu(ALL, DEFAULT_MENU)

    const down = moveEntry(layout, 0, 1)
    expect(down.order.slice(0, 3)).toEqual([BOARD, ORDERS, KITCHEN])
    expect(down.bottom).toEqual([ORDERS, BOARD, KITCHEN, '/reservas'])

    const up = moveEntry(layout, 5, -1)
    expect(up.order.slice(-2)).toEqual([CASH, '/clientes'])
  })

  it('en los extremos no cambia el orden', () => {
    const layout = layoutMenu(ALL, DEFAULT_MENU)

    expect(moveEntry(layout, 0, -1).order).toEqual([...PATHS])
    expect(moveEntry(layout, 5, 1).order).toEqual([...PATHS])
  })
})

describe('toggleBottom', () => {
  it('saca una entrada de la barra y la deja en «Más»', () => {
    const next = toggleBottom(layoutMenu(ALL, DEFAULT_MENU), BOARD)

    expect(next.bottom).toEqual([ORDERS, KITCHEN, '/reservas'])
    expect(paths(layoutMenu(ALL, next).rest)).toContain(BOARD)
  })

  it('pone una entrada en la barra si hay lugar', () => {
    const emptied = toggleBottom(layoutMenu(ALL, DEFAULT_MENU), BOARD)

    expect(toggleBottom(layoutMenu(ALL, emptied), CASH).bottom).toEqual([ORDERS, KITCHEN, '/reservas', CASH])
  })

  it('con la barra llena no deja entrar otra', () => {
    expect(toggleBottom(layoutMenu(ALL, DEFAULT_MENU), CASH).bottom).toEqual([ORDERS, BOARD, KITCHEN, '/reservas'])
  })
})
