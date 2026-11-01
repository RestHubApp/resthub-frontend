import { PERMISSION } from '@/api/permissions'
import { asDefault } from '@/components/lazyNamed'
import * as icons from '@/components/icons'
import { routePatterns } from '@/services/paths'
import { prefetchOf, type Screen } from './screenTypes'

/** Las pantallas del tablero, el historial, la cocina y la impresión. */
export const BOARD_SCREENS: readonly Screen[] = [
  {
    path: routePatterns.board,
    permission: PERMISSION.ordersReadAll,
    nav: { label: 'Tablero', icon: icons.board, description: 'Los pedidos del día en vivo, de la cocina al cobro.' },
    load: asDefault(() => import('@/features/orders/BoardView'), 'BoardView'),
    prefetch: prefetchOf(() => import('@/features/orders/prefetchOrders'), 'prefetchBoard'),
  },
  { path: routePatterns.history, permission: PERMISSION.ordersReadAll, load: asDefault(() => import('@/features/orders/HistoryView'), 'HistoryView') },
  {
    path: routePatterns.kitchen,
    permission: PERMISSION.ordersTake,
    nav: {
      label: 'Cocina',
      icon: icons.kitchen,
      description: 'Lo que falta preparar, en tarjetas grandes para la pantalla de la cocina.',
    },
    load: asDefault(() => import('@/features/orders/KitchenView'), 'KitchenView'),
    prefetch: prefetchOf(() => import('@/features/orders/prefetchOrders'), 'prefetchKitchen'),
  },
  { path: routePatterns.print, permission: PERMISSION.ordersTake, load: asDefault(() => import('@/features/orders/PrintView'), 'PrintView') },
]
