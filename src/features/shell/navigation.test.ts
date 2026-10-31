import { describe, expect, it } from '@jest/globals'

import * as icons from '@/components/icons'
import { entriesFor, isCurrentEntry, type NavEntry } from './navigation'
import type { ShellScreen } from './shellScreens'

const PLATFORM = '/plataforma'
const RESTAURANTS_READ = 'platform.restaurants.read'
const ACTIVITY_READ = 'platform.activity.read'
const RESTAURANTS_PREFIX = '/plataforma/restaurantes/'
const TAKE = 'orders.take'
const ORDERS = '/pedidos'
const LOG = '/plataforma/bitacora'

const SCREENS: readonly ShellScreen[] = [
  { path: ORDERS, permission: TAKE, nav: { label: 'Pedidos', icon: icons.order, description: 'Pedidos.' } },
  {
    path: PLATFORM,
    permission: RESTAURANTS_READ,
    nav: { label: 'Restaurantes', icon: icons.restaurant, description: 'Restaurantes.', activeOn: [RESTAURANTS_PREFIX] },
  },
  {
    path: LOG,
    permission: ACTIVITY_READ,
    nav: { label: 'Bitácora', icon: icons.history, description: 'Bitácora.' },
  },
  { path: '/perfil' },
]

describe('entriesFor', () => {
  it('ofrece solo lo que los permisos de la cuenta abren, sean del restaurante o de plataforma', () => {
    expect(entriesFor(SCREENS, [TAKE]).map((entry) => entry.label)).toEqual(['Pedidos'])
    expect(entriesFor(SCREENS, [ACTIVITY_READ, RESTAURANTS_READ]).map((entry) => entry.label)).toEqual([
      'Restaurantes',
      'Bitácora',
    ])
    expect(entriesFor(SCREENS, [])).toEqual([])
  })
})

describe('isCurrentEntry', () => {
  const [orders, restaurants, log] = entriesFor(SCREENS, [TAKE, RESTAURANTS_READ, ACTIVITY_READ]) as [
    NavEntry,
    NavEntry,
    NavEntry,
  ]

  it('marca la pantalla y lo que cuelga de ella', () => {
    expect(isCurrentEntry(orders, ORDERS)).toBe(true)
    expect(isCurrentEntry(orders, '/pedidos/12')).toBe(true)
    expect(isCurrentEntry(orders, '/pedidosx')).toBe(false)
  })

  it('con `activeOn` solo marca su ruta y esos prefijos, no todo lo que empieza igual', () => {
    expect(isCurrentEntry(restaurants, PLATFORM)).toBe(true)
    expect(isCurrentEntry(restaurants, '/plataforma/restaurantes/4')).toBe(true)
    expect(isCurrentEntry(restaurants, '/plataforma/restaurantes/nuevo')).toBe(true)
    expect(isCurrentEntry(restaurants, LOG)).toBe(false)
    expect(isCurrentEntry(log, LOG)).toBe(true)
  })
})
