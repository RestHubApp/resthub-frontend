import { PERMISSION } from '@/api/permissions'
import { asDefault } from '@/components/lazyNamed'
import * as icons from '@/components/icons'
import { routePatterns } from '@/services/paths'
import { prefetchOf, type Screen } from './screenTypes'

/** Las pantallas de pedidos y cocina. */
export const ORDERS_SCREENS: readonly Screen[] = [
  {
    path: routePatterns.orders,
    permission: PERMISSION.ordersTake,
    nav: {
      label: 'Pedidos',
      icon: icons.order,
      description: 'Tomar pedidos por mesa o para llevar, enviarlos a cocina y marcarlos servidos.',
    },
    load: asDefault(() => import('@/features/orders/OrdersView'), 'OrdersView'),
    offline: true,
    prefetch: prefetchOf(() => import('@/features/orders/prefetchOrders'), 'prefetchFloor'),
  },
  { path: routePatterns.newOrder, permission: PERMISSION.ordersTake, offline: true, load: asDefault(() => import('@/features/orders/NewOrderView'), 'NewOrderView') },
  { path: routePatterns.orderDetail, permission: PERMISSION.ordersTake, offline: true, load: asDefault(() => import('@/features/orders/OrderDetailView'), 'OrderDetailView') },
  { path: routePatterns.addItems, permission: PERMISSION.ordersTake, offline: true, load: asDefault(() => import('@/features/orders/AddItemsView'), 'AddItemsView') },
]
