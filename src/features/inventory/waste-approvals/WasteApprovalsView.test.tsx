import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { wasteApproval } from '#jest/fixtures/stockControl'
import { ErrorResponse, mountScreen, server, signInAs } from '#jest/harness'
import { WasteApprovalsView } from './WasteApprovalsView'
import { WasteApprovalsBadge } from './WasteApprovalsBadge'

const APPROVALS = '/inventory/waste-approvals'
const PENDING = wasteApproval()
const REASON = 'No cuadra con cocina'

function open() {
  const api = server().on('get', APPROVALS, ({ params }: { params: Record<string, unknown> }) =>
    params['status'] === 'pending_approval' ? { items: [PENDING], total: 1 } : { items: [], total: 0 },
  )
  signInAs()
  return { api, ...mountScreen(<WasteApprovalsView />, { path: '/mermas-por-aprobar' }) }
}

describe('mermas por aprobar', () => {
  it('aprueba con confirmación: dice cuánto baja el stock y avisa', async () => {
    const { api, user } = open()
    const card = await screen.findByRole('listitem')
    expect(card).toHaveTextContent('Se rompieron dos botellas')
    expect(card).toHaveTextContent('Por aprobar')

    api.on('post', `${APPROVALS}/9/approve`, wasteApproval({ status: 'approved', status_label: 'Aprobada', decided_at: '2026-09-26T14:00:00Z', movement_id: 40 }))
    await user.click(within(card).getByRole('button', { name: 'Aprobar' }))
    const confirm = await screen.findByRole('alertdialog', { name: '¿Aprobar la merma de Pisco?' })
    expect(confirm).toHaveTextContent('Se descuentan 1.5 L del stock')
    await user.click(within(confirm).getByRole('button', { name: 'Aprobar merma' }))

    expect(await screen.findByText('Merma de Pisco aprobada: el stock bajó.')).toBeInTheDocument()
    expect(api.calls('post', `${APPROVALS}/9/approve`)).toHaveLength(1)
  })

  it('rechaza con motivo obligatorio y lo envía', async () => {
    const { api, user } = open()
    await user.click(within(await screen.findByRole('listitem')).getByRole('button', { name: 'Rechazar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Rechazar la merma de Pisco' })
    await user.click(within(dialog).getByRole('button', { name: 'Rechazar merma' }))
    expect(await within(dialog).findByText('Escribe el motivo del rechazo')).toBeInTheDocument()

    api.on('post', `${APPROVALS}/9/reject`, wasteApproval({ status: 'rejected', status_label: 'Rechazada', rejection_reason: REASON }))
    await user.type(within(dialog).getByLabelText('Motivo del rechazo'), REASON)
    await user.click(within(dialog).getByRole('button', { name: 'Rechazar merma' }))

    expect(await screen.findByText('Merma de Pisco rechazada. El stock no cambió.')).toBeInTheDocument()
    expect(api.calls('post', `${APPROVALS}/9/reject`)[0]?.body).toEqual({ reason: REASON })
  })

  it('si otra persona ya la decidió, lo explica por el código y relee la bandeja', async () => {
    const { api, user } = open()
    const card = await screen.findByRole('listitem')
    api.on('post', `${APPROVALS}/9/approve`, new ErrorResponse(409, 'La merma ya fue decidida.', 'waste_already_decided'))
    await user.click(within(card).getByRole('button', { name: 'Aprobar' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Aprobar merma' }))

    expect(await screen.findByText('Esa merma ya fue aprobada o rechazada por otra persona.')).toBeInTheDocument()
    expect(api.calls('get', APPROVALS).length).toBeGreaterThan(1)
  })

  it('las rechazadas muestran el motivo y no ofrecen decidir', async () => {
    const { api, user } = open()
    api.on('get', APPROVALS, {
      items: [wasteApproval({ status: 'rejected', status_label: 'Rechazada', decided_at: '2026-09-26T14:00:00Z', rejection_reason: 'No cuadra' })],
      total: 1,
    })
    await user.click(await screen.findByRole('radio', { name: 'Rechazadas' }))

    const card = await screen.findByRole('listitem')
    expect(card).toHaveTextContent('No cuadra')
    expect(within(card).queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument()
    expect(api.calls('get', APPROVALS).at(-1)?.params).toMatchObject({ status: 'rejected' })
  })
})

describe('insignia del menú', () => {
  it('muestra cuántas esperan', async () => {
    const api = server().on('get', APPROVALS, { items: [PENDING, wasteApproval({ id: 10 })], total: 2 })
    signInAs()
    mountScreen(<WasteApprovalsBadge />)
    expect(await screen.findByText('2', { exact: false })).toHaveTextContent('2 por aprobar')
    expect(api.calls('get', APPROVALS)[0]?.params).toMatchObject({ status: 'pending_approval' })
  })

  it('sin pendientes no muestra nada', async () => {
    const api = server().on('get', APPROVALS, { items: [], total: 0 })
    signInAs()
    mountScreen(<WasteApprovalsBadge />)
    await waitFor(() => {
      expect(api.calls('get', APPROVALS)).toHaveLength(1)
    })
    expect(screen.queryByText('por aprobar', { exact: false })).not.toBeInTheDocument()
  })
})
