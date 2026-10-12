import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { mountScreen, server, signInAs } from '#jest/harness'
import type { ActivityEntry } from '@/api/types'
import { ActivityLogView } from './ActivityLogView'

const LOG = '/activity'
const FILTER = 'Mostrar'
const SIGNED_IN = 'Inició sesión'
const OPENED = 'Abrió la ficha de un cliente'
const ANA = 'Ana Torres'
const LUIS = 'Luis Quispe'
const ONE_TOTAL = '1 en total'
const SIGNED_OUT = { id: 3, kind: 'signed_out', kind_label: 'Cerró sesión' } as const
const VIEWED = { id: 2, kind: 'customer_viewed', kind_label: OPENED, detail: 'Rosa Quispe' } as const

function entry(changes: Partial<ActivityEntry> = {}): ActivityEntry {
  return {
    id: 1,
    kind: 'signed_in',
    kind_label: SIGNED_IN,
    detail: '',
    occurred_at: '2026-10-12T15:00:00Z',
    user_id: 7,
    user_name: ANA,
    user_role_id: 1,
    user_role_label: 'Encargado',
    ...changes,
  }
}

const PERSON = 'Persona'
const TEAM = [
  { id: 7, full_name: ANA },
  { id: 8, full_name: LUIS },
]

function open(path = '/', permissions?: Parameters<typeof signInAs>[0]) {
  const api = server()
    .on('get', LOG, (request: { params: Record<string, unknown> }) => {
      if (request.params['user_id'] === '8') return { items: [entry({ id: 5, user_id: 8, user_name: LUIS })], total: 1 }
      if (request.params['group'] === 'sessions') return { items: [entry(SIGNED_OUT)], total: 1 }
      return request.params['group'] === undefined
        ? { items: [entry(), entry(VIEWED)], total: 2 }
        : { items: [entry(VIEWED)], total: 1 }
    })
    .on('get', '/staff', { items: TEAM, total: TEAM.length })
  signInAs(permissions)
  return { api, ...mountScreen(<ActivityLogView />, { en: path }) }
}

describe('ActivityLogView', () => {
  it('lista lo que hizo cada cuenta, con su rol', async () => {
    open()

    const table = await screen.findByRole('region', { name: 'Bitácora del restaurante' })
    expect(await within(table).findByText(SIGNED_IN)).toBeInTheDocument()
    expect(within(table).getAllByText(ANA)).toHaveLength(2)
    expect(within(table).getAllByText('Encargado')).toHaveLength(2)
    expect(screen.getByText('2 en total')).toBeInTheDocument()
  })

  it('«Accesos a datos de clientes» pide la familia customers_access', async () => {
    const { api, user } = open()
    await screen.findByText(SIGNED_IN)

    await user.selectOptions(screen.getByLabelText(FILTER), 'Accesos a datos de clientes')

    expect(await screen.findByText(ONE_TOTAL)).toBeInTheDocument()
    expect(screen.queryByText(SIGNED_IN)).not.toBeInTheDocument()
    expect(screen.getByText(OPENED)).toBeInTheDocument()
    expect(api.calls('get', LOG).at(-1)?.params['group']).toBe('customers_access')
  })

  it('«Entradas y salidas» pide la familia sessions y muestra la salida', async () => {
    const { api, user } = open()
    await screen.findByText(SIGNED_IN)

    await user.selectOptions(screen.getByLabelText(FILTER), 'Entradas y salidas')

    expect(await screen.findByText('Cerró sesión')).toBeInTheDocument()
    expect(api.calls('get', LOG).at(-1)?.params['group']).toBe('sessions')
  })

  it('ofrece todas las familias en español', async () => {
    open()
    await screen.findByText(SIGNED_IN)

    const names = within(screen.getByLabelText(FILTER)).getAllByRole('option').map((option) => option.textContent)

    expect(names).toEqual([
      'Todo',
      'Entradas y salidas',
      'Pedidos',
      'Caja',
      'Accesos a datos de clientes',
      'Inventario',
      'Carta',
      'Personal',
      'Consentimientos del personal',
    ])
  })

  it('abre ya filtrado si la dirección trae ?filtro=accesos (el enlace del aviso)', async () => {
    const { api } = open('/?filtro=accesos')

    expect(await screen.findByText(ONE_TOTAL)).toBeInTheDocument()
    expect(screen.getByLabelText(FILTER)).toHaveValue('accesos')
    expect(api.calls('get', LOG).at(-1)?.params['group']).toBe('customers_access')
  })

  it('elegir una persona pide solo sus movimientos', async () => {
    const { api, user } = open()
    await screen.findByText(SIGNED_IN)

    await user.selectOptions(await screen.findByRole('combobox', { name: PERSON }), LUIS)

    expect(await within(await screen.findByRole('region', { name: 'Bitácora del restaurante' })).findByText(LUIS)).toBeInTheDocument()
    expect(api.calls('get', LOG).at(-1)?.params['user_id']).toBe('8')
  })

  it('abre ya filtrado por persona si la dirección trae ?persona= (el enlace de Personal)', async () => {
    const { api } = open('/?persona=8')

    expect(await screen.findByText(ONE_TOTAL)).toBeInTheDocument()
    expect(await screen.findByRole('combobox', { name: PERSON })).toHaveValue('8')
    expect(api.calls('get', LOG).at(-1)?.params['user_id']).toBe('8')
  })

  it('el filtro y la persona se combinan', async () => {
    const { api, user } = open('/?persona=8')
    await screen.findByText(ONE_TOTAL)

    await user.selectOptions(screen.getByLabelText(FILTER), 'Pedidos')

    const last = api.calls('get', LOG).at(-1)?.params
    expect(last?.['group']).toBe('orders')
    expect(last?.['user_id']).toBe('8')
  })

  it('sin permiso para ver al personal no ofrece elegir persona', async () => {
    open('/', ['activity.read'])
    await screen.findByText(SIGNED_IN)

    expect(screen.queryByRole('combobox', { name: PERSON })).not.toBeInTheDocument()
  })
})
