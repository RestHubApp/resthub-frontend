import { describe, expect, it } from '@jest/globals'

import { PERMISSION, PLATFORM_PERMISSION } from '@/api/permissions'
import type { AnyPermissionCode } from '@/api/types'
import { routePatterns } from '@/services/paths'
import * as icons from '@/components/icons'
import { defaultBottomPaths } from './defaultBottomBar'
import { entriesFor } from './navigation'
import type { ShellScreen } from './shellScreens'

// Las pantallas del menú en su orden de fábrica, con el permiso que cada una exige.
const REGISTRY: readonly (readonly [string, AnyPermissionCode])[] = [
  [routePatterns.orders, PERMISSION.ordersTake],
  [routePatterns.board, PERMISSION.ordersReadAll],
  [routePatterns.kitchen, PERMISSION.ordersTake],
  [routePatterns.reservations, PERMISSION.reservationsRead],
  [routePatterns.customers, PERMISSION.customersRead],
  [routePatterns.cash, PERMISSION.cashManage],
  [routePatterns.billing, PERMISSION.billingManage],
  [routePatterns.menu, PERMISSION.menuManage],
  [routePatterns.tables, PERMISSION.tablesManage],
  [routePatterns.inventory, PERMISSION.inventoryRead],
  [routePatterns.staff, PERMISSION.staffManage],
  [routePatterns.insights, PERMISSION.insightsRead],
  [routePatterns.platform, PLATFORM_PERMISSION.restaurantsRead],
  [routePatterns.activity, PLATFORM_PERMISSION.activityRead],
  [routePatterns.platformPreview, PLATFORM_PERMISSION.previewOpen],
  [routePatterns.observability, PLATFORM_PERMISSION.observabilityRead],
]

const SCREENS: readonly ShellScreen[] = REGISTRY.map(([path, permission]) => ({
  path,
  permission,
  nav: { label: path.slice(1), icon: icons.order, description: path },
}))

function barFor(permissions: Parameters<typeof entriesFor>[1]): readonly string[] {
  return defaultBottomPaths(entriesFor(SCREENS, permissions))
}

describe('defaultBottomPaths: la barra de abajo de fábrica sale de los permisos, no del nombre del rol', () => {
  it('quien toma pedidos en el salón: pedidos, cocina, reservas y clientes', () => {
    const waiter = [PERMISSION.ordersTake, PERMISSION.reservationsRead, PERMISSION.customersRead, PERMISSION.menuRead]

    expect(barFor(waiter)).toEqual([routePatterns.orders, routePatterns.kitchen, routePatterns.reservations, routePatterns.customers])
  })

  it('quien lleva el local: pedidos, tablero, caja y resumen', () => {
    const owner = [
      PERMISSION.ordersTake,
      PERMISSION.ordersReadAll,
      PERMISSION.reservationsRead,
      PERMISSION.cashManage,
      PERMISSION.insightsRead,
      PERMISSION.staffManage,
    ]

    expect(barFor(owner)).toEqual([routePatterns.orders, routePatterns.board, routePatterns.cash, routePatterns.insights])
  })

  it('quien ve todos los pedidos sin llevar caja ni resumen: tablero, cocina, inventario y pedidos', () => {
    const kitchen = [PERMISSION.ordersReadAll, PERMISSION.ordersTake, PERMISSION.inventoryRead, PERMISSION.reservationsRead]

    expect(barFor(kitchen)).toEqual([routePatterns.board, routePatterns.kitchen, routePatterns.inventory, routePatterns.orders])
  })

  it('la administración del sistema: restaurantes, vista previa, observabilidad y bitácora', () => {
    const admin = [
      PLATFORM_PERMISSION.restaurantsRead,
      PLATFORM_PERMISSION.activityRead,
      PLATFORM_PERMISSION.previewOpen,
      PLATFORM_PERMISSION.observabilityRead,
    ]

    expect(new Set(barFor(admin))).toEqual(
      new Set([routePatterns.platform, routePatterns.platformPreview, routePatterns.observability, routePatterns.activity]),
    )
  })

  it('un rol con otro nombre pero los mismos permisos recibe la misma barra', () => {
    const permissions = [PERMISSION.ordersTake, PERMISSION.cashManage, PERMISSION.insightsRead, PERMISSION.ordersReadAll]

    expect(barFor(permissions)).toEqual(barFor([...permissions].reverse()))
  })

  it('nunca ofrece una pantalla que la cuenta no puede abrir: lo que falta se completa con el menú', () => {
    const limited = [PERMISSION.cashManage, PERMISSION.menuManage]
    const bar = barFor(limited)

    expect(bar).toEqual([routePatterns.cash, routePatterns.menu])
    expect(bar).not.toContain(routePatterns.orders)
  })

  it('una cuenta sin pantallas tiene la barra vacía', () => {
    expect(barFor([])).toEqual([])
  })
})
