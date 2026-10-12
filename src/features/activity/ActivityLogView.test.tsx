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

function open(path = '/') {
  const api = server().on('get', LOG, (request: { params: Record<string, unknown> }) =>
    request.params['kind'] === undefined
      ? { items: [entry(), entry(VIEWED)], total: 2 }
      : { items: [entry(VIEWED)], total: 1 },
  )
  signInAs()
  return { api, ...mountScreen(<ActivityLogView />, { en: path }) }
}

describe('ActivityLogView', () => {
  it('lista lo que hizo cada cuenta, con su rol', async () => {
    open()

    const table = await screen.findByRole('region', { name: 'Bitácora del restaurante' })
    expect(await within(table).findByText(SIGNED_IN)).toBeInTheDocument()
    expect(within(table).getAllByText(`${ANA} (Encargado)`)).toHaveLength(2)
    expect(screen.getByText('2 en total')).toBeInTheDocument()
  })

  it('«Accesos a datos de clientes» deja solo los movimientos sobre datos de clientes', async () => {
    const { api, user } = open()
    await screen.findByText(SIGNED_IN)

    await user.selectOptions(screen.getByLabelText(FILTER), 'Accesos a datos de clientes')

    expect(await screen.findByText('1 en total')).toBeInTheDocument()
    expect(screen.queryByText(SIGNED_IN)).not.toBeInTheDocument()
    expect(screen.getByText(OPENED)).toBeInTheDocument()
    expect(api.calls('get', LOG).at(-1)?.params['kind']).toContain('customer_viewed')
  })

  it('abre ya filtrado si la dirección trae ?filtro=accesos (el enlace del aviso)', async () => {
    open('/?filtro=accesos')

    expect(await screen.findByText('1 en total')).toBeInTheDocument()
    expect(screen.getByLabelText(FILTER)).toHaveValue('accesos')
  })
})
